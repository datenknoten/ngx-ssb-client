/**
 * @license MIT
 */

import { PostModel } from '../models';

export class UpdatePost {
    public static readonly type = '[Post] UpdatePost';
    public constructor(public post: PostModel) { }
}
