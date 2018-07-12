/**
 * @license MIT
 */

import {
    Component,
    ElementRef,
    Input,
    QueryList,
    ViewChild,
    ViewChildren,
} from '@angular/core';
import { Store } from '@ngxs/store';
import * as hyperMD from 'hypermd';
import * as jq from 'jquery';

import {
    IdentityModel,
    LinkModel,
    PostModel,
} from '../../models';
import {
    ScuttlebotService, SuggestionService,
} from '../../providers';

const cm = require('codemirror');
const mentions = window.require('ssb-mentions');

window['jQuery'] = jq;
require('semantic-ui-css');

require('codemirror/addon/hint/show-hint');


@Component({
    selector: 'app-new-post',
    templateUrl: './new-post.component.html',
    styleUrls: ['./new-post.component.scss'],
    // encapsulation: ViewEncapsulation.None,
})
export class NewPostComponent {
    @Input()
    public visible: boolean = false;

    @Input()
    public context?: PostModel | string;

    public showSuggestion: boolean = false;

    public previewPost?: PostModel;

    public editor: any;

    public suggestionModal!: any;

    public editHelpVisibile: boolean = true;

    @ViewChildren('editor')
    private editorContainer!: QueryList<any>;

    @ViewChild('preview')
    private preview!: ElementRef;


    public constructor(
        public scuttlebot: ScuttlebotService,
        public store: Store,
        private _suggestion: SuggestionService,
    ) { }

    public toggleEditHelp() {
        this.editHelpVisibile = !this.editHelpVisibile;
    }

    public setupEditor() {
        const that = this;
        this.previewPost = new PostModel();
        this.visible = true;

        const subscription = this.editorContainer.changes.subscribe((item: QueryList<ElementRef>) => {
            subscription.unsubscribe();
            if (item.length === 0) {
                return;
            }
            const editorContainer = item.first;

            const getHints = function(editor: any, cb: Function, _options: any) {
                const word = /[\w$]+/;
                const cur = editor.getCursor();
                const curLine = editor.getLine(cur.line);
                const end = cur.ch;
                let start = end;
                while (start && word.test(curLine.charAt(start - 1))) {
                    --start;
                }
                const curWord = start !== end && curLine.slice(start, end);


                that._suggestion.searchTerm.next(curWord);

                that._suggestion.suggestions.subscribe(items => {
                    cb({
                        list: items,
                        from: cm.Pos(cur.line, start),
                        to: cm.Pos(cur.line, end),
                    });
                });
            };
            (getHints as any).async = true;


            this.editor = hyperMD.fromTextArea(editorContainer.nativeElement, {
                extraKeys: { 'Ctrl-Space': 'autocomplete' },
                lineNumbers: false,
                hintOptions: {
                    hint: getHints,
                },
                hmdInsertFile: this.fileHandler.bind(this),
            });

            if (this.context instanceof PostModel) {
                editorContainer.nativeElement.scrollIntoView(true);
            } else {
                editorContainer.nativeElement.scrollIntoView(false);
            }
            this.editor.focus();
        });
    }

    public cancel() {
        this.editor = undefined;
        this.visible = false;
    }

    public async submit() {
        const post = new PostModel();

        post.content = this.editor.getValue().replace('ssb://ssb/', '');

        if (!(typeof this.context === 'undefined')) {
            if (this.context instanceof PostModel) {
                if (typeof this.context.rootId === 'string') {
                    post.rootId = this.context.rootId;
                } else {
                    post.rootId = this.context.id;
                }
                post.primaryChannel = this.context.primaryChannel;
            } else if (this.context !== 'public') {
                post.primaryChannel = this.context;
            }
        }

        post.author = this
            .store
            .selectSnapshot((state: any) => state
                .identities
                .filter((item: IdentityModel) => item.isSelf)
                .pop(),
        );

        const _mentions = mentions(post.content);

        for (const item of _mentions) {
            if (item.link.startsWith('@')) {
                const ment = new LinkModel({
                    link: item.link,
                    name: item.name,
                });
                post.mentions.push(ment);
            } else {
                const ment = new LinkModel({
                    link: item.link,
                });
                post.mentions.push(ment);
            }
        }

        this.previewPost = post;

        const that = this;

        const modal: any = jq(this.preview.nativeElement);
        modal
            .modal({
                onApprove: function() {
                    that.cancel();

                    // tslint:disable-next-line:no-floating-promises
                    that
                        .scuttlebot
                        .publish(post)
                        .then(async () => {
                            return that.scuttlebot.updateFeed();
                        });
                },
            })
            .modal('show');
    }

    private async fileHandler(files: any, action: hyperMD.InsertFile.HandlerAction) {
        if (files.length <= 0) {
            return true;
        }

        const blobs: string[] = [];

        for (const file of files) {
            const blobId = await this.scuttlebot.createBlob(file);
            blobs.push(`![${file.name}](ssb://ssb/${blobId})`);
        }

        action.finish(
            blobs.join('\n'),
        );

        return true;
    }
}

