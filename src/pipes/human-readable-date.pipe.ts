/**
 * @license MIT
 */

import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import * as moment from 'moment';

@Pipe({
    name: 'humanReadableDate'
})
export class HumanReadableDatePipe implements PipeTransform {
    public constructor(
        private sanitized: DomSanitizer,
    ) { }
    public transform(value: any, args?: any): any {
        return moment(value).fromNow();
    }

}
