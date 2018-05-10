/**
 * @license MIT
 */

import {
    Pipe,
    PipeTransform,
} from '@angular/core';
import * as moment from 'moment';

@Pipe({
    name: 'humanReadableDate'
})
export class HumanReadableDatePipe implements PipeTransform {
    public constructor(
    ) { }
    public transform(value: any): any {
        return moment(value).fromNow();
    }

}
