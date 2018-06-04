/**
 * @license MIT
 */

import {
    ApplicationRef,
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
        private _app: ApplicationRef,
    ) {
        this.postChange();
        this.route.url.subscribe(this.postChange.bind(this));
    }

    private postChange() {
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
                item.comments.sort((a, b) => {
                    return a.date.getTime() - b.date.getTime();
                });
                window.scrollTo(0, 0);
                setImmediate(() => {
                    this._app.tick();
                });
            }
        });
    }
}
