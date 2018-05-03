/**
 * @license MIT
 */

import {
    BaseModel,
} from '../models';

export class IdentityModel extends BaseModel {
    public name: string[] = [];
    public image: string[] = [];
    public about: string[] = [];

    public constructor(init?: Partial<IdentityModel>) {
        super();
        Object.assign(this, init);
    }
}
