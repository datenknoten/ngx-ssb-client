/**
 * @license MIT
 */

import {
    Component,
    OnInit,
    Input,
    ViewEncapsulation,
} from '@angular/core';

import { PostingModel, IdentityModel } from '../../models';

import {
    ElectronService,
} from '../../providers';

import * as moment from 'moment';

@Component({
    selector: 'app-posting',
    templateUrl: './posting.component.html',
    styleUrls: ['./posting.component.scss'],
})
export class PostingComponent implements OnInit {

    @Input()
    public posting: PostingModel;

    @Input()
    public mode: 'condensed' | 'full' = 'condensed';

    public constructor(
        private electron: ElectronService,
    ) {}

    public ngOnInit(): void {
    }

    public get formatedDate() {
        return moment(this.posting.date).fromNow();
    }

    public convertHtml(html: string) {
        const cheerio = this.electron.remote.require('cheerio');
        const $ = cheerio.load(html);

        $('img:not(.emoji)').addClass('ui fluid image');
        $('h1,h2,h3').addClass('ui dividing header');

        return $.html();
    }

    public getImage(identity: IdentityModel) {
        if (identity && (identity.image.length > 0)) {
            return `http://localhost:8989/blobs/get/${identity.primaryImage}`;
        } else {
            return './assets/img/image.png';
        }
    }

    public get debug() {
        return JSON.stringify(this.posting, undefined, '  ');
    }

    public get authorLink() {
        return `ssb://${this.posting.authorId}`;
    }

    public log() {
        // tslint:disable-next-line:no-console
        console.log(this.posting);
    }

}
