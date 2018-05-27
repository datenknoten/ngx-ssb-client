/**
 * @license MIT
 */

import {
    CurrentFeedSettings,
} from '../interfaces';
import {
    IdentityModel,
    PostModel,
    VotingModel,
} from '../models';

export interface AppState {
    identities: IdentityModel[];
    posts: PostModel[];
    votings: VotingModel[];
    currentFeedSettings: CurrentFeedSettings;
}
