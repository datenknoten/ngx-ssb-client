/**
 * @license MIT
 */

import { IdentityID } from '../types';

export class ResetContacts {
    public static readonly type = '[Identity] SetContact';
    public constructor(
        public id: IdentityID,
    ) { }
}
