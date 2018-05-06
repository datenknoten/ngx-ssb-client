/**
 * @license MIT
 */

import { IdentityModel } from '../models';

export class SetContact {
    public static readonly type = '[Identity] SetContact';
    public constructor(
        public from: string,
        public to: string,
    ) { }
}
