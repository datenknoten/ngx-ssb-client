/**
 * @license MIT
 */

import {
    Pipe,
    PipeTransform,
} from '@angular/core';

const humanizeDuration = require('humanize-duration');

@Pipe({
    name: 'humanReadableDuration',
})
export class HumanReadableDurationPipe implements PipeTransform {
    public transform(value: number): string {
        return humanizeDuration(value, {
            round: true,
            units: ['m'],
        }).replace(' minutes', '').replace(' minute', '');
    }

}
