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
    PostingComponent,
    NewPostingComponent,
    PostingDetailComponent,
    PublicFeedComponent,

} from '../components';
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
    PostingsState,
    VotingsState,
    CurrentFeedSettingState,
} from '../states';
import {
    RouterModule,
} from '@angular/router';


@NgModule({
    declarations: [
        AppComponent,
        PostingComponent,
        SafeHtmlPipe,
        HumanReadableDatePipe,
        HumanReadableDurationPipe,
        NewPostingComponent,
        PostingDetailComponent,
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
                path: 'posting/:id',
                component: PostingDetailComponent,
            }
        ], {
            enableTracing: false,
        }),
        BrowserModule,
        NgxsModule.forRoot([
            IdentitiesState,
            PostingsState,
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
        PostingDetailComponent,
        PublicFeedComponent,
    ]
})
export class AppModule { }
