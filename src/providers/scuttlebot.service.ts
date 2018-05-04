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

const Names = window.require('ssb-names');

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

        const ssbClient = util.promisify(window.require('ssb-client'));

        this.bot = await ssbClient();

        const whoami = await new Promise((resolve, reject) => {
            this.bot.whoami((err, id) => {
                if (err) {
                    reject(err);
                }
                resolve(id.id);
            });
        });

        // const names = Names.init(this.bot);

        // console.log(names);

        console.log(this.bot);


        // const userFeed = this.bot.createUserStream({
        //     id: whoami,
        //     reverse: true,
        // });

        // this.parseFeed(userFeed);

        const publicFeed = this.bot.createFeedStream({
            reverse: true,
            limit: 500,
        });

        this.parseFeed(publicFeed);
    }

    private async fetchIdentity(id: string) {
        if (!id) {
            return;
        }
        if (!id.startsWith('@')) {
            return;
        }

        const data = await new Promise<any>((resolve, reject) => {
            const feed = this.bot.links({ dest: id, rel: 'about', values: true, live: true });

            feed(undefined, (err, _data) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(_data);
            });
        });

        if (data && data.value && data.value.content) {
            this.store.dispatch(new UpdateIdentity(
                data.value.content.about,
                data.value.content.name,
                data.value.content.description,
                data.value.content.image,
            ));
        }
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
        if (!posting.author) {
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
            voting.value = packet.content.vote.value;
            voting.reason = packet.content.vote.expression;
            voting.link = packet.content.vote.link;
            this.store.dispatch(new AddVoting(voting));
        }
    }

    private async get(id: string): Promise<void> {
        if (!id) {
            return;
        }
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
