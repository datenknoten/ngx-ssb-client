/**
 * @license MIT
 */

import {
    State,
    Action,
    StateContext,
} from '@ngxs/store';

import {
    IdentityModel, ChannelSubscription,
} from '../models';

import {
    UpdateIdentity, SetIdentity, SetContact, SetChannelSubscription,
} from '../actions';

const normalizeChannel = window.require('ssb-ref').normalizeChannel;

@State<IdentityModel[]>({
    name: 'identities',
    defaults: []
})
export class IdentitiesState {
    @Action(UpdateIdentity)
    public updateIdentity(ctx: StateContext<IdentityModel[]>, action: UpdateIdentity) {
        const state = ctx.getState();
        let identity = state.filter(item => item.id === action.id).pop();

        if (!identity) {
            identity = new IdentityModel();
            identity.isSelf = action.isSelf;
            identity.id = action.id;
            ctx.setState([
                ...state,
                identity,
            ]);
        }

        if (action.about && identity.about.indexOf(action.about) === -1) {
            identity.about.push(action.about);
        }

        if (action.image && identity.image.indexOf(action.image) === -1) {
            identity.image.push(action.image);
        }

        if (action.name && identity.name.indexOf(action.name) === -1) {
            identity.name.push(action.name);
        }

        ctx.dispatch(new SetIdentity(identity));
    }

    @Action(SetContact)
    public setContact(ctx: StateContext<IdentityModel[]>, action: SetContact) {
        const state = ctx.getState();
        let from = state.filter(item => item.id === action.from).pop();
        let to = state.filter(item => item.id === action.to).pop();

        if (!from) {
            from = new IdentityModel();
            from.id = action.from;
            ctx.setState([
                ...state,
                from,
            ]);
        }

        if (!to) {
            to = new IdentityModel();
            to.id = action.to;
            ctx.setState([
                ...state,
                to,
            ]);
        }

        from.following.push(to);
        to.followers.push(from);
    }

    @Action(SetChannelSubscription)
    public setChannelSubscription(ctx: StateContext<IdentityModel[]>, action: SetChannelSubscription) {
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

        const channel = normalizeChannel(action.channel);

        const channelSubscription = identity.channels.filter(item => item.channel === channel).pop();

        if (channelSubscription) {
            if (action.date > channelSubscription.lastModified) {
                channelSubscription.isSubscribed = action.isSubscribed;
                channelSubscription.lastModified = action.date;
            }
        } else {
            const subscription = new ChannelSubscription();
            subscription.channel = channel;
            subscription.lastModified = action.date;
            subscription.isSubscribed = action.isSubscribed;
            identity.channels = [
                ...identity.channels,
                subscription,
            ];
        }
    }
}
