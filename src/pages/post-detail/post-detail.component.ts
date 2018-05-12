/**
 * @license MIT
 */

import {
    Component,
    OnInit,
} from '@angular/core';

import {
    PostModel,
} from '../../models';

import {
    ActivatedRoute,
} from '@angular/router';
import {
    Observable,
} from 'rxjs';
import {
    Store,
} from '@ngxs/store';

@Component({
    selector: 'app-post-detail',
    templateUrl: './post-detail.component.html',
    styleUrls: ['./post-detail.component.scss'],
})
export class PostDetailComponent implements OnInit {
    public post?: Observable<PostModel>;
    public constructor(
        private route: ActivatedRoute,
        private store: Store,
    ) { }

    public ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id');

        this.post = this.store.select((state) => state.posts.filter((item: PostModel) => item.id === id).pop());
    }
}
