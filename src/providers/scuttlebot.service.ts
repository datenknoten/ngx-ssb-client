/**
 * @license MIT
 */

import {
    Injectable,
} from '@angular/core';

import {
    ElectronService,
} from '../providers';
import { Store } from '@ngxs/store';
import { PostingModel, IdentityModel, VotingModel } from '../models';
import * as moment from 'moment';
import { UpdatePosting, UpdateIdentity, AddVoting } from '../actions';

@Injectable()
export class ScuttlebotService {

    public counter = 0;
    private bot: any;
    public constructor(
        private electron: ElectronService,
        private store: Store,
    ) {
        // tslint:disable-next-line:no-floating-promises
        this.init();
    }
    private async init() {
        const util = window.require('util');
        const party = util.promisify(window.require('ssb-party'));
        this.bot = await party();

        const whoami = await new Promise((resolve, reject) => {
            this.bot.whoami((err, id) => {
                if (err) {
                    reject(err);
                }
                resolve(id.id);
            });
        });

        const userFeed = this.bot.createUserStream({
            id: whoami,
            reverse: true,
        });

        this.parseFeed(userFeed);

        const publicFeed = this.bot.createFeedStream({
            reverse: true,
            limit: 500,
        });

        this.parseFeed(publicFeed);
    }

    private parsePost(id: string, packet: any) {
        const posting = new PostingModel();
        posting.id = id;
        posting.authorId = packet.author;
        posting.author = this
            .store
            .selectSnapshot<IdentityModel[]>((state) => state.identities)
            .filter(item => item.id === packet.author)
            .pop();
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
        if (packet.content && packet.content.type === 'post') {
            this.parsePost(id, packet);
        } else if (packet.content && packet.content.type === 'about') {
            this.store.dispatch(new UpdateIdentity(
                packet.content.about,
                packet.content.name,
                packet.content.description,
                packet.content.image,
            ));
        } else if (packet.content && packet.content.type === 'vote') {
            const voting = new VotingModel();
            voting.id = id;
            voting.value = packet.content.value;
            voting.reason = packet.content.reason;
            voting.link = packet.content.link;
            this.store.dispatch(new AddVoting(voting));
        }
    }

    private async get(id: string): Promise<void> {
        try {
            const packet = await new Promise<any>((resolve, reject) => {
                this.bot.get(id, (err, data) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(data);
                });
            });
            if (packet && packet.value) {
                if (packet.value.content) {
                    this.parsePacket(id, packet.value);
                }
            }
        } catch (error) {
            if (error.name !== 'NotFoundError') {
                throw error;
            } else {
            }
        }
    }

    private parseFeed(feed: (abort: any, cb: (err, data) => void) => any) {
        feed(undefined, (err, data) => {
            if (data && data.value) {
                if (data.value.content) {
                    this.parsePacket(data.key, data.value);
                }
            }
            setTimeout(this.parseFeed.bind(this, feed), 0);
        });
    }
}
