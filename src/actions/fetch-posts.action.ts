/**
 * @license MIT
 */

export class FetchPosts {
    public static readonly type = '[Posts] Fetch';
    public constructor(public startAt?: Date) { }
}
