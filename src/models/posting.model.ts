/**
 * @license MIT
 */

import {
    BaseModel,
    IdentityModel,
    VotingModel,
} from '../models';

const md = require('ssb-markdown');

const emojiNamedCharacters = require('emoji-named-characters');

export class PostingModel extends BaseModel {
    public author: IdentityModel;
    public authorId: string;
    public date: Date;
    public votes: VotingModel[] = [];
    public comments: PostingModel[] = [];
    public content: string;
    public rootId?: string;

    public constructor(init?: Partial<PostingModel>) {
        super();
        Object.assign(this, init);
    }

    public get html(): string {
        return md.block(this.content, {
            emoji: (emoji) => {
                return emoji in emojiNamedCharacters ?
                    `<img
    src="./assets/img/emoji/${encodeURI(emoji)}.png"
    alt=":${emoji}:" title=":${emoji}:"
    style="width: 1.5em; height: 1.5em; align-content: center; margin-bottom: -0.3em;" />` : `:${emoji}:`;
            },
            imageLink: (id) => {
                return `http://localhost:8989/blobs/get/${id}`;
            },
            toUrl: (id: string) => {
                if (id.startsWith('&')) {
                    return `http://localhost:8989/blobs/get/${id}`;
                } else {
                    return `ssb://${id}`;
                }
            }
        });
    }
}
