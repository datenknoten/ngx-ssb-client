/**
 * @license MIT
 */

import {
    State,
    Action,
    StateContext,
} from '@ngxs/store';

import {
    IdentityModel,
} from '../models';

import {
    UpdateIdentity, SetIdentity,
} from '../actions';

@State<IdentityModel[]>({
    name: 'identities',
    defaults: []
})
export class IdentitiesState {
    // @Action(AddIdentity)
    // public addIdentity(ctx: StateContext<IdentityModel[]>, action: AddIdentity) {
    //     const state = ctx.getState();
    //     ctx.setState([
    //         ...state,
    //         action.identity,
    //     ]);
    // }

    @Action(UpdateIdentity)
    public updateIdentity(ctx: StateContext<IdentityModel[]>, action: UpdateIdentity) {
        const state = ctx.getState();
        let identity = state.filter(item => item.id === action.id).pop();

        if (!identity) {
            identity = new IdentityModel();
            identity.id = action.id;
            ctx.setState([
                ...state,
                identity,
            ]);
        }

        if (action.about) {
            identity.about.push(action.about);
        }

        if (action.image) {
            identity.image.push(action.image);
        }

        if (action.name) {
            identity.name.push(action.name);
        }

        ctx.dispatch(new SetIdentity(identity));

    }
}
