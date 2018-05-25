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
} from '../../actions';
import {
    SwitchChannel,
} from '../../actions/switch-channel.action';
import {
    CurrentFeedSettings,
} from '../../interfaces';
import {
    PostModel,
} from '../../models';
import {
    CurrentFeedSettingState,
} from '../../states';

@Component({
    selector: 'app-public-feed',
    templateUrl: './public-feed.component.html',
    styleUrls: ['./public-feed.component.scss'],
})
export class PublicFeedComponent {
    public posts: Observable<PostModel[]>;

    @Select(CurrentFeedSettingState)
    public settings?: Observable<CurrentFeedSettings>;

    public constructor(
        private store: Store,
        private route: ActivatedRoute,
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

    public static feedSelector(state: { posts: PostModel[], currentFeedSettings: CurrentFeedSettings }): PostModel[] {
        return state
            .posts
            .filter((item: PostModel) => !(typeof item.rootId === 'string'))
            .filter((item) => {
                if (state.currentFeedSettings.channel !== 'public') {
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
                } else {
                    return true;
                }
            })
            .slice(
                (state.currentFeedSettings.currentPage - 1) * state.currentFeedSettings.elementsPerPage,
                state.currentFeedSettings.currentPage * state.currentFeedSettings.elementsPerPage);
    }
}
