/**
 * @license MIT
 */

import { IdentityModel } from '../models';

export class SetIdentity {
    public static readonly type = '[Post] SetIdentity';
    public constructor(public identity: IdentityModel) { }
}
