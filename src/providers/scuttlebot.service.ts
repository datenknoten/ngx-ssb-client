/**
 * @license MIT
 */

import {
    Injectable,
} from '@angular/core';
import {
    Store,
} from '@ngxs/store';
import { validate } from 'class-validator';
import * as moment from 'moment';

import {
    AddVoting,
    LoadFeed,
    SetChannelSubscription,
    SetContact,
    UpdateIdentity,
    UpdateMessageCount,
    UpdatePost,
} from '../actions';
import {
    FeedEndError,
} from '../errors';
import {
    IdentityDescriptionModel,
    IdentityImageModel,
    IdentityModel,
    IdentityNameModel,
    LinkModel,
    PostModel,
    VotingModel,
} from '../models';

import { HelperService } from './helper.service';

const util = window.require('util');
const split = require('split-buffer');
const pull = window.require('pull-stream');

@Injectable()
export class ScuttlebotService {

    public counter = 0;
    private bot: any;

    private lastUpdate?: number;
    public constructor(
        private store: Store,
        private helper: HelperService,
    ) {
        // tslint:disable-next-line:no-floating-promises
        this.init();
    }

    public async updateFeed(loadMore: boolean = false) {
        this.store.dispatch(new LoadFeed(true));
        const ltFilter = (
            (loadMore === true && typeof this.lastUpdate === 'number') ?
                this.lastUpdate : undefined
        );
        const query = {
            // live: true,
            limit: 50,
            reverse: true,
            query: [{
                $filter: {
                    timestamp: {
                        $lt: ltFilter,
                    },
                    value: {
                        timestamp: {
                            // forces results ordered by published time
                            $gt: 0,
                        },
                        content: {
                            type: 'post',
                            // root: { $is: 'undefined' },
                        },
                    },
                },
            }],
        };
        const feed = this.bot.query.read(query);
        await this.drainFeed(feed, async (packet: any) => {
            await this.parsePacket(packet);
            if ((typeof this.lastUpdate === 'undefined') || (packet.timestamp < this.lastUpdate)) {
                this.lastUpdate = packet.timestamp;
            }
        });

        this.store.dispatch(new LoadFeed(false));
    }

    public async publishPost(post: PostModel) {
        const validationErrors = await validate(post);
        if (validationErrors.length > 0) {
            throw validationErrors[0];
        }

        const json: any = {
            text: post.content,
            type: 'post',
        };

        // TODO validate proper
        if (typeof post.rootId === 'string') {
            json['root'] = post.rootId;
        }

        if (typeof post.primaryChannel === 'string') {
            json['channel'] = post.primaryChannel;
        }

        if (post.mentions.length > 0) {
            json['mentions'] = [];
            for (const item of post.mentions) {
                json['mentions'].push(JSON.parse(JSON.stringify(item)));
            }
        }

        const publish = util.promisify(this.bot.publish);

        await publish(json);
    }

    public async publishVoting(voting: VotingModel) {
        const validationErrors = await validate(voting);
        if (validationErrors.length > 0) {
            throw validationErrors[0];
        }

        const json = {
            type: 'vote',
            vote: {
                link: voting.link,
                value: voting.value,
                reason: voting.reason,
            },
        };

        const publish = util.promisify(this.bot.publish);

        await publish(json);
    }

    public async publish(message: PostModel | VotingModel) {
        if (message instanceof PostModel) {
            return this.publishPost(message);
        } else if (message instanceof VotingModel) {
            return this.publishVoting(message);
        } else {
            throw new Error('Invalid Model');
        }
    }

