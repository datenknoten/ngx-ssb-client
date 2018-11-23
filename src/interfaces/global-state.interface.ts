/**
 * @license MIT
 */

import { PostMessage } from '@catamaran/hull';

import {
    IdentityModel,
    VotingModel,
} from '../models';

import {
    CurrentFeedSettings,
} from './current-feed-settings.interface';


export interface GlobalState {
    currentFeedSettings: CurrentFeedSettings;
    identities: IdentityModel[];
    posts: PostMessage[];
    votings: VotingModel[];
}
