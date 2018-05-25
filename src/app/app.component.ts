/**
 * @license MIT
 */

import {
    ChangeDetectionStrategy,
    Component,
    OnInit,
} from '@angular/core';
import {
    NavigationEnd,
    Router,
} from '@angular/router';
import {
    Store,
} from '@ngxs/store';
import * as jq from 'jquery';
import {
    Observable,
    // timer,
} from 'rxjs';

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

    // @Select()
    public self: Observable<IdentityModel>;

    // @Select(CurrentFeedSettingState)
    public currentFeedSettings: Observable<CurrentFeedSettings>;

    public sidebar: any;

    public constructor(
        private sbot: ScuttlebotService,
        private router: Router,
        private store: Store,
    ) {
        this.currentFeedSettings = this
            .store
            .select(CurrentFeedSettingState);

        this.self = this
            .store
            .select((state: any) => state
                .identities
                .filter((item: IdentityModel) => item.isSelf)
                .pop(),
            );
    }

    public debug() {
        // tslint:disable-next-line:no-debugger
        debugger;
    }

    public ngOnInit(): void {
        this.router.events.subscribe((evt) => {
            if (!(evt instanceof NavigationEnd)) {
                return;
            }
            window.scrollTo(0, 0);
        });
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

    public async updateFeed() {
        await this.sbot.updateFeed();
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