    public async createBlob(file: File): Promise<string> {
        if (!(file instanceof File)) {
            throw new Error('Invalid File');
        }

        if (file.size > (5 * 1024 * 1024)) {
            throw new Error('FileSize limit at 5MB');
        }

        const reader = new FileReader();
        reader.readAsArrayBuffer(file);
        const parts = await new Promise<Buffer[]>((resolve) => {
            reader.onload = () => {
                resolve(split(new Buffer(reader.result), 64 * 1024));
            };
        });

        return new Promise<string>((resolve, reject) => {
            const feed = this.bot.blobs.add((error: any, cb: any) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(cb);
            });
            feed((_abort: any, cb: any) => {
                for (const part of parts) {
                    cb(false, part);
                }
                cb(true);
            });
        });
    }

    public async get(id?: string): Promise<void> {
        if (!(typeof id === 'string')) {
            return;
        }
        const count = this
            .store
            .selectSnapshot((state: { posts: PostModel[] }) => state
                .posts
                .filter(item => item.id === id)
                .length,
        );
        if (count > 0) {
            return;
        }
        const get = util.promisify(this.bot.get);
        try {
            const packet = await get(id);
            if (packet && packet.content) {
                await this.parsePacket({
                    key: id,
                    value: packet,
                });
            }
        } catch (error) {
            if (error.name !== 'NotFoundError') {
                throw error;
            }
        }
    }

    public async searchBlobs(searchTerm?: string): Promise<any> {
        if (typeof searchTerm !== 'string') {
            return;
        }

        if (searchTerm.length < 4) {
            return;
        }

        return new Promise((resolve, reject) => {
            this.bot.meme.search(searchTerm, (err: any, results: any) => {
                if (err) {
                    reject(err);
                    return;
                }

                resolve(results);
            });
        });
    }

    public async fetchChannelSubscriptions(id: string) {
        const stream = pull(
            this.bot.createUserStream({ id }),
            pull.filter((msg: any) => {
                return !msg.value || msg.value.content.type === 'channel';
            }),
        );

        await this.drainFeed(stream, this.parsePacket);
    }

    public async fetchIdentityPosts(id: string) {
        this.store.dispatch(new LoadFeed(true));
        const stream = pull(
            this.bot.createUserStream({
                id,
                limit: 100,
                reverse: true,
            }),
            pull.filter((msg: any) => {
                return !msg.value || msg.value.content.type === 'post';
            }),
        );

        await this.drainFeed(stream, this.parsePacket);
        this.store.dispatch(new LoadFeed(false));
    }

    public async fetchChannelPosts(channel: string) {
        this.store.dispatch(new LoadFeed(true));
        const filter = {
            // live: true,
            reverse: true,
            query: [{
                $filter: {
                    value: {
                        timestamp: { $gt: 0 }, // forces results ordered by published time
                        content: {
                            type: 'post',
                            channel: channel,
                        },
                    },
                },
            }],
        };
        const stream = pull(
            this.bot.query.read(filter),
            this.helper.take(20),
        );

        await this.drainFeed(stream, this.parsePacket);
        this.store.dispatch(new LoadFeed(false));
    }

    public async fetchPostVotings(post: PostModel) {
        const query = {
            rel: 'vote',
            dest: post.id,
        };
        const feed = this.bot.links(query);
        return this.drainFeed(feed, async (packet: any) => {
            await this.get(packet.key);
        });
    }

    private async fetchThread(id: string) {
        await this.get(id);

        const feed = this.bot.links({
            rel: 'root',
            dest: id,
            values: true,
            keys: true,
        });
        await this.drainFeed(feed, async (data: any) => {
            const _id = data.key;
            const post = this
                .store
                .selectSnapshot((state: { posts: PostModel[] }) => state
                    .posts
                    .filter(item => item.id === _id),
            );
            if ((post instanceof PostModel) && !post.isMissing) {
                return;
            }
            await this.parsePost(_id, data.value);
        });
    }

    private async init() {
        const ssbClient = util.promisify(window.require('ssb-client'));

        this.bot = await ssbClient();

        const whoami = await this.getFeedItem(this.bot.whoami);

        await this.fetchIdentity(whoami.id, true);

        await this.fetchChannelSubscriptions(whoami.id);

        await this.fetchContacts(whoami.id);

        await this.updateFeed();
    }

    private async getFeedItem(feed: any): Promise<any> {
        const result = await new Promise<any>((resolve, reject) => {

            feed(undefined, (err?: Error | boolean | null, _data?: any) => {
                if (typeof err === 'boolean') {
                    resolve(new FeedEndError());
                    return;
                }
                if (!(typeof err === 'undefined' || err === null)) {
                    reject(err);
                    return;
                }
                resolve(_data);
            });
        });

        if (result instanceof FeedEndError) {
            throw result;
        } else {
            return result;
        }
    }

    private extractFollowers(id: string, data: any) {
        const followers = [];
        for (const key of Object.keys(data)) {
            const _id = Object
                .keys(data[key])
                .indexOf(id);

            if ((_id >= 0) && (data[key][id])) {
                followers.push(key);
            }
        }

        return followers;
    }

    private extractFollowing(id: string, data: any) {
        const following = [];

        if (data[id]) {
            for (const key of Object.keys(data[id])) {
                if (data[id][key]) {
                    following.push(key);
                }
            }
        }

        return following;
    }

    private async fetchContacts(id?: string) {
        if (!(typeof id === 'string')) {
            return;
        }

        if (!id.startsWith('@')) {
            return;
        }

        const feed = this.bot.friends.stream({ live: true });

        const data = await this.getFeedItem(feed);

        if (!(typeof data === 'object')) {
            return;
        }

        const followers = this.extractFollowers(id, data);

        const following = this.extractFollowing(id, data);

        for (const follower of followers) {
            // tslint:disable-next-line:no-floating-promises
            this.fetchIdentity(follower);
            this.store.dispatch(new SetContact(
                follower,
                id,
            ));
        }

        for (const followee of following) {
            // tslint:disable-next-line:no-floating-promises
            this.fetchIdentity(followee);
            this.store.dispatch(new SetContact(
                id,
                followee,
            ));
        }
    }

    private async fetchIdentityNames(id: string, isSelf: boolean = false) {
        const names = await new Promise<any>((resolve, _reject) => {
            this.bot.names.getSignifier(id, (_err: any, _names: any) => {
                resolve(_names);
            });
        });

        if (typeof names === 'string') {
            const _name = new IdentityNameModel();
            _name.name = names;
            _name.weight = 1;

            this.store.dispatch(new UpdateIdentity(
                id,
                _name,
                isSelf,
            ));
        }
    }

    private async fetchIdentityImages(id: string, isSelf: boolean = false) {
        const images = await new Promise<any>((resolve, _reject) => {
            this.bot.names.getImageFor(id, (_err: any, _images: any) => {
                resolve(_images);
            });
        });

        if (typeof images === 'string') {
            const _image = new IdentityImageModel();
            _image.blobId = images;
            _image.weight = 1;

            this.store.dispatch(new UpdateIdentity(
                id,
                _image,
                isSelf,
            ));
        }
    }

    private async fetchIdentity(id?: string, isSelf: boolean = false) {
        if (!(typeof id === 'string')) {
            return;
        }

        if (!id.startsWith('@')) {
            return;
        }

        await this.fetchIdentityNames(id, isSelf);

        await this.fetchIdentityImages(id, isSelf);

        const feed = this.bot.links({ dest: id, rel: 'about', values: true });
        return this.drainFeed(feed, (data: any) => {
            this.store.dispatch(new UpdateMessageCount());
            if (!(data && data.value && data.value.content)) {
                return;
            }

            let imageId;

            if (data.value.content.image && typeof data.value.content.image === 'object') {
                imageId = data.value.content.image.link;
            } else {
                imageId = data.value.content.image;
            }

            if (imageId) {
                const image = new IdentityImageModel();
                image.blobId = imageId;
                image.weight = 0;
                this.store.dispatch(new UpdateIdentity(
                    data.value.content.about,
                    image,
                    isSelf,
                ));
            }

            if (data.value.content.name) {
                const name = new IdentityNameModel();
                name.name = data.value.content.name;
                name.weight = 0;
                this.store.dispatch(new UpdateIdentity(
                    data.value.content.about,
                    name,
                    isSelf,
                ));
            }

            if (data.value.content.description) {
                const description = new IdentityDescriptionModel();
                description.description = data.value.content.description;
                description.date = moment(data.value.timestamp).toDate();

                this.store.dispatch(new UpdateIdentity(
                    data.value.content.about,
                    description,
                    isSelf,
                ));
            }
        });
    }

    private async parsePost(id: string, packet: any) {
        const post = new PostModel();
        post.id = id;
        post.raw = packet;
        post.primaryChannel = packet.content.channel;
        post.authorId = packet.author;
        post.author = this
            .store
            .selectSnapshot<IdentityModel[]>((state) => state.identities)
            .filter(item => item.id === packet.author)
            .pop();
        post.votes = this
            .store
            .selectSnapshot<VotingModel[]>((state) => state.votings)
            .filter(item => item.link === post.id);
        post.date = moment(packet.timestamp)
            .toDate();
        post.content = packet.content.text;
        post.rootId = packet.content.root;
        if (Array.isArray(packet.content.mentions)) {
            for (const mention of packet.content.mentions) {
                post.mentions.push(new LinkModel({ link: mention.link }));
            }
        }
        this.store.dispatch(new UpdatePost(post));
        await this.fetchPostVotings(post);
        if (!(post.author instanceof IdentityModel) ||
            ((post.author instanceof IdentityModel) && post.author.isMissing)) {
            await this.fetchIdentity(post.authorId);
        }
        if (typeof post.rootId === 'string') {
            // got a non root node, fetch the root
            await this.get(packet.content.root);
        } else {
            // got a root node, fetch the whole thread
            await this.fetchThread(post.id);
        }
    }

    private async parsePacket(_packet: any) {
        this.store.dispatch(new UpdateMessageCount());
        const id = _packet.key;
        const packet = _packet.value;
        if (!(typeof packet.content === 'object')) {
            return;
        }

        const packetType = packet.content.type;

        if (packetType === 'post') {
            await this.parsePost(id, packet);
        } else if (packetType === 'vote') {
            const voting = new VotingModel();
            voting.id = id;
            voting.date = moment(packet.timestamp)
                .toDate();
            voting.value = packet.content.vote.value;
            voting.reason = packet.content.vote.expression;
            voting.link = packet.content.vote.link;
            voting.authorId = packet.author;
            voting.author = this
                .store
                .selectSnapshot<IdentityModel[]>((state) => state.identities)
                .filter(item => item.id === packet.author)
                .pop();
            if (!(voting.author instanceof IdentityModel)) {
                await this.fetchIdentity(voting.authorId);
            }
            this.store.dispatch(new AddVoting(voting));
        } else if (packetType === 'channel') {
            this.store.dispatch(new SetChannelSubscription(
                packet.author,
                packet.content.channel,
                packet.content.subscribed,
                moment(packet.timestamp)
                    .toDate(),
            ));
        }
    }

    private async drainFeed(feed: any, callback: Function): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            pull(
                feed,
                pull.collect(async (err: any, data: any) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    for (const item of data) {
                        // setImmediate(() => {
                        await callback.bind(this, item)();
                        // });
                    }
                    resolve();
                }),
            );
        });
    }
}
