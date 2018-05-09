/**
 * @license MIT
 */

import {
    Component,
    ViewChild,
    ElementRef,
    OnInit,
    ViewEncapsulation,
    Input,
} from '@angular/core';

import * as Editor from 'tui-editor';
import {
    ScuttlebotService,
} from '../../providers';
import { PostingModel } from '../../models';

@Component({
    selector: 'app-new-posting',
    templateUrl: './new-posting.component.html',
    styleUrls: ['./new-posting.component.scss'],
    // encapsulation: ViewEncapsulation.None,
})
export class NewPostingComponent {
    @Input()
    public visible: boolean = false;

    @Input()
    public context?: PostingModel;

    @ViewChild('editor')
    private editorContainer: ElementRef;

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
            });

            this.editor.focus();
        });
    }

    public cancel() {
        this.editor = undefined;
        this.visible = false;
    }

    public async submit() {
        const posting = new PostingModel();

        posting.content = this.editor.getMarkdown();

        if (this.context) {
            if (this.context.rootId) {
                posting.rootId = this.context.rootId;
            } else {
                posting.rootId = this.context.id;
            }
        }

        this.cancel();

        await this.scuttlebot.publish(posting);
        await this.scuttlebot.updateFeed();
    }
}

