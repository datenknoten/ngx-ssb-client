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
} from '@angular/core';

const Editor = require('tui-editor');

interface IConfirmModalContext {
    title: string;
}

@Component({
    selector: 'app-new-posting',
    templateUrl: './new-posting.component.html',
    styleUrls: ['./new-posting.component.scss'],
})
export class NewPostingComponent implements OnInit {
    public options = {
        initialValue: `# new posting`,
        initialEditType: 'markdown',
        previewStyle: 'vertical',
        height: 'auto',
        minHeight: '500px'
    };

    @ViewChild('editor')
    private editorContainer: ElementRef;

    private editor: any;

    public constructor(
        public modal: SuiModal<IConfirmModalContext, void, void>,
    ) {
        this.modal.context = {
            title: 'New Posting',
        };
    }

    public async ngOnInit() {
        console.log(this.editorContainer);
        // this.editor = new Editor({
        //     el: this.editorContainer.nativeElement,
        //     initialValue: `# new posting`,
        //     initialEditType: 'markdown',
        //     previewStyle: 'vertical',
        //     height: '500px',
        //     minHeight: '500px'
        // });
        console.log(this.editor);
    }
}

export class NewPostingModal extends ComponentModalConfig<IConfirmModalContext, void, void> {
    public constructor() {
        super(NewPostingComponent);
    }
}
