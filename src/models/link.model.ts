/**
 * @license MIT
 */

export class LinkModel {
    public link!: string;

    public name?: string;

    public constructor(data: Partial<LinkModel>) {
        Object.assign(this, data);
    }
}
