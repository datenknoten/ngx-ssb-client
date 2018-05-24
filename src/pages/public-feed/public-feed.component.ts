/**
 * @license MIT
 */

import {
    Component,
} from '@angular/core';

import {
    PostModel,
} from '../../models';

import {
    Observable,
} from 'rxjs';
import {
    Select, Store,
} from '@ngxs/store';
import { CurrentFeedSettings } from '../../interfaces';
import { CurrentFeedSettingState } from '../../states';
import { PaginateFeed } from '../../actions';
import { ActivatedRoute } from '@angular/router';
import { SwitchChannel } from '../../actions/switch-channel.action';

const ref = window.require('ssb-ref');

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
            if (!id) {
                throw new Error('No Such Channel');
            }
            this.store.dispatch(new SwitchChannel(id));
        });
    }

    public static feedSelector(state: { posts: PostModel[], currentFeedSettings: CurrentFeedSettings }): PostModel[] {
        return state
            .posts
            .filter((item: PostModel) => !item.rootId)
            .filter((item) => {
                const channel = state.currentFeedSettings.channel;
                if (channel !== 'public') {
                    const type = ref.type(channel);
                    if (type === 'feed') {
                        return (item.author && item.author.id === channel);
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

    public pageBackward() {
        this.store.dispatch(new PaginateFeed(-1));
    }

    public pageForward() {
        this.store.dispatch(new PaginateFeed(1));
    }
}
