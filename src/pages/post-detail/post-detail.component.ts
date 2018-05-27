/**
 * @license MIT
 */

import {
    ChangeDetectorRef,
    Component,
} from '@angular/core';
import {
    ActivatedRoute,
} from '@angular/router';
import {
    Store,
} from '@ngxs/store';
import {
    Observable,
} from 'rxjs';

import {
    PostModel,
} from '../../models';

@Component({
    selector: 'app-post-detail',
    templateUrl: './post-detail.component.html',
    styleUrls: ['./post-detail.component.scss'],
})
export class PostDetailComponent {
    public post?: Observable<PostModel>;

    public constructor(
        private route: ActivatedRoute,
        private store: Store,
        private cref: ChangeDetectorRef,
    ) {
        this.route.url.subscribe(() => {
            const id = this.route.snapshot.paramMap.get('id');

            this.post = this
                .store
                .select((state) => state
                    .posts
                    .filter((item: PostModel) => item.id === id)
                    .pop(),
            );

            this.post.subscribe((item?: PostModel) => {
                if (item instanceof PostModel) {
                    this.cref.detectChanges();
                }
            });
        });
    }
}
