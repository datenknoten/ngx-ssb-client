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
} from '../../interfaces';
import {
    IdentityDescriptionModel,
    IdentityModel,
    PostModel,
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
                map<any, PostModel[]>(this.feedSelector.bind(this)),
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
            if (ref.isFeedId(id)) {
                await this._bot.fetchIdentityPosts(id);
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
        this._bot.updateFeed(500, true);
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
            });
        }
        this.changeDetectorRef.detectChanges();
        return false;
    }

    private feedSelector(state: { posts: PostModel[], currentFeedSettings: CurrentFeedSettings }): PostModel[] {
        const settings = state.currentFeedSettings;

        const _posts = state.posts
            .filter((item: PostModel) => !(typeof item.rootId === 'string'))
            .filter((item: PostModel) => {
                const channel = settings.channel;
                if (channel !== 'public') {
                    const type = ref.type(channel);
                    if (type === 'feed') {
                        return (item.authorId === channel) ||
                            (item.comments.filter(comment => comment.authorId === channel).length > 0);
                    } else {
                        return item.primaryChannel === settings.channel ||
                            item
                                .mentions
                                .map(_item => _item.link)
                                .includes(`#${settings.channel}`) ||
                            item
                                .comments
                                .map(_item => _item.mentions)
                                .reduce((previous, current) => previous.concat(current), [])
                                .map(_item => _item.link)
                                .includes(`#${settings.channel}`);
                    }
                } else {
                    return true;
                }
            });

        _posts.sort((a: PostModel, b: PostModel) => {
            return b.latestActivity.getTime() - a.latestActivity.getTime();
        });

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
