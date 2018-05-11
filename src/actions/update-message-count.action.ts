/**
 * @license MIT
 */

export class UpdateMessageCount {
    public static readonly type = '[CurrentFeedSettings] UpdateMessageCount';
    public constructor(public reset: boolean = false) { }
}
