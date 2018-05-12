/**
 * @license MIT
 */

import {
    State, Action, StateContext,
} from '@ngxs/store';
import { LoadFeed, UpdateMessageCount } from '../actions';

import {
    CurrentFeedSettings,
} from '../interfaces';
import { PaginateFeed } from '../actions';
import { SwitchChannel } from '../actions/switch-channel.action';


@State<CurrentFeedSettings>({
    name: 'currentFeedSettings',
    defaults: {
        currentPage: 1,
        elementsPerPage: 20,
        loadingFeed: false,
        messageCount: 0,
        channel: 'public',
    }
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
            currentPage: 1,
        });
    }
}
