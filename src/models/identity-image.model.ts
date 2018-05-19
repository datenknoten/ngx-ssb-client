/**
 * @license MIT
 */

import {
    BaseModel,
    IdentityModel,
} from '../models';

export class IdentityImageModel extends BaseModel {
    public blobId!: string;
    public identity!: IdentityModel;
    public weight!: number;
}
