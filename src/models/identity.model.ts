/**
 * @license MIT
 */

import {
    BaseModel,
} from '../models';

export class IdentityModel extends BaseModel {
    public isSelf: boolean = false;
    public name: string[] = [];
    public image: string[] = [];
    public about: string[] = [];
    public following: IdentityModel[] = [];
    public blocking: IdentityModel[] = [];
    public followers: IdentityModel[] = [];
    public channels: string[] = [];


    public constructor(init?: Partial<IdentityModel>) {
        super();
        Object.assign(this, init);
    }

    public get primaryImage() {
        if (this.image.length > 0) {
            return this.image[0];
        }
    }

    public get primaryName() {
        if (this.name.length > 0) {
            return this.name[0];
        }
    }
}
