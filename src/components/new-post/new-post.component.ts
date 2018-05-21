/**
 * @license MIT
 */

import {
    Component,
    ViewChild,
    ElementRef,
    Input,
} from '@angular/core';

const Editor = require('tui-editor');
import {
    ScuttlebotService,
} from '../../providers';
import { PostModel, IdentityModel } from '../../models';
import * as jq from 'jquery';
import { Store } from '@ngxs/store';
import '../../util/tui-editor-completion.extention';
window['jQuery'] = jq;
require('semantic-ui-css');

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

    private editor: any;

    public constructor(
        public scuttlebot: ScuttlebotService,
        public store: Store,
    ) { }

    public setupEditor() {
        this.previewPost = new PostModel();
        this.visible = true;
        setImmediate(() => {
            this.editor = new Editor({
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
                }
            });

            this.editor.mdEditor.eventManager.listen('keyup', (event: { data: KeyboardEvent }) => {
                if (event.data.keyCode === 27) {
                    const button = window.document.querySelector<HTMLButtonElement>('app-new-post .ui.red.button');
                    if (button) {
                        button.click();
                    }
                }
            });

            this.editorContainer.nativeElement.scrollIntoView();
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

        if (this.context) {
            if (this.context instanceof PostModel) {
                if (this.context.rootId) {
                    post.rootId = this.context.rootId;
                } else {
                    post.rootId = this.context.id;
                }
            } else if ((typeof this.context === 'string') && (this.context !== 'public')) {
                post.primaryChannel = this.context;
            }
        }

        post.author = this
            .store
            .selectSnapshot((state: any) => state.identities.filter((item: IdentityModel) => item.isSelf).pop());

        this.previewPost = post;

        const that = this;

        const modal: any = jq('.ui.modal');
        modal
            .modal({
                onApprove: function () {
                    that.cancel();

                    // tslint:disable-next-line:no-floating-promises
                    that
                        .scuttlebot
                        .publish(post)
                        .then(async () => {
                            return that.scuttlebot.updateFeed();
                        });
                }
            })
            .modal('show');
    }

    private async createBlob(file: File, cb: (url: string, text: string) => void) {
        const blob = await this.scuttlebot.createBlob(file);
        cb(blob, file.name);
    }
}

