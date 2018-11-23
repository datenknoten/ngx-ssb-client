/**
 * @license MIT
 */

import {
    ApplicationRef,
    ChangeDetectorRef,
    Component,
    ElementRef,
    OnDestroy,
    QueryList,
    ViewChild,
    ViewChildren,
} from '@angular/core';
import {
    ActivatedRoute,
} from '@angular/router';
import { PostMessage } from '@catamaran/hull';
import {
    Select, Store,
} from '@ngxs/store';
import { ScrollToService } from '@nicky-lenaers/ngx-scroll-to';
import {
    Hotkey,
    HotkeysService,
} from 'angular2-hotkeys';
import {
    Observable,
} from 'rxjs';
import {
    debounceTime,
    map,
    // tslint:disable-next-line:no-submodule-imports
} from 'rxjs/operators';

import {
    PaginateFeed,
    SwitchChannel,
} from '../../actions';
import {
    PostComponent,
} from '../../components';
import {
    CurrentFeedSettings,
    GlobalState,
} from '../../interfaces';
import {
    IdentityDescriptionModel,
    IdentityModel,
} from '../../models';
import {
    HelperService,
    ScuttlebotService,
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
export class PublicFeedComponent implements OnDestroy {
    public posts: Observable<PostMessage[]>;
    @Select(PublicFeedComponent.identitySelector)
    public identity!: Observable<IdentityModel>;

    @Select(CurrentFeedSettingState)
    public settings?: Observable<CurrentFeedSettings>;

    @Select((state: GlobalState) => state.currentFeedSettings.loadingFeed)
    public loading?: Observable<boolean>;

    @ViewChild('feedContainer')
    public feedContainer?: ElementRef;

    @ViewChildren(PostComponent)
    public feedItems?: QueryList<PostComponent>;

    public activeFeedItem?: PostComponent;

    @Select((state: GlobalState) => state
        .identities
        .filter(_item => _item.isSelf)
        .pop(),
    )
    public self!: Observable<IdentityModel>;

    private hotkeys: Hotkey[] = [];

    // tslint:disable-next-line:parameters-max-number
    public constructor(
        private store: Store,
        private route: ActivatedRoute,
        private helper: HelperService,
        private _scrollService: ScrollToService,
        private changeDetectorRef: ChangeDetectorRef,
        private _hotkeysService: HotkeysService,
        private _app: ApplicationRef,
        private _bot: ScuttlebotService,
    ) {
        this.posts = this
            .store
            .select((state: any) => {
                return {
                    posts: state.posts,
                    currentFeedSettings: state.currentFeedSettings,
                };
            })
            .pipe(
                debounceTime(600),
                map<any, PostMessage[]>(this.feedSelector.bind(this)),
        );

        this.posts.subscribe(() => {
            setImmediate(() => {
                this._app.tick();
            });
        });

        this.route.url.subscribe(async () => {
            const id = this.route.snapshot.paramMap.get('channel');
            if (!(typeof id === 'string')) {
                throw new Error('No Such Channel');
            }
            if (id === 'mentions') {
                // fetch mentions
            } else if (ref.isFeedId(id)) {
                await this._bot.fetchIdentityPosts(id);
            } else if (id !== 'public') {
                await this._bot.fetchChannelPosts(id);
            }
            this.store.dispatch(new SwitchChannel(id));
        });

        this.hotkeys.push(
            new Hotkey(
                'N',
                this.pageForward.bind(this),
                undefined,
                'Switches to the next page.',
            ),
        );
        this.hotkeys.push(
            new Hotkey(
                'P',
                this.pageBackward.bind(this),
                undefined,
                'Switches to the previous page.',
            ),
        );
        this.hotkeys.push(
            new Hotkey(
                'n',
                this.shortcutHandler.bind(this),
                undefined,
                'Scrolls to the next post. If you are at the end, go to the next page.',
            ),
        );
        this.hotkeys.push(
            new Hotkey(
                'p',
                this.shortcutHandler.bind(this),
                undefined,
                'Scrolls to the previous post. If you are at the beginning, go to the previous page.',
            ),
        );
        this.hotkeys.push(
            new Hotkey(
                'return',
                this.openActiveItem.bind(this),
                undefined,
                'Opens the active item',
            ),
        );
        this.hotkeys.push(
            new Hotkey(
                'f',
                this.favoriteActiveItem.bind(this),
                undefined,
                'Toggle the favorite state of the active item',
            ),
        );

        for (const key of this.hotkeys) {
            this._hotkeysService.add(key);
        }
    }

    public ngOnDestroy() {
        for (const key of this.hotkeys) {
            this._hotkeysService.remove(key);
        }
    }

    public pageBackward() {
        this.store.dispatch(new PaginateFeed(-1));
        this.changeDetectorRef.detectChanges();
        return false;
    }

    public pageForward() {
        // tslint:disable-next-line:no-floating-promises
        this._bot.updateFeed(true);
        this.store.dispatch(new PaginateFeed(1)).subscribe(() => {
            window.scroll(0, 0);
        });
        this.changeDetectorRef.detectChanges();
        return false;
    }

    public getImage(identity?: IdentityModel) {
        return this.helper.formatIdentityImageUrl(identity);
    }

    public getDescription(identity?: IdentityModel) {
        if (identity instanceof IdentityModel && identity.about instanceof IdentityDescriptionModel) {
            return this.helper.convertHtml(identity.about.html);
        }
    }

    public setActiveFeedItem(post: PostMessage) {
        if (this.feedItems instanceof QueryList && this.feedItems.length > 0) {
            for (const item of this.feedItems.toArray()) {
                item.active = false;
                if (item.post === post) {
                    this.activeFeedItem = item;
                    item.active = true;
                }
            }
        }
        this.changeDetectorRef.detectChanges();
    }

    public async toggleFollow() {
        const settings = this
            .store
            .selectSnapshot<CurrentFeedSettings>((state: GlobalState) => state.currentFeedSettings);

        if (settings.channelType === 'feed') {
            const identity = this
                .store
                .selectSnapshot<IdentityModel | undefined>(
                    (state: GlobalState) =>
                        state
                            .identities
                            .filter(item => settings.channel === item.id)
                            .pop(),
                );
            if (identity instanceof IdentityModel) {
                await this._bot.publishSubscription(identity);
            }

        }
    }

    private openActiveItem() {
        if (this.activeFeedItem instanceof PostComponent) {
            // tslint:disable-next-line:no-floating-promises
            this.activeFeedItem.openDetail(this.activeFeedItem.post.id);
        }
        return false;
    }

    private favoriteActiveItem() {
        if (this.activeFeedItem instanceof PostComponent) {
            // tslint:disable-next-line:no-floating-promises
            this.activeFeedItem.toggleLike();
        }
        return false;
    }

    private shortcutHandler(_event: ExtendedKeyboardEvent, combo: string) {
        const isForward = (combo === 'n');

        if (!(this.feedItems instanceof QueryList)) {
            return false;
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
                duration: 0,
            });
        }
        this.changeDetectorRef.detectChanges();
        return false;
    }

    private feedSelector(state: GlobalState): PostMessage[] {
        const settings = state.currentFeedSettings;

        const _posts = state.posts
            .filter((item) => !(item.root instanceof PostMessage));

        // _posts.sort((a, b) => {
        //     return b.latestActivity.getTime() - a.latestActivity.getTime();
        // });

        return _posts.slice(
            (settings.currentPage - 1) * settings.elementsPerPage,
            settings.currentPage * settings.elementsPerPage);
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
}
