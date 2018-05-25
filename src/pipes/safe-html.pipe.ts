/**
 * @license MIT
 */

import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({
    name: 'safeHtml',
})
export class SafeHtmlPipe implements PipeTransform {
    public constructor(
        private sanitized: DomSanitizer,
    ) { }
    public transform(value: any, _args?: any): any {
        return this.sanitized.bypassSecurityTrustHtml(value);
    }

}
