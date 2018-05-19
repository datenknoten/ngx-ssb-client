/**
 * @license MIT
 */

import {
    BaseModel,
    IdentityModel,
} from '../models';

export class IdentityNameModel extends BaseModel {
    public name!: string;
    public identity!: IdentityModel;
    public weight!: number;
}
