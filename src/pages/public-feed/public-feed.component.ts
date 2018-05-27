/**
 * @license MIT
 */

import {
    AfterViewInit,
    ChangeDetectorRef,
    Component,
    ElementRef,
    QueryList,
    ViewChild,
    ViewChildren,
} from '@angular/core';
import {
    ActivatedRoute, Router,
} from '@angular/router';
import {
    Select, Store,
} from '@ngxs/store';
import { ScrollToService } from '@nicky-lenaers/ngx-scroll-to';
import * as mousetrap from 'mousetrap';
import {
    Observable,
} from 'rxjs';

import {
    PaginateFeed,
    SwitchChannel,
} from '../../actions';
import {
    PostComponent,
} from '../../components';
import {
    CurrentFeedSettings,
} from '../../interfaces';
import {
    IdentityDescriptionModel,
    IdentityModel,
    PostModel,
} from '../../models';
import {
    HelperService, ScuttlebotService,
} from '../../providers';
import {
    AppState,
    CurrentFeedSettingState,
} from '../../states';

const ref = window.require('ssb-ref');

@Component({
    selector: 'app-public-feed',
    templateUrl: './public-feed.component.html',
    styleUrls: ['./public-feed.component.scss'],
})
export class PublicFeedComponent implements AfterViewInit {
    public posts: Observable<PostModel[]>;
    @Select(PublicFeedComponent.identitySelector)
    public identity!: Observable<IdentityModel>;

    @Select(CurrentFeedSettingState)
    public settings?: Observable<CurrentFeedSettings>;

    @ViewChild('feedContainer')
    public feedContainer?: ElementRef;

    @ViewChildren(PostComponent)
    public feedItems?: QueryList<PostComponent>;

    public activeFeedItem?: PostComponent;


    public constructor(
        private store: Store,
        private route: ActivatedRoute,
        private helper: HelperService,
        private _scrollService: ScrollToService,
        private changeDetectorRef: ChangeDetectorRef,
        private router: Router,
        private scuttlebot: ScuttlebotService,
    ) {
        this.posts = this.store.select(PublicFeedComponent.feedSelector);
        this.route.url.subscribe(() => {
            const id = this.route.snapshot.paramMap.get('channel');
            if (!(typeof id === 'string')) {
                throw new Error('No Such Channel');
            }
            this.store.dispatch(new SwitchChannel(id));
        });
    }

    public pageBackward() {
        this.store.dispatch(new PaginateFeed(-1)).subscribe(() => {
            window.scrollTo(0, document.body.scrollHeight);
        });
        this.changeDetectorRef.detectChanges();
    }

    public pageForward() {
        this.store.dispatch(new PaginateFeed(1)).subscribe(() => {
            window.scroll(0, 0);
        });
        this.changeDetectorRef.detectChanges();
    }

    public getImage(identity?: IdentityModel) {
        return this.helper.formatIdentityImageUrl(identity);
    }

    public getDescription(identity?: IdentityModel) {
        if (identity instanceof IdentityModel && identity.about instanceof IdentityDescriptionModel) {
            return this.helper.convertHtml(identity.about.html);
        }
    }

    public ngAfterViewInit() {
        mousetrap.bind('N', this.pageForward.bind(this));
        mousetrap.bind('P', this.pageBackward.bind(this));
        mousetrap.bind('n', this.shortcutHandler.bind(this));
        mousetrap.bind('p', this.shortcutHandler.bind(this));
        mousetrap.bind('return', async () => {
            if (this.activeFeedItem instanceof PostComponent) {
                await this.scuttlebot.get(this.activeFeedItem.post.id);
                await this.router.navigate(['/post', this.activeFeedItem.post.id]);
            }
        });
    }

    private shortcutHandler(_event: ExtendedKeyboardEvent, combo: string) {
        const isForward = (combo === 'n');

        if (!(this.feedItems instanceof QueryList)) {
            return;
        }

        if (typeof this.activeFeedItem === 'undefined') {
            this.activeFeedItem = (isForward ? this.feedItems.first : this.feedItems.last);
        } else if (this.activeFeedItem === (isForward ? this.feedItems.last : this.feedItems.first)) {
            this.activeFeedItem = undefined;
            if (isForward) {
                this.pageForward();
            } else {
                this.pageBackward();
            }
        } else {
            const index = this.feedItems.toArray().indexOf(this.activeFeedItem);
            this.activeFeedItem = this.feedItems.toArray()[index + (isForward ? 1 : -1)];
        }

        for (const item of this.feedItems.toArray()) {
            item.active = false;
        }

        if (this.activeFeedItem instanceof PostComponent) {
            this.activeFeedItem.active = true;
            this._scrollService.scrollTo({
                target: this.activeFeedItem.elementRef,
                offset: -50,
            });
        }
        this.changeDetectorRef.detectChanges();
    }

    private static identitySelector(state: AppState): IdentityModel | undefined {
        if (state.currentFeedSettings.channelType === 'feed') {
            return state
                .identities
                .filter(item => item.id === state.currentFeedSettings.channel)
                .pop();
        } else {
            return undefined;
        }
    }

    private static feedSelector(state: { posts: PostModel[], currentFeedSettings: CurrentFeedSettings }): PostModel[] {
        return state
            .posts
            .filter((item: PostModel) => !(typeof item.rootId === 'string'))
            .filter((item) => {
                const channel = state.currentFeedSettings.channel;
                if (channel !== 'public') {
                    const type = ref.type(channel);
                    if (type === 'feed') {
                        return (item.author instanceof IdentityModel && item.author.id === channel);
                    } else {
                        return item.primaryChannel === state.currentFeedSettings.channel ||
                            item
                                .mentions
                                .map(_item => _item.link)
                                .includes(`#${state.currentFeedSettings.channel}`) ||
                            item
                                .comments
                                .map(_item => _item.mentions)
                                .reduce((previous, current) => previous.concat(current), [])
                                .map(_item => _item.link)
                                .includes(`#${state.currentFeedSettings.channel}`);
                    }
                } else {
                    return true;
                }
            })
            .slice(
                (state.currentFeedSettings.currentPage - 1) * state.currentFeedSettings.elementsPerPage,
                state.currentFeedSettings.currentPage * state.currentFeedSettings.elementsPerPage);
    }
}
