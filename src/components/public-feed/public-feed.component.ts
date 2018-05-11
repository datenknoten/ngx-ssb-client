/**
 * @license MIT
 */

import {
    Component,
} from '@angular/core';

import {
    PostingModel,
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
    @Select((state: { postings: PostingModel[], currentFeedSettings: CurrentFeedSettings }) => state
        .postings
        .filter((item: PostingModel) => !item.rootId)
        .slice(
            (state.currentFeedSettings.currentPage - 1) * state.currentFeedSettings.elementsPerPage,
            state.currentFeedSettings.currentPage * state.currentFeedSettings.elementsPerPage)
    )
    public postings?: Observable<PostingModel[]>;

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
