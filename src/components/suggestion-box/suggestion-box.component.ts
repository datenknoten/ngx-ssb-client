/**
 * @license MIT
 */

import {
    Component,
} from '@angular/core';
import { Store } from '@ngxs/store';
import * as jq from 'jquery';
import {
    BehaviorSubject,
    combineLatest,
    Observable,
} from 'rxjs';
import {
    debounceTime,
    map,
} from 'rxjs/operators';

import {
    IdentityModel,
} from '../../models';
import { HelperService } from '../../providers';

window['jQuery'] = jq;
require('semantic-ui-css');
const emojiNamedCharacters = require('emoji-named-characters');
const twemoji = require('twemoji');

interface Suggestion {
    image: string | undefined;
    displayName: string;
    type: string;
}

@Component({
    selector: 'app-suggestion-box',
    templateUrl: './suggestion-box.component.html',
    // styleUrls: ['./new-post.component.scss'],
})
export class SuggestionBoxComponent {
    public identities: Observable<IdentityModel[]>;

    public suggestions: Observable<Suggestion[]>;
    private _searchTerm: string = '';

    private observeSearchTerm: BehaviorSubject<string>;


    public constructor(
        private store: Store,
        private helper: HelperService,
    ) {
        this.observeSearchTerm = new BehaviorSubject<string>(this._searchTerm);
        this.observeSearchTerm.pipe(debounceTime(300));
        this.identities = this
            .store
            .select<IdentityModel[]>((state: { identities: IdentityModel[] }) => {
                return state.identities;
            })
            .pipe(debounceTime(600));

        this
            .suggestions = combineLatest(
                this.identities,
                this.observeSearchTerm,
            ).pipe(map(results => {
                const identities = results[0];
                const searchTerm = results[1];
                console.log(this.getEmojis());

                return identities
                    .filter(item => item.primaryName.includes(searchTerm))
                    .map(item => {
                        return {
                            image: this.getImage(item),
                            displayName: item.primaryName,
                            type: 'identity',
                        };
                    });
            }));

        this.suggestions.subscribe(results => {
            console.log('subscribe', results);
        });
    }

    public getImage(identity?: IdentityModel) {
        return this.helper.formatIdentityImageUrl(identity);
    }

    public setSearchTerm(event: any) {
        console.log(event.target.value);
        this.observeSearchTerm.next(event.target.value);
    }

    private getEmojis(): Suggestion[] {
        const results: Suggestion[] = [];
        for (const emoji in emojiNamedCharacters) {
            results.push({
                displayName: emoji,
                image: twemoji.parse(emojiNamedCharacters[emoji].character, {
                    folder: 'emoji',
                    ext: '.svg',
                    base: '/assets/',
                }),
                type: 'emoji',
            });
        }

        return results;
    }
}

