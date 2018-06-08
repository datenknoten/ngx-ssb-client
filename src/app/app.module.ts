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
import { ScrollToModule } from '@nicky-lenaers/ngx-scroll-to';
import { HotkeyModule } from 'angular2-hotkeys';
import { LazyLoadImagesModule } from 'ngx-lazy-load-images';

import {
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
        LazyLoadImagesModule,
    ],
    providers: [
        ElectronService,
        ScuttlebotService,
        HelperService,
    ],
    bootstrap: [AppComponent],
    entryComponents: [
        PostDetailComponent,
        PublicFeedComponent,
    ],
})
export class AppModule { }
