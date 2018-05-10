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
    Select,
} from '@ngxs/store';

@Component({
    selector: 'app-public-feed',
    templateUrl: './public-feed.component.html',
    styleUrls: ['./public-feed.component.scss'],
})
export class PublicFeedComponent {
    @Select((state: any) => state.postings.filter((item: PostingModel) => !item.rootId))
    public postings?: Observable<PostingModel[]>;

    public constructor() {}
}
