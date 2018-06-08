/**
 * @license MIT
 */

import {
    Component,
    Input,
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

require('semantic-ui-css');
const emojiNamedCharacters = require('emoji-named-characters');
const twemoji = require('twemoji');

interface Suggestion {
    image: string | undefined;
    displayName: string;
    value: string;
    type: string;
}

@Component({
    selector: 'app-suggestion-box',
    templateUrl: './suggestion-box.component.html',
    // styleUrls: ['./new-post.component.scss'],
})
export class SuggestionBoxComponent {
    @Input()
    public editor!: any;

    @Input()
    public modal!: any;

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
                const emojis = this.getEmojis();

                const suggestions = identities
                    .map<Suggestion>(item => {
                        return {
                            image: this.getImage(item),
                            displayName: item.primaryName,
                            type: 'identity',
                            value: item.id,
                        };
                    });

                for (const emoji of emojis) {
                    suggestions.push(emoji);
                }

                const searchRegEx = new RegExp(searchTerm, 'i');
                return suggestions
                    .filter(item => searchRegEx.test(item.displayName))
                    .slice(0, 20);
            }));
    }

    public getImage(identity?: IdentityModel) {
        return this.helper.formatIdentityImageUrl(identity);
    }

    public setSearchTerm(event: any) {
        this.observeSearchTerm.next(event.target.value);
    }

    public selectSuggestion(suggestion: Suggestion) {
        let markdown = '';
        if (suggestion.type === 'emoji') {
            markdown = `:${suggestion.value}:`;
        } else if (suggestion.type === 'identity') {
            markdown = `[${suggestion.displayName}](${suggestion.value})`;
        }

        this.editor.insertText(markdown);

        const selector: any = jq('.ui.visible.modal');

        selector.modal('hide');
    }

    private getEmojis(): Suggestion[] {
        const results: Suggestion[] = [];
        for (const emoji in emojiNamedCharacters) {
            // /assets/emoji/1f490.svg
            results.push({
                displayName: emoji,
                image: `/assets/emoji/${twemoji.convert.toCodePoint(emojiNamedCharacters[emoji].character)}.svg`,
                type: 'emoji',
                value: emoji,
            });
        }

        return results;
    }
}

