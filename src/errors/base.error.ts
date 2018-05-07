/**
 * @license MIT
 */

export abstract class BaseError extends Error {
    public constructor() {
        super();
        this.name = this.constructor.name;
    }
}
