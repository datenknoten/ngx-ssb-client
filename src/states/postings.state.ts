/**
 * @license MIT
 */

import {
    State,
    Action,
    StateContext,
} from '@ngxs/store';

import {
    PostingModel,
} from '../models';

import {
    UpdatePosting,
    SetIdentity,
} from '../actions';
import { stat } from 'fs';

@State<PostingModel[]>({
    name: 'postings',
    defaults: []
})
export class PostingsState {
    @Action(UpdatePosting)
    public updatePosting(ctx: StateContext<PostingModel[]>, action: UpdatePosting) {
        const state = ctx.getState();
        let posting = state.filter(item => item.id === action.posting.id).pop();
        let newPosting: boolean = false;

        if (!posting) {
            posting = new PostingModel();
            Object.assign(posting, action.posting);
            newPosting = true;
        } else {
            Object.assign(posting, action.posting);
        }

        // first check if the posting is a comment and has a root in the state
        if (posting.rootId) {
            const root = state.filter(item => item.id === posting.rootId).pop();

            if (root) {
                root.comments.push(posting);
                root.comments.sort((a, b) => {
                    return b.date.getTime() - a.date.getTime();
                });
            }
        } else {
            // also check if this posting has comments
            const comments = state.filter(item => item.rootId === posting.id);

            if (comments.length > 0) {
                posting.comments = [
                    ...comments
                ];
            }
        }

        if (newPosting) {
            ctx.setState([
                ...state,
                posting,
            ].sort((a, b) => {
                return b.date.getTime() - a.date.getTime();
            }));
        } else {
            ctx.setState([
                ...state,
            ].sort((a, b) => {
                return b.date.getTime() - a.date.getTime();
            }));
        }
    }

    @Action(SetIdentity)
    public setIdentity(ctx: StateContext<PostingModel[]>, action: SetIdentity) {
        const state = ctx.getState();
        state
            .filter(item => item.authorId === action.identity.id)
            .forEach(item => {
                item.author = action.identity;
            });

        ctx.setState([
            ...state,
        ]);
    }
}
