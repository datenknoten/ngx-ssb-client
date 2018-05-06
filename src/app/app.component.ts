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
import { SuiModalService } from '@yhnavein/ng2-semantic-ui';
import { NewPostingComponent } from '../components';
import * as Editor from 'tui-editor';

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
    ) {}

    public debug() {
        // tslint:disable-next-line:no-debugger
        debugger;
    }

    public addPost() {
        this.editor.visible = true;
    }

    public ngOnInit(): void {

    }

    public log(item) {
        // tslint:disable-next-line:no-console
        console.log(item);
    }
}
