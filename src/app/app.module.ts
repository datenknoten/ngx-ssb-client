/**
 * @license MIT
 */

import {
    NgModule,
} from '@angular/core';
import {
    MatDialogModule,
} from '@angular/material';
import {
    BrowserModule,
} from '@angular/platform-browser';
import {
    NoopAnimationsModule,
} from '@angular/platform-browser/animations';
import {
    RouterModule,
} from '@angular/router';
import {
    NgxsModule,
} from '@ngxs/store';
import { ScrollToModule } from '@nicky-lenaers/ngx-scroll-to';
import { HotkeyModule } from 'angular2-hotkeys';

import {
    BlobComponent,
    NewPostComponent,
    PostComponent,
    SuggestionBoxComponent,
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
    HelperService,
    ScuttlebotService,
    SuggestionService,
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
        SuggestionBoxComponent,
        BlobComponent,
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
        ScrollToModule.forRoot(),
        HotkeyModule.forRoot({
            disableCheatSheet: false,
            cheatSheetCloseEsc: true,
        }),
        NoopAnimationsModule,
        MatDialogModule,
    ],
    providers: [
        ElectronService,
        ScuttlebotService,
        HelperService,
        SuggestionService,
    ],
    bootstrap: [AppComponent],
    entryComponents: [
        PostDetailComponent,
        PublicFeedComponent,
        BlobComponent,
    ],
})
export class AppModule { }
