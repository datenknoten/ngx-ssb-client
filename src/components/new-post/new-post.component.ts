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
import { PostModel } from '../../models';

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
    public context?: PostModel;

    @ViewChild('editor')
    private editorContainer!: ElementRef;

    private editor: any;

    public constructor(
        public scuttlebot: ScuttlebotService,
    ) { }

    public setupEditor() {
        this.visible = true;
        setImmediate(() => {
            this.editor = new Editor({
                el: this.editorContainer.nativeElement,
                initialEditType: 'markdown',
                previewStyle: 'tabs',
                exts: ['colorSyntax'],
                height: '600px',
                hooks: {
                    addImageBlobHook: (file: File, cb: (url: string, text: string) => void) => {
                        // tslint:disable-next-line:no-floating-promises
                        this.createBlob(file, cb);
                    },
                }
            });

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
            if (this.context.rootId) {
                post.rootId = this.context.rootId;
            } else {
                post.rootId = this.context.id;
            }
        }

        this.cancel();

        await this.scuttlebot.publish(post);
        await this.scuttlebot.updateFeed();
    }

    private async createBlob(file: File, cb: (url: string, text: string) => void) {
        const blob = await this.scuttlebot.createBlob(file);
        cb(blob, file.name);
    }
}

