/**
 * @license MIT
 */

import { BrowserModule } from '@angular/platform-browser';
import {
    NgModule,
} from '@angular/core';


import { AppComponent } from './app.component';
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
} from '../pipes';

import {
    ElectronService,
    ScuttlebotService,
} from '../providers';

import { NgxsModule } from '@ngxs/store';
import { SuiModule } from '@yhnavein/ng2-semantic-ui';

import {
    IdentitiesState,
    PostingsState,
    VotingsState,
} from '../states';

import {
    RouterModule,
    Routes,
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
        ]),
        SuiModule,
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
