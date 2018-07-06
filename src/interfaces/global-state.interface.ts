/**
 * @license MIT
 */

import {
    IdentityModel,
    PostModel,
    VotingModel,
} from '../models';

import {
    CurrentFeedSettings,
} from './current-feed-settings.interface';

export interface GlobalState {
    currentFeedSettings: CurrentFeedSettings;
    identities: IdentityModel[];
    posts: PostModel[];
    votings: VotingModel[];
}
