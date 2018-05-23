/**
 * @license MIT
 */

import {
    Component,
    Input,
} from '@angular/core';
import {
    PostModel,
    IdentityModel,
    VotingModel,
} from '../../models';
import {
    Store,
} from '@ngxs/store';
import {
    ScuttlebotService,
    ElectronService,
} from '../../providers';
import { Router } from '@angular/router';

const ref = window.require('ssb-ref');
const cheerio = window.require('cheerio');

@Component({
    selector: 'app-post',
    templateUrl: './post.component.html',
    styleUrls: ['./post.component.scss'],
})
export class PostComponent {

    @Input()
    public post!: PostModel;

    @Input()
    public mode: 'condensed' | 'full' | 'draft' = 'condensed';

    public constructor(
        private store: Store,
        private scuttlebot: ScuttlebotService,
        private electron: ElectronService,
        private router: Router,
    ) { }

    public convertHtml(html: string) {
        const $ = cheerio.load(html);
        const that = this;

        $('img:not(.emoji)').addClass('ui rounded image');
        $('h1,h2,h3').addClass('ui dividing header');
        $('table').addClass('ui green compact celled table');
        $('a').each(function (this: any) {
            const item = $(this);
            that.parseLink(item, $);
        });

        return $.html();
    }

    public getImage(identity?: IdentityModel) {
        if (identity && (identity.image.length > 0)) {
            return `ssb://ssb/${identity.primaryImage}`;
        } else {
            return './assets/img/image.png';
        }
    }

    public get debug() {
        return JSON.stringify(this.post, undefined, '  ');
    }

    public log() {
        // tslint:disable-next-line:no-console
        console.log(this.post);
    }

    public formatVotes(post: PostModel): string {
        if (post.votes.length === 0) {
            return 'No Likes ☹';
        }

        const likers = post
            .getPositiveVoters()
            .map(item => item.primaryName)
            .join(', ');

        return `${likers} liked this post`;
    }

    public get hasSelfLike(): boolean {
        if (!this.post) {
            return false;
        }

        return this.post.getPositiveVoters().filter(item => item.isSelf).length === 1;
    }

    public formatComments(post: PostModel): string {
        if (post.comments.length === 0) {
            return 'No comments ☹';
        }

        const commenters = post
            .comments
            .map(item => item.author ? item.author.primaryName : item.authorId)
            .filter((value, index, self) => self.indexOf(value) === index)
            .join(',');

        return `Comments by ${commenters}`;
    }

    public async toggleLike() {
        const voting = new VotingModel();
        if (this.hasSelfLike) {
            voting.value = 0;
            voting.reason = 'Unlike';
        } else {
            voting.value = 1;
            voting.reason = 'Like';
        }

        voting.link = this.post.id;

        const author = this
            .store
            .selectSnapshot<IdentityModel[]>((state) => state.identities)
            .filter(item => item.isSelf
            )
            .pop();

        if (author) {
            voting.author = author;
            voting.authorId = author.id;
        } else {
            throw new Error('Self not found');
        }

        await this.scuttlebot.publish(voting);
        await this.scuttlebot.updateFeed();
    }

    public async click(event: MouseEvent) {
        let anchor = event.target;
        if ((anchor instanceof HTMLSpanElement || anchor instanceof HTMLElement) && (anchor.parentElement instanceof HTMLAnchorElement)) {
            anchor = anchor.parentElement;
        }

        if (anchor instanceof HTMLAnchorElement) {
            event.preventDefault();
            if (anchor.href.startsWith('ssb://')) {
                const id = ref.extract(anchor.href);
                const type = ref.type(id);
                if (type === 'msg') {
                    await this.scuttlebot.get(id);
                    await this.router.navigate(['/post/', id]);
                }
            } else if (anchor.href.startsWith('http')) {
                this.electron.remote.shell.openExternal(anchor.href);
            }
        }
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
                item.append($('<img>').attr('src', `ssb://ssb/${identity.primaryImage}`));
                item.append($('<span>').text(text));
                if (text.replace('@', '') !== identity.primaryName) {
                    item.attr('title', `Known to you as ${identity.primaryName}`);
                }
            } else {
                item.append($('<span>').text(text));
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
                    const text = item.text().trim();
                    if (text !== href) {
                        item.addClass('ui image label');
                        item.text('');
                        item.append($(`<i class="${mapItem.icon} icon"></i>`));
                        item.append($('<span>').text(text));
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
