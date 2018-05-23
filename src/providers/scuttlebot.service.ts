/**
 * @license MIT
 */

import {
    Injectable,
} from '@angular/core';
import {
    Store,
} from '@ngxs/store';
import {
    PostModel,
    IdentityModel,
    VotingModel,
    LinkModel,
    IdentityNameModel,
    IdentityImageModel,
} from '../models';
import * as moment from 'moment';
import {
    UpdatePost,
    UpdateIdentity,
    AddVoting,
    SetContact,
    SetChannelSubscription,
    LoadFeed,
    UpdateMessageCount,
} from '../actions';
import {
    FeedEndError,
} from '../errors';
import { validate } from 'class-validator';
const util = window.require('util');
const split = require('split-buffer');
const pull = window.require('pull-stream');

@Injectable()
export class ScuttlebotService {

    public counter = 0;
    private bot: any;
    public constructor(
        private store: Store,
    ) {
        // tslint:disable-next-line:no-floating-promises
        this.init();
    }

    public async updateFeed(itemCount: number = 500) {
        this.store.dispatch(new LoadFeed(true));
        const feed = this.bot.createFeedStream({
            reverse: true,
            limit: itemCount,
        });

        return this.drainFeed(feed, this.parsePacket.bind(this));

    }

    public async publishPost(post: PostModel) {
        const validationErrors = await validate(post);
        if (validationErrors.length > 0) {
            throw validationErrors[0];
        }

        const json: any = {
            text: post.content,
            type: 'post'
        };

        if (post.rootId) {
            json['root'] = post.rootId;
        }

        if (post.primaryChannel) {
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
            }
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
        if (!file) {
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

    public async get(id: string): Promise<void> {
        if (!id) {
            return;
        }
        const count = this.store.selectSnapshot((state: { posts: PostModel[] }) => state.posts.filter(item => item.id === id).length);
        if (count > 0) {
            return;
        }
        const get = util.promisify(this.bot.get);
        try {
            const packet = await get(id);
            if (packet && packet.content) {
                this.parsePacket({
                    key: id,
                    value: packet,
                });
            }
        } catch (error) {
            if (error.name !== 'NotFoundError') {
                throw error;
            } else {
            }
        }
    }

    private async init() {
        const ssbClient = util.promisify(window.require('ssb-client'));

        this.bot = await ssbClient();

        const whoami = await this.getFeedItem(this.bot.whoami);

        await this.fetchIdentity(whoami.id, true);

        await this.fetchContacts(whoami.id);

        const userFeed = this.bot.createUserStream({
            id: whoami.id,
        });

        await this.drainFeed(userFeed, this.parsePacket.bind(this));

        this.store.dispatch(new UpdateMessageCount(true));
        await this.updateFeed(4000);
    }

    private async getFeedItem(feed: any): Promise<any> {
        const result = await new Promise<any>((resolve, reject) => {

            feed(undefined, (err?: Error, _data?: any) => {
                if (typeof err === 'boolean' && err) {
                    resolve(new FeedEndError());
                    return;
                }
                if (err) {
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

    private async fetchContacts(id: string) {
        if (!id) {
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

        const followers = [];

        for (const key of Object.keys(data)) {
            if ((Object.keys(data[key]).indexOf(id) >= 0) && (data[key][id])) {
                followers.push(key);
            }
        }

        const following = [];

        if (data[id]) {
            for (const key of Object.keys(data[id])) {
                if (data[id][key]) {
                    following.push(key);
                }
            }
        }

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

    private async fetchIdentity(id: string, isSelf: boolean = false) {
        if (!id) {
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

            if (typeof data.value.content.image === 'object') {
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
                this.store.dispatch(new UpdateIdentity(
                    data.value.content.about,
                    data.value.content.description,
                    isSelf,
                ));
            }
        });
    }

    private parsePost(id: string, packet: any) {
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
        if (!post.author || (post.author && post.author.isMissing)) {
            // tslint:disable-next-line:no-floating-promises
            this.fetchIdentity(post.authorId);
        }
        post.votes = this
            .store
            .selectSnapshot<VotingModel[]>((state) => state.votings)
            .filter(item => item.link === post.id);
        post.date = moment(packet.timestamp).toDate();
        post.content = packet.content.text;
        post.rootId = packet.content.root;
        if (Array.isArray(packet.content.mentions)) {
            for (const mention of packet.content.mentions) {
                post.mentions.push(new LinkModel({ link: mention.link }));
            }
        }
        this.store.dispatch(new UpdatePost(post));
        if (post.rootId) {
            // got a non root node, fetch the tree
            // tslint:disable-next-line:no-floating-promises
            this.get(packet.content.root);
            const branch = packet.content.branch;
            if (Array.isArray(branch)) {
                for (const item of branch) {
                    // tslint:disable-next-line:no-floating-promises
                    this.get(item);
                }
            } else {
                // tslint:disable-next-line:no-floating-promises
                this.get(branch);
            }
        }
    }

    private parsePacket(_packet: any) {
        this.store.dispatch(new UpdateMessageCount());
        const id = _packet.key;
        const packet = _packet.value;
        if (!(typeof packet.content === 'object')) {
            return;
        }

        const packetType = packet.content.type;

        if (packetType === 'post') {
            this.parsePost(id, packet);
            // } else if (packetType === 'about') {
            //     this.store.dispatch(new UpdateIdentity(
            //         packet.content.about,
            //         packet.content.name,
            //         packet.content.description,
            //         packet.content.image,
            //     ));
        } else if (packetType === 'vote') {
            const voting = new VotingModel();
            voting.id = id;
            voting.date = moment(packet.timestamp).toDate();
            voting.value = packet.content.vote.value;
            voting.reason = packet.content.vote.expression;
            voting.link = packet.content.vote.link;
            voting.authorId = packet.author;
            voting.author = this
                .store
                .selectSnapshot<IdentityModel[]>((state) => state.identities)
                .filter(item => item.id === packet.author)
                .pop();
            if (!voting.author) {
                // tslint:disable-next-line:no-floating-promises
                this.fetchIdentity(voting.authorId);
            }
            this.store.dispatch(new AddVoting(voting));
        } else if (packetType === 'channel') {
            this.store.dispatch(new SetChannelSubscription(
                packet.author,
                packet.content.channel,
                packet.content.subscribed,
                moment(packet.timestamp).toDate(),
            ));
        }
    }

    private async drainFeed(feed: any, callback: Function): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            pull(
                feed,
                pull.drain((data: any) => {
                    setImmediate(() => {
                        callback.bind(this, data)();
                    });
                }, (error: any) => {
                    if (error) {
                        reject(error);
                        return;
                    }
                    resolve();
                }),
            );
        });
    }
}
