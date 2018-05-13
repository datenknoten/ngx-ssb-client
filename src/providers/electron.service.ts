/**
 * @license MIT
 */


import { Injectable } from '@angular/core';

// If you import a module but never use any of the imported values other than as TypeScript types,
// the resulting javascript file will look as if you never imported the module at all.
import { ipcRenderer, webFrame, remote } from 'electron';
import * as childProcess from 'child_process';
import * as fs from 'fs';

@Injectable()
export class ElectronService {

    public ipcRenderer!: typeof ipcRenderer;
    public webFrame!: typeof webFrame;
    public remote!: typeof remote;
    public childProcess!: typeof childProcess;
    public fs!: typeof fs;

    public constructor() {
        // Conditional imports
        if (this.isElectron()) {
            this.ipcRenderer = window.require('electron').ipcRenderer;
            this.webFrame = window.require('electron').webFrame;
            this.remote = window.require('electron').remote;

            this.childProcess = window.require('child_process');
            this.fs = window.require('fs');
        }
    }

    public isElectron = () => {
        return window && window.process && window.process.type;
    }

}
