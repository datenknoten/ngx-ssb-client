/**
 * @license MIT
 */

import { Location } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    OnInit,
} from '@angular/core';
import {
    Router,
} from '@angular/router';
import {
    Select,
    Store,
} from '@ngxs/store';
import {
    Hotkey,
    HotkeysService,
} from 'angular2-hotkeys';
import * as jq from 'jquery';
import {
    Observable,
} from 'rxjs';
import {
    debounceTime,
    map,
// tslint:disable-next-line:no-submodule-imports
} from 'rxjs/operators';

import {
    CurrentFeedSettings,
} from '../interfaces';
import {
    ChannelSubscription,
    IdentityModel,
} from '../models';
import {
    ScuttlebotService,
} from '../providers';
import { CurrentFeedSettingState } from '../states';
window['jQuery'] = jq;
require('semantic-ui-css');

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
    public title: string = 'app';

    public self: Observable<IdentityModel | undefined>;

    public currentFeedSettings: Observable<CurrentFeedSettings>;

    @Select((state: any) => state.posts.length)
    public messageCount!: Observable<number>;

    public sidebar: any;

    public constructor(
        public sbot: ScuttlebotService,
        private router: Router,
        private store: Store,
        private _hotkeysService: HotkeysService,
        private _location: Location,
    ) {
        this.currentFeedSettings = this
            .store
            .select(CurrentFeedSettingState);

        this.self = this
            .store
            .select((state: any) => state.identities)
            .pipe(
                debounceTime(600),
                map((items: IdentityModel[]) => items.filter(item => item.isSelf).pop()),
        );

        this._hotkeysService.add(
            new Hotkey(
                'alt+left',
                () => {
                    this._location.back();
                    return false;
                },
                undefined,
                'Go back a step in the history',
            ),
        );
        this._hotkeysService.add(
            new Hotkey(
                'alt+right',
                () => {
                    this._location.forward();
                    return false;
                },
                undefined,
                'Go back a step in the history',
            ),
        );
        this._hotkeysService.add(
            new Hotkey(
                'ctrl+f ctrl+u',
                () => {
                    // tslint:disable-next-line:no-floating-promises
                    this.router.navigate(['/feed/public']);
                    return false;
                },
                undefined,
                'Open the public feed',
            ),
        );
    }

    public debug() {
        // tslint:disable-next-line:no-debugger
        debugger;
    }

    public ngOnInit(): void {
        this.sidebar = jq('.ui.sidebar');
        this.sidebar.sidebar({
            dimPage: false,
        });
    }

    public log(item: any) {
        // tslint:disable-next-line:no-console
        console.log(item);
    }

    public formatBlobUrl(id: string) {
        return `ssb://ssb/${id}`;
    }

    public async openPublicFeed() {
        await this.router.navigate(['/feed/', 'public']);
    }

    public async openParticipatingFeed() {
        await this.router.navigate(['/feed/', 'participating']);
    }

    public toggleSidebar() {
        this.sidebar.sidebar('toggle');
    }

    public goToChannel(event: MouseEvent, channel: ChannelSubscription) {
        event.preventDefault();
        this.sidebar.sidebar('toggle');
        // tslint:disable-next-line:no-floating-promises
        this.router.navigate(['/feed/', channel.channel]);
    }
}
