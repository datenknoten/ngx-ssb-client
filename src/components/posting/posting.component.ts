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
    VotingModel,
} from '../../models';
import {
    Store,
} from '@ngxs/store';
import { ScuttlebotService } from '../../providers';

@Component({
    selector: 'app-posting',
    templateUrl: './posting.component.html',
    styleUrls: ['./posting.component.scss'],
})
export class PostingComponent {

    @Input()
    public posting!: PostingModel;

    @Input()
    public mode: 'condensed' | 'full' = 'condensed';

    public constructor(
        private store: Store,
        private scuttlebot: ScuttlebotService,
    ) { }

    public convertHtml(html: string) {
        const cheerio = window.require('cheerio');
        const $ = cheerio.load(html);

        $('img:not(.emoji)').addClass('ui fluid image');
        $('h1,h2,h3').addClass('ui dividing header');

        return $.html();
    }

    public getImage(identity?: IdentityModel) {
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
            .getPositiveVoters()
            .map(item => item.primaryName)
            .join(', ');

        return `${likers} liked this posting`;
    }

    public get hasSelfLike(): boolean {
        if (!this.posting) {
            return false;
        }

        return this.posting.getPositiveVoters().filter(item => item.isSelf).length === 1;
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

    public async toggleLike() {
        const voting = new VotingModel();
        if (this.hasSelfLike) {
            voting.value = 0;
            voting.reason = 'Unlike';
        } else {
            voting.value = 1;
            voting.reason = 'Like';
        }

        voting.link = this.posting.id;

        const author = this
            .store
            .selectSnapshot<IdentityModel[]>((state) => state.identities)
            .filter(item => item.isSelf
            )
            .pop();

        if (author) {
            voting.author = author;
            voting.authorId = author.id;
        } else {
            throw new Error('Self not found');
        }

        await this.scuttlebot.publish(voting);
        await this.scuttlebot.updateFeed();
    }

}
