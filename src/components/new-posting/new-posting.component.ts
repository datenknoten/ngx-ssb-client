/**
 * @license MIT
 */

import {
    SuiModal,
    ComponentModalConfig,
    ModalSize,
} from '@yhnavein/ng2-semantic-ui';

import {
    Component,
    ViewChild,
    ElementRef,
    OnInit,
    ViewEncapsulation,
    Input,
} from '@angular/core';

import * as Editor from 'tui-editor';

interface IConfirmModalContext {
    title: string;
}

@Component({
    selector: 'app-new-posting',
    templateUrl: './new-posting.component.html',
    styleUrls: ['./new-posting.component.scss'],
    // encapsulation: ViewEncapsulation.None,
})
export class NewPostingComponent implements OnInit {
    @Input()
    public visible: boolean = false;

    @ViewChild('editor')
    private editorContainer: ElementRef;

    private editor: any;

    public async ngOnInit() {
        setTimeout(() => {
            this.initEditor();
        }, 0);
    }

    public initEditor() {
        this.editor = new Editor({
            el: this.editorContainer.nativeElement,
            initialEditType: 'markdown',
            previewStyle: 'tabs',
            exts: ['colorSyntax'],
            height: '600px',
        });
    }

    public cancel() {
        this.visible = false;
    }
}

