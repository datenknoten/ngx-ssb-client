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
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { Observable } from 'rxjs';
import { Store } from '@ngxs/store';

@Component({
    selector: 'app-posting-detail',
    templateUrl: './posting-detail.component.html',
    styleUrls: ['./posting-detail.component.scss'],
})
export class PostingDetailComponent implements OnInit {
    public posting: Observable<PostingModel>;
    public constructor(
        private route: ActivatedRoute,
        private store: Store,
    ) { }

    public ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id');

        this.posting = this.store.select((state) => state.postings.filter(item => item.id === id).pop());
    }
}
