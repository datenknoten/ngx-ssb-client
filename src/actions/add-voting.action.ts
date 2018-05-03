/**
 * @license MIT
 */

import { VotingModel } from '../models';

export class AddVoting {
    public static readonly type = '[Voting] UpdateVoting';
    public constructor(public voting: VotingModel) { }
}
