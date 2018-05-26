/**
 * @license MIT
 */

import {
    BaseModel,
    IdentityModel,
} from '../models';

const md = window.require('ssb-markdown');
const emojiNamedCharacters = require('emoji-named-characters');
const twemoji = require('twemoji');

export class IdentityDescriptionModel extends BaseModel {
    public description!: string;
    public identity!: IdentityModel;
    public date!: Date;

    public get html(): string {
        return md.block(this.description, {
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
                return `ssb://ssb/${id}`;
            },
            toUrl: (id: string) => {
                return `ssb://ssb/${id}`;
            },
        });
    }
}
