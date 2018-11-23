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
    public constructor(
        public store: Store,
    ) { }

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
