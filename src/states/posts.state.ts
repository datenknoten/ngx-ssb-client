/**
 * @license MIT
 */

import {
    Action,
    State,
    StateContext,
} from '@ngxs/store';

import { PostMessage } from '@catamaran/hull';
import { tap } from 'rxjs/operators';

import { FetchPosts } from '../actions/fetch-posts.action';
import { ScuttlebotService } from '../providers';

@State<PostMessage[]>({
    name: 'posts',
    defaults: [],
})
export class PostsState {
    public constructor(
        private sbot: ScuttlebotService,
    ) {

    }

    @Action(FetchPosts)
    public fetch(state: StateContext<PostMessage[]>, _action: FetchPosts) {
        console.dir('oh hai');
        return this
            .sbot
            .client
            .message
            .fetchPublicFeed()
            .subscribe(post => {
                console.dir(post);
                const currentState = state.getState();
                state.setState([
                    ...currentState,
                    post,
                ]);
            });
    }


}
