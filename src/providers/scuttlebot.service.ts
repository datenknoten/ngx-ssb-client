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
    PostingModel,
    IdentityModel,
    VotingModel,
} from '../models';
import * as moment from 'moment';
import {
    UpdatePosting,
    UpdateIdentity,
    AddVoting,
    SetContact,
    SetChannelSubscription,
} from '../actions';
import {
    FeedEndError,
} from '../errors';
import { validate } from 'class-validator';
const util = window.require('util');
const split = require('split-buffer');

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

    public async updateFeed() {
        await this.parseFeed(this.bot.createFeedStream({
            reverse: true,
            limit: 500,
        }));
    }

    public async publishPosting(posting: PostingModel) {
        const validationErrors = await validate(posting);
        if (validationErrors.length > 0) {
            throw validationErrors[0];
        }

        const json: any = {
            text: posting.content,
            type: 'post'
        };

        if (posting.rootId) {
            json['root'] = posting.rootId;
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

    public async publish(message: PostingModel | VotingModel) {
        if (message instanceof PostingModel) {
            return this.publishPosting(message);
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

    private async init() {
        const ssbClient = util.promisify(window.require('ssb-client'));

        this.bot = await ssbClient();

        const whoami = await this.getFeedItem(this.bot.whoami);

        await this.fetchIdentity(whoami.id, true);

        await this.fetchContacts(whoami.id);

        await this.parseFeed(this.bot.createUserStream({
            id: whoami.id,
        }));

        await this.updateFeed();
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

        for (const key of Object.keys(data[id])) {
            if (data[id][key]) {
                following.push(key);
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

    private async fetchIdentity(id: string, isSelf: boolean = false) {
        if (!id) {
            return;
        }

        if (!id.startsWith('@')) {
            return;
        }

        try {
            const feed = this.bot.links({ dest: id, rel: 'about', values: true, live: true });
            while (true) {
                const data = await this.getFeedItem(feed);

                if (!(data && data.value && data.value.content)) {
                    break;
                }

                let imageId;

                if (typeof data.value.content.image === 'object') {
                    imageId = data.value.content.image.link;
                } else {
                    imageId = data.value.content.image;
                }
                this.store.dispatch(new UpdateIdentity(
                    data.value.content.about,
                    data.value.content.name,
                    data.value.content.description,
                    imageId,
                    isSelf,
                ));
            }
        } catch (error) {
            if (error instanceof FeedEndError) {
                return;
            } else {
                throw error;
            }
        }
    }

    private parsePost(id: string, packet: any) {
        const posting = new PostingModel();
        posting.id = id;
        posting.primaryChannel = packet.content.channel;
        posting.authorId = packet.author;
        posting.author = this
            .store
            .selectSnapshot<IdentityModel[]>((state) => state.identities)
            .filter(item => item.id === packet.author)
            .pop();
        if (!posting.author) {
            // tslint:disable-next-line:no-floating-promises
            this.fetchIdentity(posting.authorId);
        }
        posting.votes = this
            .store
            .selectSnapshot<VotingModel[]>((state) => state.votings)
            .filter(item => item.link === posting.id);
        posting.date = moment(packet.timestamp).toDate();
        posting.content = packet.content.text;
        posting.rootId = packet.content.root;
        this.store.dispatch(new UpdatePosting(posting));
        if (posting.rootId) {
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

    private parsePacket(id: string, packet: any) {
        if (!(typeof packet.content === 'object')) {
            return;
        }

        const packetType = packet.content.type;

        if (packetType === 'post') {
            this.parsePost(id, packet);
        } else if (packetType === 'about') {
            this.store.dispatch(new UpdateIdentity(
                packet.content.about,
                packet.content.name,
                packet.content.description,
                packet.content.image,
            ));
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
    private async get(id: string): Promise<void> {
        if (!id) {
            return;
        }
        const get = util.promisify(this.bot.get);
        try {
            const packet = await get(id);
            if (packet && packet.value) {
                if (packet.value.content) {
                    this.parsePacket(id, packet);
                }
            }
        } catch (error) {
            if (error.name !== 'NotFoundError') {
                throw error;
            } else {
            }
        }
    }
    private async parseFeed(feed: (abort: any, cb: (err?: Error, data?: any) => void) => any) {
        try {
            const item = await this.getFeedItem(feed);
            this.parsePacket(item.key, item.value);

            setImmediate(this.parseFeed.bind(this, feed));
        } catch (error) {
            if (error instanceof FeedEndError) {
                return;
            } else {
                throw error;
            }
        }
    }
}
