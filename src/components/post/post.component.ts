/**
 * @license MIT
 */

import {
    Component,
    Input,
} from '@angular/core';
import {
    PostModel,
    IdentityModel,
    VotingModel,
} from '../../models';
import {
    Store,
} from '@ngxs/store';
import { ScuttlebotService } from '../../providers';

@Component({
    selector: 'app-post',
    templateUrl: './post.component.html',
    styleUrls: ['./post.component.scss'],
})
export class PostComponent {

    @Input()
    public post!: PostModel;

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
            return `ssb://ssb/${identity.primaryImage}`;
        } else {
            return './assets/img/image.png';
        }
    }

    public get debug() {
        return JSON.stringify(this.post, undefined, '  ');
    }

    public log() {
        // tslint:disable-next-line:no-console
        console.log(this.post);
    }

    public formatVotes(post: PostModel): string {
        if (post.votes.length === 0) {
            return 'No Likes ☹';
        }

        const likers = post
            .getPositiveVoters()
            .map(item => item.primaryName)
            .join(', ');

        return `${likers} liked this post`;
    }

    public get hasSelfLike(): boolean {
        if (!this.post) {
            return false;
        }

        return this.post.getPositiveVoters().filter(item => item.isSelf).length === 1;
    }

    public formatComments(post: PostModel): string {
        if (post.comments.length === 0) {
            return 'No comments ☹';
        }

        const commenters = post
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

        voting.link = this.post.id;

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