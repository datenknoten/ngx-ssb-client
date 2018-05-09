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

@Component({
    selector: 'app-new-posting',
    templateUrl: './new-posting.component.html',
    styleUrls: ['./new-posting.component.scss'],
    // encapsulation: ViewEncapsulation.None,
})
export class NewPostingComponent {
    @Input()
    public visible: boolean = false;

    @ViewChild('editor')
    private editorContainer: ElementRef;

    private editor: any;

    public constructor(
        public scuttlebot: ScuttlebotService,
    ) {}

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
        const content = this.editor.getMarkdown();

        this.editor.setMarkdown('');

        await this.scuttlebot.publish({
            type: 'post',
            text: content,
        });

        await this.scuttlebot.updateFeed();

        this.cancel();

    }
}

