/**
 * @license MIT
 */

import {
    State,
    Action,
    StateContext,
} from '@ngxs/store';

import {
    VotingModel,
} from '../models';

import {
    AddVoting,
} from '../actions';

@State<VotingModel[]>({
    name: 'votings',
    defaults: []
})
export class VotingsState {
    @Action(AddVoting)
    public updatePosting(ctx: StateContext<VotingModel[]>, action: AddVoting) {
        const state = ctx.getState();
        ctx.setState([
            ...state,
            action.voting,
        ]);
    }
}
