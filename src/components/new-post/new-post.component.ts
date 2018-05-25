/**
 * @license MIT
 */

import {
    Component,
    ElementRef,
    Input,
    ViewChild,
} from '@angular/core';
import { Store } from '@ngxs/store';
import * as jq from 'jquery';

import {
    IdentityModel,
    LinkModel,
    PostModel,
} from '../../models';
import {
    ScuttlebotService,
} from '../../providers';
import '../../util/tui-editor-completion.extention';

window['jQuery'] = jq;
require('semantic-ui-css');

const mentions = window.require('ssb-mentions');
const editorModule = require('tui-editor');

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

    public previewPost?: PostModel;

    @ViewChild('editor')
    private editorContainer!: ElementRef;

    @ViewChild('preview')
    private preview!: ElementRef;

    private editor: any;

    public constructor(
        public scuttlebot: ScuttlebotService,
        public store: Store,
    ) { }

    public setupEditor() {
        this.previewPost = new PostModel();
        this.visible = true;
        setImmediate(() => {
            this.editor = new editorModule({
                el: this.editorContainer.nativeElement,
                initialEditType: 'markdown',
                previewStyle: 'tabs',
                exts: ['colorSyntax'],
                height: '400px',
                usageStatistics: false,
                hooks: {
                    addImageBlobHook: (file: File, cb: (url: string, text: string) => void) => {
                        // tslint:disable-next-line:no-floating-promises
                        this.createBlob(file, cb);
                    },
                },
            });

            this.editor.mdEditor.eventManager.listen('keyup', (event: { data: KeyboardEvent }) => {
                if (event.data.keyCode === 27) {
                    const button = window.document.querySelector<HTMLButtonElement>('app-new-post .ui.red.button');
                    if (button instanceof HTMLButtonElement) {
                        button.click();
                    }
                }
            });

            if (this.context instanceof PostModel) {
                this.editorContainer.nativeElement.scrollIntoView(true);
            } else {
                this.editorContainer.nativeElement.scrollIntoView(false);
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

        post.content = this.editor.getMarkdown();

        if (!(typeof this.context === 'undefined')) {
            if (this.context instanceof PostModel) {
                if (typeof this.context.rootId === 'string') {
                    post.rootId = this.context.rootId;
                } else {
                    post.rootId = this.context.id;
                }
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

    private async createBlob(file: File, cb: (url: string, text: string) => void) {
        const blob = await this.scuttlebot.createBlob(file);
        cb(blob, file.name);
    }
}

