/**
 * @license MIT
 */

import {
    Component,
    OnInit,
    ApplicationRef,
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
import { NewPostingModal } from '../components/new-posting';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent {

    public title: string = 'app';

    @Select((state) => state.postings.filter(item => !item.rootId).slice(0, 20))
    public postingsObservable: Observable<PostingModel[]>;


    public constructor(
        private electron: ElectronService,
        private sbot: ScuttlebotService,
        private store: Store,
        private app: ApplicationRef,
        private modalService: SuiModalService,
    ) {
        this.postingsObservable.subscribe(items => {
            this.app.tick();
        });
    }

    public debug() {
        // tslint:disable-next-line:no-debugger
        debugger;
    }

    public addPost() {
        this.modalService.open(new NewPostingModal());
    }
}
