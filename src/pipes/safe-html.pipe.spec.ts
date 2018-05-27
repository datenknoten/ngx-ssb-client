/**
 * @license MIT
 */

// tslint:disable: no-submodule-imports

import {
    inject,
    TestBed,
} from '@angular/core/testing';
import {
    BrowserModule,
    DomSanitizer,
} from '@angular/platform-browser';
import {
    BrowserTestingModule,
} from '@angular/platform-browser/testing';
import {
    expect,
} from 'chai';

import {
    SafeHtmlPipe,
} from './safe-html.pipe';

describe('SafeHtmlPipe', () => {

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                BrowserModule,
                BrowserTestingModule,
            ],
        });
    });


    it('create an instance', inject([DomSanitizer], (domSanitizer: DomSanitizer) => {
        const pipe = new SafeHtmlPipe(domSanitizer);
        expect(pipe).to.be.instanceof(SafeHtmlPipe);
    }));

    it('should create a safehtml construct', inject([DomSanitizer], (domSanitizer: DomSanitizer) => {
        const pipe = new SafeHtmlPipe(domSanitizer);
        const html = '<div><a href="ssb://ssb/@foobar">Link</a></div>';
        const output = pipe.transform(html);
        expect(output).to.be.an('object');
        expect(output.constructor.name).to.be.equal('SafeHtmlImpl');
    }));
});
