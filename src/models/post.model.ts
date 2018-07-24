/**
 * @license MIT
 */

import {
    IsOptional,
    IsString,
} from 'class-validator';
import { memoize } from 'decko';

import {
    BaseModel,
    IdentityModel,
    LinkModel,
    VotingModel,
} from '../models';

const md = window.require('ssb-markdown');
const emojiNamedCharacters = require('emoji-named-characters');
const twemoji = require('twemoji');
const readingTime = require('reading-time');

export class PostModel extends BaseModel {
    public author?: IdentityModel;
    public authorId!: string;
    public date!: Date;
    public votes: VotingModel[] = [];
    public comments: PostModel[] = [];
    @IsString()
    public content?: string;
    @IsString()
    @IsOptional()
    public rootId?: string;
    @IsString()
    @IsOptional()
    public primaryChannel?: string;

    public mentions: LinkModel[] = [];

    public raw?: object;

    public constructor(init?: Partial<PostModel>) {
        super();
        Object.assign(this, init);
    }

    public get latestActivity(): Date {
        let newest = this.date;

        for (const comment of this.comments) {
            if (comment.date > newest) {
                newest = comment.date;
            }
        }

        return newest;
    }

    @memoize()
    public get html(): string {
        return md.block(this.content, {
            emoji: (emoji: string) => {
                if (emoji in emojiNamedCharacters) {
                    return twemoji.parse(emojiNamedCharacters[emoji].character, {
                        folder: 'emoji',
                        ext: '.svg',
                        base: '/assets/',
                    });
                } else {
                    return `:${emoji}:`;
                }
            },
            imageLink: (id: string) => {
                if (id.startsWith('&')) {
                    return `ssb://ssb/${id}`;
                } else {
                    return id;
                }
            },
            toUrl: (id: string) => {
                if (id.startsWith('&')) {
                    return `ssb://ssb/${id}`;
                } else {
                    return id;
                }
            },
        });
    }

    public get voteCount(): number {
        let count = 0;
        for (const votes of this.votes) {
            if (votes.value === 1) {
                count += 1;
            } else {
                count -= 1;
            }
        }
        return count;
    }

    public getPositiveVoters(): IdentityModel[] {
        const result: IdentityModel[] = [];

        if (this.votes.length === 0) {
            return result;
        }

        const sortedVotes = [
            ...this.votes,
        ];
        sortedVotes.sort((a, b) => {
            return a.date.getTime() - b.date.getTime();
        });

        const workingSet: { [index: string]: boolean } = {};

        for (const vote of sortedVotes) {
            workingSet[vote.authorId] = vote.value === 1;
        }

        for (const key in workingSet) {
            if (workingSet[key] === true) {
                const author = this
                    .votes
                    .map(item => item.author)
                    .filter(item => item instanceof IdentityModel && item.id === key)
                    .pop();
                if (author instanceof IdentityModel) {
                    result.push(author);
                }
            }
        }

        return result;
    }

    public get totalReadingTime(): number {
        let time = this.readingTime;
        for (const comment of this.comments) {
            time += comment.readingTime;
        }

        return time;
    }

    public get readingTime(): number {
        if (typeof this.content === 'string') {
            return readingTime(this.content).time + 20000;
        } else {
            return 0;
        }
    }
}
