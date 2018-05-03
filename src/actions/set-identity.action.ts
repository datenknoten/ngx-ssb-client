/**
 * @license MIT
 */

import { IdentityModel } from '../models';

export class SetIdentity {
    public static readonly type = '[Posting] SetIdentity';
    public constructor(public identity: IdentityModel) { }
}
