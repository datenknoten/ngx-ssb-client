/**
 * @license MIT
 */

import {
    ChangeDetectorRef,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnDestroy,
    OnInit,
    Output,
    QueryList,
    ViewChild,
    ViewChildren,
} from '@angular/core';
import { MatDialog } from '@angular/material';
import { Router } from '@angular/router';
import {
    Store,
} from '@ngxs/store';
import { ScrollToService } from '@nicky-lenaers/ngx-scroll-to';
import { Hotkey, HotkeysService } from 'angular2-hotkeys';
import { memoize } from 'decko';

import * as moment from 'moment';

import {
    AddVoting,
} from '../../actions';
import { BlobComponent, NewPostComponent } from '../../components';
import {
    IdentityModel,
    PostModel,
    VotingModel,
} from '../../models';
import {
    ElectronService,
    HelperService,
    ScuttlebotService,
} from '../../providers';

const ref = window.require('ssb-ref');

type AuthorActivity = {
    author: IdentityModel | undefined,
    activity: Date,
};

@Component({
    selector: 'app-post',
    templateUrl: './post.component.html',
    styleUrls: ['./post.component.scss'],
})
export class PostComponent implements OnInit, OnDestroy {

    @Input()
    public post!: PostModel;

    @Input()
    public mode: 'condensed' | 'full' | 'draft' | 'comment' = 'condensed';

    @Input()
    public active: boolean = false;

    @Output()
    public reply = new EventEmitter<PostModel>();

    @ViewChildren(PostComponent)
    public comments?: QueryList<PostComponent>;

    public activeComment?: PostComponent;

    @ViewChild('editor')
    public editor?: NewPostComponent;

    private hotkeys: Hotkey[] = [];

    // tslint:disable-next-line:parameters-max-number
    public constructor(
        private store: Store,
        private scuttlebot: ScuttlebotService,
        private electron: ElectronService,
        private router: Router,
        private helper: HelperService,
        public elementRef: ElementRef,
        private _hotkeysService: HotkeysService,
        private _scrollService: ScrollToService,
        private changeDetectorRef: ChangeDetectorRef,
        public dialog: MatDialog,
    ) {
    }

    public ngOnInit() {
        if (this.mode === 'full') {
            this.initHotkeys();
        }
    }

    public ngOnDestroy() {
        for (const hotkey of this.hotkeys) {
            this._hotkeysService.remove(hotkey);
        }
    }

    public initHotkeys() {
        this.hotkeys.push(
            new Hotkey(
                'n',
                this.shortcutHandler.bind(this),
                undefined,
                'Scrolls to the next post. If you are at the end, go to the next page.',
            ),
        );
        this.hotkeys.push(
            new Hotkey(
                'p',
                this.shortcutHandler.bind(this),
                undefined,
                'Scrolls to the previous post. If you are at the beginning, go to the previous page.',
            ),
        );
        this.hotkeys.push(
            new Hotkey(
                'f',
                this.favoriteActiveItem.bind(this),
                undefined,
                'Toggle the favorite state of the active item',
            ),
        );
        this.hotkeys.push(
            new Hotkey(
                'r',
                this.replyActiveItem.bind(this),
                undefined,
                'Compose a reply to the active item',
            ),
        );

        for (const key of this.hotkeys) {
            this._hotkeysService.add(key);
        }
    }

    @memoize()
    public convertHtml(html: string) {
        return this.helper.convertHtml(html);
    }

    public getImage(identity?: IdentityModel) {
        return this.helper.formatIdentityImageUrl(identity);
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
        if (!(this.post instanceof PostModel)) {
            return false;
        }

        return this
            .post
            .getPositiveVoters()
            .filter(item => item.isSelf).length === 1;
    }

    public formatComments(post: PostModel): string {
        if (post.comments.length === 0) {
            return 'No comments ☹';
        }

        const commenters = post
            .comments
            .map(item => item.author instanceof IdentityModel ? item.author.primaryName : item.authorId)
            .filter((value, index, self) => self.indexOf(value) === index)
            .join(',');

        return `Comments by ${commenters}`;
    }

    public toIsoDate(date: Date) {
        return moment(date).format('YYYY-MM-DD hh:mm');
    }

    public escapeID(id: string) {
        return encodeURI(id);
    }

    public replyPost(post: PostModel) {
        if (
            this.editor instanceof NewPostComponent &&
            typeof post.content === 'string' &&
            post.author instanceof IdentityModel
        ) {
            let reply = post.content.split('\n').map(line => `> ${line}`).join('\n');
            reply = `[@${post.author.primaryName}](${post.authorId}) wrote:

${reply}`;
            this.editor.replyText = reply.replace('](&', '](ssb://ssb/&');
            this.editor.setupEditor();
        } else if (typeof this.editor === 'undefined') {
            this.reply.next(post);
        }
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
            .filter(item => item.isSelf,
        )
            .pop();

        if (author instanceof IdentityModel) {
            voting.author = author;
            voting.authorId = author.id;
        } else {
            throw new Error('Self not found');
        }

        voting.date = new Date();

        const result = await this.scuttlebot.publish(voting);
        voting.id = result.key;

        this.store.dispatch(new AddVoting(voting)).subscribe(() => {
            this.changeDetectorRef.detectChanges();
        });
    }

