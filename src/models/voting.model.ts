/**
 * @license MIT
 */

import {
    BaseModel,
} from '../models';

export class VotingModel extends BaseModel {
    public value?: 1 | 0 | -1;
    public reason?: string;
    public link?: string;
}
