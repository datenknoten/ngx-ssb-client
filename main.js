"use strict";
/**
 * @license MIT
 */
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = require("path");
const url = require("url");
const util = require("util");
const pull = require('pull-stream');
let win;
const args = process.argv.slice(1);
const serve = args.includes('--serve');
async function createWindow() {
    const ssbClient = util.promisify(require('ssb-client'));
    const bot = await ssbClient();
    const electronScreen = electron_1.screen;
    const size = electronScreen.getPrimaryDisplay().workAreaSize;
    electron_1.protocol.registerBufferProtocol('ssb', function (request, cb) {
        const _url = url.parse(request.url);
        if (_url.path) {
            const blobId = _url.path.slice(1);
            if (blobId === 'undefined') {
                return;
            }
            const feed = bot.blobs.get(blobId);
            pull(feed, pull.collect(function (err, array) {
                if (err) {
                    throw err;
                }
                cb({
                    mimeType: 'image/jpeg',
                    data: Buffer.concat(array),
                });
            }));
        }
    });
    // Create the browser window.
    win = new electron_1.BrowserWindow({
        x: 0,
        y: 0,
        width: size.width,
        height: size.height
    });
    if (serve) {
        require('electron-reload')(__dirname, {
            electron: require(`${__dirname}/node_modules/electron`)
        });
        win.loadURL('http://localhost:4200');
    }
    else {
        win.loadURL(url.format({
            pathname: path.join(__dirname, 'dist/index.html'),
            protocol: 'file:',
            slashes: true
        }));
    }
    win.webContents.openDevTools();
    // Emitted when the window is closed.
    win.on('closed', () => {
        // Dereference the window object, usually you would store window
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        win = null;
    });
}
try {
    electron_1.protocol.registerStandardSchemes(['ssb']);
    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    // Some APIs can only be used after this event occurs.
    electron_1.app.on('ready', createWindow);
    // Quit when all windows are closed.
    electron_1.app.on('window-all-closed', () => {
        // On OS X it is common for applications and their menu bar
        // to stay active until the user quits explicitly with Cmd + Q
        if (process.platform !== 'darwin') {
            electron_1.app.quit();
        }
    });
    electron_1.app.on('activate', () => {
        // On OS X it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (win === null) {
            // tslint:disable-next-line:no-floating-promises
            createWindow();
        }
    });
}
catch (e) {
    // Catch Error
    // throw e;
}
