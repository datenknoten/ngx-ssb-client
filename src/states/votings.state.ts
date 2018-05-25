/**
 * @license MIT
 */

import {
    Action,
    State,
    StateContext,
} from '@ngxs/store';

import {
    AddVoting,
    SetIdentity,
} from '../actions';
import {
    VotingModel,
} from '../models';

@State<VotingModel[]>({
    name: 'votings',
    defaults: [],
})
export class VotingsState {
    @Action(AddVoting)
    public addVoting(ctx: StateContext<VotingModel[]>, action: AddVoting) {
        const state = ctx.getState();

        if (state.filter(item => item.id === action.voting.id).length === 0) {
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
