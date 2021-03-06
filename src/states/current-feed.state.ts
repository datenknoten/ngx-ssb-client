/**
 * @license MIT
 */

import {
    Action,
    State,
    StateContext,
} from '@ngxs/store';

import {
    LoadFeed,
    PaginateFeed,
    SwitchChannel,
    UpdateMessageCount,
} from '../actions';
import {
    CurrentFeedSettings,
} from '../interfaces';

const ref = window.require('ssb-ref');


@State<CurrentFeedSettings>({
    name: 'currentFeedSettings',
    defaults: {
        currentPage: 1,
        elementsPerPage: 20,
        loadingFeed: true,
        messageCount: 0,
        channel: 'public',
        channelType: 'public',
    },
})
export class CurrentFeedSettingState {
    @Action(PaginateFeed)
    public updateIdentity(ctx: StateContext<CurrentFeedSettings>, action: PaginateFeed) {
        const state = ctx.getState();
        ctx.setState({
            ...state,
            currentPage: state.currentPage + action.page,
        });
    }

    @Action(LoadFeed)
    public loadFeed(ctx: StateContext<CurrentFeedSettings>, action: LoadFeed) {
        const state = ctx.getState();
        ctx.setState({
            ...state,
            loadingFeed: action.loading,
        });
    }

    @Action(UpdateMessageCount)
    public updateMessageCount(ctx: StateContext<CurrentFeedSettings>, action: UpdateMessageCount) {
        const state = ctx.getState();
        ctx.setState({
            ...state,
            messageCount: (action.reset ? 0 : state.messageCount + 1),
        });
    }

    @Action(SwitchChannel)
    public switchChannel(ctx: StateContext<CurrentFeedSettings>, action: SwitchChannel) {
        const state = ctx.getState();
        ctx.setState({
            ...state,
            channel: action.channel,
            channelType: ref.type(action.channel),
            currentPage: 1,
        });
    }
}
