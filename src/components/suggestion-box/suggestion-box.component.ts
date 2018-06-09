/**
 * @license MIT
 */

import {
    ChangeDetectorRef,
    Component,
    Input,
    QueryList,
    ViewChildren,
} from '@angular/core';
import { Store } from '@ngxs/store';
import { ScrollToService } from '@nicky-lenaers/ngx-scroll-to';
import * as jq from 'jquery';
import {
    BehaviorSubject,
    combineLatest,
    from,
    Observable,
} from 'rxjs';
import {
    debounceTime,
    map,
    switchMap,
} from 'rxjs/operators';

import {
    IdentityModel,
} from '../../models';
import { HelperService, ScuttlebotService } from '../../providers';

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
    styleUrls: ['./suggestion-box.component.scss'],
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

    @ViewChildren('suggestionItem')
    private suggestionItems!: QueryList<any>;

    private activeSuggestion?: Suggestion;


    public constructor(
        private store: Store,
        private helper: HelperService,
        private _cref: ChangeDetectorRef,
        private _scrollService: ScrollToService,
        private _sbot: ScuttlebotService,
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
                this.observeSearchTerm.pipe(
                    debounceTime(300),
                    switchMap((searchTerm) => from(this._sbot.searchBlobs(searchTerm))),
                ),
            ).pipe(map(results => {
                const identities = results[0];
                const searchTerm = results[1];
                const blobs = results[2];
                const emojis = this.getEmojis();

                let suggestions = identities
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

                if (typeof blobs === 'object') {
                    const ids = Object.keys(blobs);
                    for (const id of ids) {
                        suggestions.push({
                            displayName: blobs[id][0].name,
                            image: `ssb://ssb/${id}`,
                            value: id,
                            type: 'blob',
                        });
                    }
                }

                const searchRegEx = new RegExp(searchTerm, 'i');
                suggestions = suggestions
                    .filter(item => searchRegEx.test(item.displayName))
                    .slice(0, 20);


                if (suggestions.length > 0) {
                    this.activeSuggestion = suggestions[0];
                }

                return suggestions;
            }));
    }

    public getImage(identity?: IdentityModel) {
        return this.helper.formatIdentityImageUrl(identity);
    }

    public keyHandler(event: KeyboardEvent) {
        if (['ArrowDown', 'ArrowUp', 'Enter'].indexOf(event.key) > -1) {
            this.handleKeyboardNavigation(event);
        } else {
            this.observeSearchTerm.next((event.target as HTMLInputElement).value);
        }
    }

    public selectSuggestion(suggestion: Suggestion) {
        let markdown = '';
        if (suggestion.type === 'emoji') {
            markdown = `:${suggestion.value}:`;
        } else if (suggestion.type === 'identity') {
            markdown = `[${suggestion.displayName}](${suggestion.value})`;
        } else if (suggestion.type === 'blob') {
            markdown = `![${suggestion.displayName}](${suggestion.value})`;
        }

        this.editor.insertText(markdown);

        const selector: any = jq('.ui.visible.modal');

        selector.modal('hide');
    }

    private handleKeyboardNavigation(event: KeyboardEvent) {
        if (typeof this.activeSuggestion === 'undefined') {
            return;
        }
        if (event.key === 'Enter') {
            this.selectSuggestion(this.activeSuggestion);
        } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            const index = this
                .suggestionItems
                .toArray()
                .map(item => item.nativeElement.dataset.id)
                .indexOf(this.activeSuggestion.value);
            if (index > -1 || index < this.suggestionItems.length) {
                const element = this
                    .suggestionItems
                    .toArray()[index + (event.key === 'ArrowDown' ? 1 : -1)];
                if (!element) {
                    return;
                }
                const newId = element
                    .nativeElement
                    .dataset
                    .id;
                this.suggestions.subscribe(items => {
                    this.activeSuggestion = items.filter(item => item.value === newId).pop();
                    this._cref.detectChanges();
                    this._scrollService.scrollTo({
                        target: element.nativeElement,
                        offset: -50,
                    });
                });
            }
        }
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

