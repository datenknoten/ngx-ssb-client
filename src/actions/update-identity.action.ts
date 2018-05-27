/**
 * @license MIT
 */

import {
    IdentityDescriptionModel,
    IdentityImageModel,
    IdentityNameModel,
} from '../models';

export class UpdateIdentity {
    public static readonly type = '[Identity] UpdateIdentity';
    public constructor(
        public id: string,
        public payload: IdentityNameModel | IdentityImageModel | IdentityDescriptionModel,
        public isSelf: boolean = false,
    ) { }
}
