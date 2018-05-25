/**
 * @license MIT
 */

import {
    IdentityImageModel,
    IdentityNameModel,
} from '../models';

export class UpdateIdentity {
    public static readonly type = '[Identity] UpdateIdentity';
    public constructor(
        public id: string,
        public payload: IdentityNameModel | IdentityImageModel | string,
        public isSelf: boolean = false,
    ) { }
}
