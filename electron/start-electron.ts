/**
 * @license MIT
 */

const PrettyError = require('pretty-error');
const pe = new PrettyError();

process.on('uncaughtException', function (error) {
    console.error(pe.render(error));
    process.exit();
});

process.on('unhandledRejection', function (error) {
    console.error(pe.render(error));
    process.exit();
});

import {
    app,
    BrowserWindow,
    screen,
    protocol,
} from 'electron';
import * as path from 'path';
import * as url from 'url';
import * as util from 'util';
import {
    createBlobHandler,
} from '../electron';

let win: BrowserWindow | undefined | null;
const args = process.argv.slice(1);
const serve = args.includes('--serve');

async function createWindow() {
    const ssbClient = util.promisify(require('ssb-client'));

    const bot = await ssbClient();

    const electronScreen = screen;
    const size = electronScreen.getPrimaryDisplay().workAreaSize;

    protocol.registerBufferProtocol('ssb', createBlobHandler(bot));
    // Create the browser window.
    win = new BrowserWindow({
        x: 0,
        y: 0,
        width: size.width,
        height: size.height,
    });

    win.maximize();

    if (serve) {
        require('electron-reload')(__dirname, {
            electron: require(`${__dirname}/../node_modules/electron`)
        });
        win.loadURL('http://localhost:4200');
    } else {
        win.loadURL(url.format({
            pathname: path.join(__dirname, 'dist/index.html'),
            protocol: 'file:',
            slashes: true
        }));
    }

    win.webContents.openDevTools();

    win.on('closed', () => {
        win = null;
    });
}

protocol.registerStandardSchemes(['ssb']);
app.on('ready', createWindow);

app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
        // tslint:disable-next-line:no-floating-promises
        createWindow();
    }
});

