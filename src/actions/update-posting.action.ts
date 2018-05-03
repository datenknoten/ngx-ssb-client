/**
 * @license MIT
 */

import { PostingModel } from '../models';

export class UpdatePosting {
    public static readonly type = '[Posting] UpdatePosting';
    public constructor(public posting: PostingModel) { }
}
