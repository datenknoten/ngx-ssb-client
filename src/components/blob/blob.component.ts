/**
 * @license MIT
 */

import {
    Component,
    Inject,
} from '@angular/core';
import {
    MAT_DIALOG_DATA,
    MatDialogRef,
} from '@angular/material';

const { dialog } = window.require('electron').remote;

const fse = window.require('fs-extra');

import { ScuttlebotService } from '../../providers';

@Component({
    selector: 'app-blob',
    templateUrl: './blob.component.html',
    styleUrls: ['./blob.component.scss'],
})
export class BlobComponent {
    public blobId: string;

    public mimeType: Promise<string>;

    public get blobLink() {
        return `ssb://ssb/${this.blobId}`;
    }

    public constructor(
        public dialogRef: MatDialogRef<any>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private sbot: ScuttlebotService,
    ) {
        this.blobId = data.blobId;
        this.mimeType = this.sbot.getMimeTypeFor(this.blobId);
    }

    public async saveBlob() {
        const mimeType = await this.mimeType;

        const fileName = dialog.showSaveDialog(
            {
                title: 'Select a name under which the blob should be saved',
                defaultPath: `${this.blobId}${this.getExtensionFromMimeType(mimeType)}`.replace('/', ''),
                properties: [
                    'openFile',
                    'openDirectory',
                    'multiSelections',
                ],
            },
        );

        if (typeof fileName === 'undefined') {
            return;
        }

        const file = await this.sbot.getBlob(this.blobId);

        const wstream = fse.createWriteStream(fileName);

        for (const buffer of file) {
            wstream.write(buffer);
        }

        wstream.end();
    }

    private getExtensionFromMimeType(mimeType: string) {
        switch (mimeType) {
            case 'image/jpeg':
                return '.jpg';
            case 'image/png':
                return '.png';
            case 'application/pdf':
                return '.pdf';
            default:
                return '';
        }
    }
}
