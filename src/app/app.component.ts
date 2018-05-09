/**
 * @license MIT
 */

import {
    Component,
    OnInit,
    ApplicationRef,
    ViewChild,
    ElementRef,
    ChangeDetectionStrategy,
} from '@angular/core';

import {
    IdentityModel,
    PostingModel,
} from '../models';

import {
    ElectronService,
    ScuttlebotService,
} from '../providers';
import {
    Select,
    Store,
} from '@ngxs/store';
import { Observable } from 'rxjs';
import { PostingsState } from '../states';
import { NewPostingComponent } from '../components';
import * as Editor from 'tui-editor';
import { Router, NavigationEnd } from '@angular/router';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
    public title: string = 'app';

    @Select((state) => state.postings.filter(item => !item.rootId))
    public postingsObservable: Observable<PostingModel[]>;

    @Select((state) => state.identities.filter(item => item.isSelf).pop())
    public self: Observable<IdentityModel>;

    @ViewChild('editor')
    private editorContainer: ElementRef;

    @ViewChild('editor')
    private editor: NewPostingComponent;

    public constructor(
        private electron: ElectronService,
        private sbot: ScuttlebotService,
        private store: Store,
        private app: ApplicationRef,
        private router: Router,
    ) {}

    public debug() {
        // tslint:disable-next-line:no-debugger
        debugger;
    }

    public addPost() {
        this.editor.visible = true;
    }

    public ngOnInit(): void {
        this.router.events.subscribe((evt) => {
            if (!(evt instanceof NavigationEnd)) {
                return;
            }
            window.scrollTo(0, 0);
        });
    }

    public log(item) {
        // tslint:disable-next-line:no-console
        console.log(item);
    }

    public async updateFeed() {
        await this.sbot.updateFeed();
    }
}
