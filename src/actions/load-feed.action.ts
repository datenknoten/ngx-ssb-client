/**
 * @license MIT
 */

export class LoadFeed {
    public static readonly type = '[CurrentFeedSettings] LoadFeed';
    public constructor(public loading: boolean) { }
}
