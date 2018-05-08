/**
 * @license MIT
 */
export class SetChannelSubscription {
    public static readonly type = '[Identity] SetIdentityChannel';
    public constructor(
        public id: string,
        public channel: string,
        public isSubscribed: boolean,
        public date: Date,
    ) { }
}
