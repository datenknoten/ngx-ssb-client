/**
 * @license MIT
 */

import {
    Component,
    OnInit,
    Input,
    ViewEncapsulation,
} from '@angular/core';

import { PostingModel } from '../../models';

import {
    ElectronService,
} from '../../providers';

import * as moment from 'moment';
import { Observable } from 'rxjs';
import { Select } from '@ngxs/store';

@Component({
    selector: 'app-public-feed',
    templateUrl: './public-feed.component.html',
    styleUrls: ['./public-feed.component.scss'],
})
export class PublicFeedComponent {
    @Select((state) => state.postings.filter(item => !item.rootId))
    public postings: Observable<PostingModel[]>;

    public constructor() {}
}
