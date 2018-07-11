/**
 * @license MIT
 */

import {
    Action,
    State,
    StateContext,
    Store,
} from '@ngxs/store';

import {
    AddVoting,
    SetIdentity,
} from '../actions';
import { GlobalState } from '../interfaces';
import {
    PostModel,
    VotingModel,
} from '../models';

@State<VotingModel[]>({
    name: 'votings',
    defaults: [],
})
export class VotingsState {
    public constructor(
        public store: Store,
    ) { }

    @Action(AddVoting)
    public addVoting(ctx: StateContext<VotingModel[]>, action: AddVoting) {
        const state = ctx.getState();

        if (state.filter(item => item.id === action.voting.id).length === 0) {
            const post = this
                .store
                .selectSnapshot<PostModel[]>((innerState: GlobalState) => innerState.posts)
                .filter(item => item.id === action.voting.link)
                .pop();

            if (typeof post !== 'undefined' && !(post.votes.map(item => item.id).includes(action.voting.id))) {
                post.votes.push(action.voting);
            }
            ctx.setState([
                ...state,
                action.voting,
            ]);
        }
    }

    @Action(SetIdentity)
    public setIdentity(ctx: StateContext<VotingModel[]>, action: SetIdentity) {
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
