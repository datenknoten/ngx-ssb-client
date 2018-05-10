/**
 * @license MIT
 */

import { BaseModel } from '../models';

export class ChannelSubscription extends BaseModel {
    public channel!: string;
    public isSubscribed: boolean = false;
    public lastModified!: Date;
}
