/**
 * @license MIT
 */

import {
    BrowserModule,
} from '@angular/platform-browser';
import {
    NgModule,
} from '@angular/core';
import {
    AppComponent,
} from './app.component';
import {
    PostComponent,
    NewPostComponent,
} from '../components';
import {
    PostDetailComponent,
    PublicFeedComponent,
} from '../pages';
import {
    SafeHtmlPipe,
    HumanReadableDatePipe,
    HumanReadableDurationPipe,
    SafeSSBUrlPipe,
} from '../pipes';
import {
    ElectronService,
    ScuttlebotService,
} from '../providers';
import {
    NgxsModule,
} from '@ngxs/store';

import {
    IdentitiesState,
    PostsState,
    VotingsState,
    CurrentFeedSettingState,
} from '../states';
import {
    RouterModule,
} from '@angular/router';


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
                redirectTo: 'public',
                pathMatch: 'full',
            },
            {
                path: 'public',
                component: PublicFeedComponent,
            },
            {
                path: 'post/:id',
                component: PostDetailComponent,
            }
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
    ]
})
export class AppModule { }
