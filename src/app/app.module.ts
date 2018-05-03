/**
 * @license MIT
 */

import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';


import { AppComponent } from './app.component';
import {
    PostingComponent,
    NewPostingComponent,
} from '../components';

import {
    SafeHtmlPipe,
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


@NgModule({
    declarations: [
        AppComponent,
        PostingComponent,
        SafeHtmlPipe,
        NewPostingComponent,
    ],
    imports: [
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
        NewPostingComponent,
    ]
})
export class AppModule { }