    public async click(event: MouseEvent) {
        let anchor = event.target;
        if ((anchor instanceof HTMLSpanElement || anchor instanceof HTMLElement) &&
            (anchor.parentElement instanceof HTMLAnchorElement)) {
            anchor = anchor.parentElement;
        }

        if (anchor instanceof HTMLAnchorElement) {
            event.preventDefault();
            if (anchor.href.startsWith('ssb://')) {
                await this.handleSSBLinks(anchor);
            } else if (anchor.href.startsWith('http')) {
                this.electron.remote.shell.openExternal(anchor.href);
            }
        }
    }

    public async openDetail(id: string) {
        await this.scuttlebot.get(id);
        await this.router.navigate(['/post/', id]);
    }

    public setActiveComment(post: PostModel) {
        if (this.comments instanceof QueryList && this.comments.length > 0) {
            for (const item of this.comments.toArray()) {
                item.active = false;
                if (item.post === post) {
                    this.activeComment = item;
                    item.active = true;
                }
            }
        }
        this.changeDetectorRef.detectChanges();
    }

    public get aggregateComments() {
        if (this.post.comments.length === 0) {
            return [];
        }

        const originalActivities = this.post.comments.map<AuthorActivity>((comment) => {
            return {
                author: comment.author,
                activity: comment.date,
            };
        });

        const activities: AuthorActivity[] = [];

        for (const activity of originalActivities) {
            const _activity = activities.filter(item => item.author === activity.author).pop();

            if (typeof _activity !== 'undefined') {
                if (_activity.activity < activity.activity) {
                    _activity.activity = activity.activity;
                }
            } else {
                activities.push(activity);
            }
        }

        activities.sort((a, b) => b.activity.getTime() - a.activity.getTime());

        return activities;
    }

    public get aggregatedVotes() {
        if (this.post.votes.length === 0) {
            return [];
        }

        let activities: AuthorActivity[] = [];

        const votes = this.post.votes.filter(item => item.author instanceof IdentityModel);

        for (const vote of votes) {
            const _activity = activities.filter(item => item.author === vote.author).pop();

            if (typeof _activity !== 'undefined') {
                if (vote.value === 0) {
                    activities = activities.filter(item => item.author !== vote.author);
                }
            } else {
                if (vote.value === 1) {
                    activities.push({
                        activity: vote.date,
                        author: vote.author,
                    });
                }
            }
        }

        return activities;

    }

    private async handleSSBLinks(anchor: HTMLAnchorElement) {
        const target = anchor.href.replace(/^ssb:\/\/ssb\//, '');
        const id = ref.extract(target);
        const type = ref.type(id);
        if (type === 'msg') {
            await this.openDetail(id);
        }
        else if (type === 'feed') {
            await this.router.navigate(['/feed/', id]);
        }
        else if (target.startsWith('#')) {
            await this.router.navigate(['/feed', ref.normalizeChannel(target)]);
        }
        else if (type === 'blob') {
            this.dialog.open(BlobComponent, {
                data: {
                    blobId: id,
                },
            });
        }
    }

    private favoriteActiveItem() {
        if (this.activeComment instanceof PostComponent) {
            // tslint:disable-next-line:no-floating-promises
            this.activeComment.toggleLike();
        }
        return false;
    }

    private replyActiveItem() {
        if (this.activeComment instanceof PostComponent) {
            // tslint:disable-next-line:no-floating-promises
            this.activeComment.replyPost(this.activeComment.post);
        }
    }

    private shortcutHandler(_event: ExtendedKeyboardEvent, combo: string) {
        const isForward = (combo === 'n');

        if (!(this.comments instanceof QueryList)) {
            return false;
        }

        if (typeof this.activeComment === 'undefined') {
            this.activeComment = (isForward ? this.comments.first : undefined);
        } else if (!(this.activeComment === (isForward ? this.comments.last : this.comments.first))) {
            const index = this.comments.toArray().indexOf(this.activeComment);
            this.activeComment = this.comments.toArray()[index + (isForward ? 1 : -1)];
        }

        for (const item of this.comments.toArray()) {
            item.active = false;
        }

        if (this.activeComment instanceof PostComponent) {
            this.activeComment.active = true;
            this._scrollService.scrollTo({
                target: this.activeComment.elementRef,
                offset: -50,
                duration: 0,
            });
        }
        this.changeDetectorRef.detectChanges();
        return false;
    }


}
