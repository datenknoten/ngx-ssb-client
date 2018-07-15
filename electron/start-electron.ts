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
    BrowserWindowConstructorOptions,
    protocol,
    screen,
} from 'electron';
import * as path from 'path';
import * as url from 'url';

import {
    createBlobHandler,
    openWindow,
    setupContext,
} from '.';

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


        const windowOptions: BrowserWindowConstructorOptions = {
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

            win.webContents.openDevTools();
        } else {
            win = openWindow(url.format({
                pathname: path.resolve(__dirname, '../dist/index.html'),
                protocol: 'file:',
                slashes: true,
            }), windowOptions);
        }

        win.maximize();

        win.on('closed', () => {
            signale.error('main window closed');
            app.quit();
            setTimeout(() => process.exit(0), 500);
        });

        const handleRedirect = (event: any, redirectUrl: string) => {
            event.preventDefault();
            require('electron').shell.openExternal(redirectUrl);
            return false;
        };

        win.webContents.on('will-navigate', handleRedirect);
        win.webContents.on('new-window', handleRedirect);

        protocol.registerBufferProtocol('ssb', createBlobHandler());
    }

    protocol.registerStandardSchemes(['ssb']);
    app.on('ready', createWindow);

    app.on('window-all-closed', () => {
        signale.error('All windows closed');
        app.quit();
    });
})();
