/**
 * @license MIT
 */

import {
    Component,
    OnInit,
    Input,
    ViewEncapsulation,
} from '@angular/core';

import { PostingModel } from '../../models';

import {
    ElectronService,
} from '../../providers';

import * as moment from 'moment';

@Component({
    selector: 'app-posting',
    templateUrl: './posting.component.html',
    styleUrls: ['./posting.component.scss'],
})
export class PostingComponent {

    @Input()
    public posting: PostingModel;

    public constructor(
        private electron: ElectronService,
    ) {}

    public get formatedDate() {
        return moment(this.posting.date).fromNow();
    }

    public get html() {
        const cheerio = this.electron.remote.require('cheerio');
        const $ = cheerio.load(this.posting.html);

        $('img').addClass('ui fluid image');
        $('h1,h2,h3').addClass('ui dividing header');

        return $.html();
    }

    public get image() {
        if (this.posting.author && (this.posting.author.image.length > 0)) {
            return `http://localhost:8989/blobs/get/${this.posting.author.image[0]}`;
        } else {
            return './assets/img/image.png';
        }
    }

    public get debug() {
        return JSON.stringify(this.posting, undefined, '  ');
    }

    public get likes() {
        return this.posting.votes.length;
    }

    public get authorLink() {
        return `ssb://${this.posting.authorId}`;
    }

}
