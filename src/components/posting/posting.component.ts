/**
 * @license MIT
 */

import {
    Component,
    Input,
} from '@angular/core';
import {
    PostingModel,
    IdentityModel,
} from '../../models';

@Component({
    selector: 'app-posting',
    templateUrl: './posting.component.html',
    styleUrls: ['./posting.component.scss'],
})
export class PostingComponent {

    @Input()
    public posting?: PostingModel;

    @Input()
    public mode: 'condensed' | 'full' = 'condensed';

    public convertHtml(html: string) {
        const cheerio = window.require('cheerio');
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

    public log() {
        // tslint:disable-next-line:no-console
        console.log(this.posting);
    }

    public formatVotes(posting: PostingModel): string {
        if (posting.votes.length === 0) {
            return 'No Likes ☹';
        }

        const likers = posting
            .votes
            .map(item => item.author ? item.author.primaryName : item.authorId)
            .filter((value, index, self) => self.indexOf(value) === index)
            .join(',');

        return `Likes by ${likers}`;
    }

    public formatComments(posting: PostingModel): string {
        if (posting.comments.length === 0) {
            return 'No comments ☹';
        }

        const commenters = posting
            .comments
            .map(item => item.author ? item.author.primaryName : item.authorId)
            .filter((value, index, self) => self.indexOf(value) === index)
            .join(',');

        return `Comments by ${commenters}`;
    }

}
