/**
 * @license MIT
 */

import {
    BaseModel,
    ChannelSubscription,
    IdentityDescriptionModel,
    IdentityImageModel,
    IdentityNameModel,
} from '../models';

export class IdentityModel extends BaseModel {
    public isSelf: boolean = false;
    public name: IdentityNameModel[] = [];
    public image: IdentityImageModel[] = [];
    public about?: IdentityDescriptionModel;
    public following: IdentityModel[] = [];
    public blocking: IdentityModel[] = [];
    public followers: IdentityModel[] = [];
    public channels: ChannelSubscription[] = [];


    public constructor(init?: Partial<IdentityModel>) {
        super();
        this.isMissing = true;
        Object.assign(this, init);
    }

    public get primaryImage() {
        if (this.image.length > 0) {
            const primary = this.image.reduce(this.primaryReducer);
            return primary.blobId;
        }
    }

    public get primaryName() {
        if (this.name.length > 0) {
            const primary = this.name.reduce(this.primaryReducer);
            return primary.name;
        }
        return this.id;
    }

    public isFollowing(identity: IdentityModel): boolean {
        return this.following.filter(item => item.id === identity.id).length === 1;
    }

    private primaryReducer(previous: any, current: any) {
        if (current.weight > previous.weight) {
            return current;
        } else {
            return previous;
        }
    }
}
