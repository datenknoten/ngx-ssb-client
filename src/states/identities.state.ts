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
    SetChannelSubscription,
    SetContact,
    SetIdentity,
    UpdateIdentity,
} from '../actions';
import {
    ChannelSubscription,
    IdentityDescriptionModel,
    IdentityImageModel,
    IdentityModel,
    IdentityNameModel,
} from '../models';

const normalizeChannel = window.require('ssb-ref').normalizeChannel;

@State<IdentityModel[]>({
    name: 'identities',
    defaults: [],
})
export class IdentitiesState {
    public constructor(
        public store: Store,
    ) {}

    @Action(UpdateIdentity)
    public updateIdentity(ctx: StateContext<IdentityModel[]>, action: UpdateIdentity) {
        const state = ctx.getState();
        let identity = state
            .filter(item => item.id === action.id)
            .pop();

        if (typeof identity === 'undefined') {
            identity = new IdentityModel();
            identity.isSelf = action.isSelf;
            identity.id = action.id;
            ctx.setState([
                ...state,
                identity,
            ]);
        }

        identity.isMissing = false;

        if (action.payload instanceof IdentityDescriptionModel) {
            if (identity.about instanceof IdentityDescriptionModel) {
                if (action.payload.date > identity.about.date) {
                    identity.about = action.payload;
                }
            } else {
                identity.about = action.payload;
            }
        }

        if ((action.payload instanceof IdentityImageModel)) {
            const image = action.payload;
            if (identity.image.filter(item => item.blobId === image.blobId).length === 0) {
                identity.image.push(action.payload);
            }
        }

        if ((action.payload instanceof IdentityNameModel)) {
            const name = action.payload;
            if (identity.name.filter(item => item.name === name.name).length === 0) {
                identity.name.push(action.payload);
            }
        }

        ctx.dispatch(new SetIdentity(identity));
    }

    @Action(SetContact)
    public setContact(ctx: StateContext<IdentityModel[]>, action: SetContact) {
        const state = ctx.getState();
        let from = state
            .filter(item => item.id === action.from)
            .pop();
        let to = state
            .filter(item => item.id === action.to)
            .pop();

        if (typeof from === 'undefined') {
            from = new IdentityModel();
            from.id = action.from;
            ctx.setState([
                ...state,
                from,
            ]);
        }

        if (typeof to === 'undefined') {
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
        let identity = state
            .filter(item => item.id === action.id)
            .pop();

        if (typeof identity === 'undefined') {
            identity = new IdentityModel();
            identity.id = action.id;
            ctx.setState([
                ...state,
                identity,
            ]);
        }

        const channel = normalizeChannel(action.channel);

        const channelSubscription = identity
            .channels
            .filter(item => item.channel === channel)
            .pop();

        if (channelSubscription instanceof ChannelSubscription) {
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

        identity.channels.sort();
    }
}
