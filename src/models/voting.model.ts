/**
 * @license MIT
 */

import {
    BaseModel,
    IdentityModel,
} from '../models';

export class VotingModel extends BaseModel {
    public value?: 1 | 0 | -1;
    public reason?: string;
    public link?: string;
    public author?: IdentityModel;
    public authorId!: string;
}
