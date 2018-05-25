/**
 * @license MIT
 */

import {
    NgModule,
} from '@angular/core';
import {
    BrowserModule,
} from '@angular/platform-browser';
import {
    RouterModule,
} from '@angular/router';
import {
    NgxsModule,
} from '@ngxs/store';

import {
    NewPostComponent,
    PostComponent,
} from '../components';
import {
    PostDetailComponent,
    PublicFeedComponent,
} from '../pages';
import {
    HumanReadableDatePipe,
    HumanReadableDurationPipe,
    SafeHtmlPipe,
    SafeSSBUrlPipe,
} from '../pipes';
import {
    ElectronService,
    ScuttlebotService,
} from '../providers';
import {
    CurrentFeedSettingState,
    IdentitiesState,
    PostsState,
    VotingsState,
} from '../states';

import {
    AppComponent,
} from './app.component';


@NgModule({
    declarations: [
        AppComponent,
        PostComponent,
        SafeHtmlPipe,
        HumanReadableDatePipe,
        HumanReadableDurationPipe,
        NewPostComponent,
        PostDetailComponent,
        PublicFeedComponent,
        SafeSSBUrlPipe,
    ],
    imports: [
        RouterModule.forRoot([
            {
                path: '',
                redirectTo: 'feed/public',
                pathMatch: 'full',
            },
            {
                path: 'feed/:channel',
                component: PublicFeedComponent,
            },
            {
                path: 'post/:id',
                component: PostDetailComponent,
            },
        ], {
            enableTracing: false,
        }),
        BrowserModule,
        NgxsModule.forRoot([
            IdentitiesState,
            PostsState,
            VotingsState,
            CurrentFeedSettingState,
        ]),
    ],
    providers: [
        ElectronService,
        ScuttlebotService,
    ],
    bootstrap: [AppComponent],
    entryComponents: [
        PostDetailComponent,
        PublicFeedComponent,
    ],
})
export class AppModule { }
