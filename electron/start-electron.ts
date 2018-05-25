/**
 * @license MIT
 */

const signale = require('signale');

process.on('uncaughtException', function(error) {
    signale.error(error);
    process.exit();
});

process.on('unhandledRejection', function(error) {
    signale.error(error);
    process.exit();
});

import {
    app,
    BrowserWindow,
    protocol,
    screen,
} from 'electron';
import * as path from 'path';
import * as url from 'url';

import {
    createBlobHandler,
    openWindow,
    setupContext,
} from '../electron';

const debug = require('debug')('ngx:ssb:init');

// tslint:disable-next-line:no-floating-promises
(async function() {
    let win: BrowserWindow | undefined | null;
    const args = process.argv.slice(1);
    const serve = args.includes('--serve');

    async function createWindow() {
        const config = await setupContext('ssb', {
            setup: true,
        });

        debug('Initial config', config);

        const electronScreen = screen;
        const size = electronScreen.getPrimaryDisplay().workAreaSize;


        const windowOptions = {
            x: 0,
            y: 0,
            width: size.width,
            height: size.height,
        };

        if (serve) {
            require('electron-reload')(__dirname, {
                electron: require(`${__dirname}/../node_modules/electron`),
            });
            win = openWindow('http://localhost:4200', windowOptions);
        } else {
            win = openWindow(url.format({
                pathname: path.join(__dirname, 'dist/index.html'),
                protocol: 'file:',
                slashes: true,
            }), windowOptions);
        }

        win.maximize();

        win.webContents.openDevTools();

        win.on('closed', () => {
            win = null;
        });

        protocol.registerBufferProtocol('ssb', createBlobHandler());
    }

    protocol.registerStandardSchemes(['ssb']);
    app.on('ready', createWindow);

    app.on('window-all-closed', () => {
        app.quit();
    });
})();

