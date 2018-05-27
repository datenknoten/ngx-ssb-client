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
    IdentityModel,
} from '../models';

const ref = window.require('ssb-ref');
const cheerio = window.require('cheerio');

@Injectable()
export class HelperService {

    public constructor(
        private store: Store,
    ) {}

    public formatIdentityImageUrl(identity?: IdentityModel): string {
        if ((identity instanceof IdentityModel) && (identity.image.length > 0)) {
            return `ssb://ssb/${identity.primaryImage}`;
        } else {
            return './assets/img/image.png';
        }
    }

    public convertHtml(html: string) {
        const $ = cheerio.load(html);
        const that = this;

        $('img:not(.emoji)')
            .addClass('ui rounded image');
        $('h1,h2,h3')
            .addClass('ui dividing header');
        $('table')
            .addClass('ui green compact celled table');
        $('a')
            .each(function(this: any) {
                const item = $(this);
                that.parseLink(item, $);
            });

        return $.html();
    }

    private parseIdentityLink(item: any, $: any) {
        const href = item.attr('href');
        if (href.startsWith('ssb://ssb/@')) {
            item.addClass('ui image label');
            const text = item.text();
            const id = ref.extract(item.attr('href'));
            const identity = this.store
                .selectSnapshot((state: any) =>
                    state
                        .identities
                        .filter((_item: IdentityModel) => _item.id === id)
                        .pop());
            item.text('');
            if (identity) {
                item
                    .append($('<img>')
                        .attr('src', `ssb://ssb/${identity.primaryImage}`));
                item
                    .append($('<span>')
                        .text(text));
                if (text.replace('@', '') !== identity.primaryName) {
                    item.attr('title', `Known to you as ${identity.primaryName}`);
                }
            } else {
                item
                    .append($('<span>')
                        .text(text));
            }
        }
    }

    private parseHTTPLink(item: any, $: any) {
        const href = item.attr('href');

        if (href.startsWith('http')) {
            const map = [
                {
                    pattern: /^https:\/\/.*\.wikipedia\.org/,
                    icon: 'wikipedia w',
                },
                {
                    pattern: /^https:\/\/github\.com/,
                    icon: 'github',
                },
                {
                    pattern: /^https:\/\/git\.scuttlebot\.io/,
                    icon: 'git',
                },
                {
                    pattern: /^https:\/\/www\.youtube\.com/,
                    icon: 'youtube',
                },
                {
                    pattern: /^http:\/\//,
                    icon: 'lock open',
                },
                {
                    pattern: /.*/,
                    icon: 'globe',
                },
            ];

            for (const mapItem of map) {
                if (href.match(mapItem.pattern)) {
                    const text = item
                        .text()
                        .trim();
                    if (text !== href) {
                        item.addClass('ui image label');
                        item.text('');
                        item.append($(`<i class="${mapItem.icon} icon"></i>`));
                        item
                            .append($('<span>')
                                .text(text));
                        item.attr('title', href);
                    }
                    return;
                }
            }
        }
    }

    private parseLink(item: any, $: any) {
        const href = item.attr('href');
        if (!href) {
            return;
        }
        if (href.startsWith('ssb://ssb/@')) {
            this.parseIdentityLink(item, $);
        } else if (href.startsWith('http')) {
            this.parseHTTPLink(item, $);
        }
    }
}
