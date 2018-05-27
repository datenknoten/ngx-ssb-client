/**
 * @license MIT
 */

require('jest-preset-angular');
// tslint:disable-next-line: no-submodule-imports
import { getTestBed } from '@angular/core/testing';
beforeEach(() => {
    getTestBed().configureCompiler({ preserveWhitespaces: false } as any);
});
Object.defineProperty(document.body.style, 'transform', {
    value: () => {
        return {
            enumerable: true,
            configurable: true,
        };
    },
});
