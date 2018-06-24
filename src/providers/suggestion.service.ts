/**
 * @license MIT
 */

import {
    Injectable,
} from '@angular/core';
import {
    Store,
} from '@ngxs/store';
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
    Suggestion,
} from '../models';
import {
    HelperService,
    ScuttlebotService,
} from '../providers';

const emojiNamedCharacters = require('emoji-named-characters');
const twemoji = require('twemoji');


@Injectable()
export class SuggestionService {

    public identities: Observable<IdentityModel[]>;

    public suggestions: Observable<Suggestion[]>;

    public searchTerm: BehaviorSubject<string>;

    public constructor(
        private store: Store,
        private _sbot: ScuttlebotService,
        private helper: HelperService,
    ) {
        this.searchTerm = new BehaviorSubject<string>('');
        this.searchTerm.pipe(debounceTime(300));
        this.identities = this
            .store
            .select<IdentityModel[]>((state: { identities: IdentityModel[] }) => {
                return state.identities;
            })
            .pipe(debounceTime(600));

        this
            .suggestions = combineLatest(
                this.identities,
                this.searchTerm,
                this.searchTerm.pipe(
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
                        return new Suggestion({
                            image: this.getImage(item),
                            displayText: item.primaryName,
                            type: 'identity',
                            text: `[${item.primaryName}](${item.id})`,
                        });
                    });

                for (const emoji of emojis) {
                    suggestions.push(emoji);
                }

                if (typeof blobs === 'object') {
                    const ids = Object.keys(blobs);
                    for (const id of ids) {
                        suggestions.push(new Suggestion({
                            displayText: blobs[id][0].name,
                            image: `ssb://ssb/${id}`,
                            text: id,
                            type: 'blob',
                        }));
                    }
                }

                const searchRegEx = new RegExp(searchTerm, 'i');
                suggestions = suggestions
                    .filter(item => searchRegEx.test(item.displayText))
                    .slice(0, 20);


                return suggestions;
            }));
    }

    public getImage(identity?: IdentityModel) {
        return this.helper.formatIdentityImageUrl(identity);
    }

    private getEmojis(): Suggestion[] {
        const results: Suggestion[] = [];
        for (const emoji in emojiNamedCharacters) {
            // /assets/emoji/1f490.svg
            results.push(new Suggestion({
                displayText: emoji,
                image: `/assets/emoji/${twemoji.convert.toCodePoint(emojiNamedCharacters[emoji].character)}.svg`,
                type: 'emoji',
                text: `:${emoji}:`,
            }));
        }

        return results;
    }
}
