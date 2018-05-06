/**
 * @license MIT
 */
export class UpdateIdentity {
    public static readonly type = '[Identity] UpdateIdentity';
    public constructor(
        public id: string,
        public name?: string,
        public about?: string,
        public image?: string,
        public isSelf: boolean = false,
    ) { }
}
