/**
 * @license MIT
 */

import {
    Component,
} from '@angular/core';
import {
    ActivatedRoute,
} from '@angular/router';
import {
    Select, Store,
} from '@ngxs/store';
import {
    Observable,
} from 'rxjs';

import {
    PaginateFeed,
    SwitchChannel,
} from '../../actions';
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
export class PublicFeedComponent {
    public posts: Observable<PostModel[]>;
    @Select(PublicFeedComponent.identitySelector)
    public identity!: Observable<IdentityModel>;

    @Select(CurrentFeedSettingState)
    public settings?: Observable<CurrentFeedSettings>;


    public constructor(
        private store: Store,
        private route: ActivatedRoute,
        private helper: HelperService,
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
        this.store.dispatch(new PaginateFeed(-1));
    }

    public pageForward() {
        this.store.dispatch(new PaginateFeed(1));
    }

    public getImage(identity?: IdentityModel) {
        return this.helper.formatIdentityImageUrl(identity);
    }

    public getDescription(identity?: IdentityModel) {
        if (identity instanceof IdentityModel && identity.about instanceof IdentityDescriptionModel) {
            return this.helper.convertHtml(identity.about.html);
        }
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
