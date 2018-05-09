/**
 * @license MIT
 */

import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import * as humanizeDuration from 'humanize-duration';

@Pipe({
    name: 'humanReadableDuration'
})
export class HumanReadableDurationPipe implements PipeTransform {
    public constructor(
        private sanitized: DomSanitizer,
    ) { }
    public transform(value: any, args?: any): any {
        return humanizeDuration(value, { round: true });
    }

}
