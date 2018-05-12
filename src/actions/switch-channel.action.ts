/**
 * @license MIT
 */

export class SwitchChannel {
    public static readonly type = '[CurrentFeedSettings] SwitchChannel';
    public constructor(public channel: string) { }
}
