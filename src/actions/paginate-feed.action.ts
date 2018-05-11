/**
 * @license MIT
 */

export class PaginateFeed {
    public static readonly type = '[CurrentFeedSettings] PaginateFeed';
    public constructor(public page: number) { }
}
