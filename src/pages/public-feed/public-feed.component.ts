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

@Component({
    selector: 'app-public-feed',
    templateUrl: './public-feed.component.html',
    styleUrls: ['./public-feed.component.scss'],
})
export class PublicFeedComponent {
    @Select((state: { posts: PostModel[], currentFeedSettings: CurrentFeedSettings }) => state
        .posts
        .filter((item: PostModel) => !item.rootId)
        .slice(
            (state.currentFeedSettings.currentPage - 1) * state.currentFeedSettings.elementsPerPage,
            state.currentFeedSettings.currentPage * state.currentFeedSettings.elementsPerPage)
    )
    public posts?: Observable<PostModel[]>;

    @Select(CurrentFeedSettingState)
    public settings?: Observable<CurrentFeedSettings>;

    public constructor(
        private store: Store,
    ) { }

    public pageBackward() {
        this.store.dispatch(new PaginateFeed(-1));
    }

    public pageForward() {
        this.store.dispatch(new PaginateFeed(1));
    }
}
