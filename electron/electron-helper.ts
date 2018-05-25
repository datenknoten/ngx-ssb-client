/**
 * @license MIT
 */

import {
    BrowserWindow,
    BrowserWindowConstructorOptions,
    ipcMain,
} from 'electron';
import * as Path from 'path';
import * as Url from 'url';

const ssbKeys = require('ssb-keys');

export function openWindow(url?: string, opts?: BrowserWindowConstructorOptions, jsFile?: string, jsArgs?: any) {
    const window = new BrowserWindow(opts);
    if (typeof jsFile === 'string') {
        const args = jsArgs ? JSON.stringify(jsArgs) : '';
        window.webContents.on('dom-ready', async function() {
            await window.webContents.executeJavaScript(`
            const start = window.require(${JSON.stringify(jsFile)});
            start.default(${args});
      `);
        });
    }

    if (typeof url === 'string') {
        window.loadURL(url);
    }
    return window;
}

export async function setupContext(appName: string, opts: any, debug: boolean = false): Promise<any> {
    return new Promise<void>((resolve => {
            // tslint:disable-next-line:no-submodule-imports
            const ssbConfig = require('ssb-config/inject')(appName, {
            ...opts,
            port: 8008,
            blobsPort: 8989, // matches ssb-ws
            friends: {
                dunbar: 150,
                hops: 2, // down from 3
            },
        });

        ssbConfig.keys = ssbKeys.loadOrCreateSync(Path.join(ssbConfig.path, 'secret'));

        // fix offline on windows by specifying 127.0.0.1 instead of localhost (default)
        const id = ssbConfig
            .keys
            .id
            .slice(1)
            .replace('.ed25519', '');
        ssbConfig.remote = `net:127.0.0.1:${ssbConfig.port}~shs:${id}`;

        if (opts.server === false) {
            resolve();
        } else {
            ipcMain.once('server-started', function(_ev: any, config: any) {
                resolve(config);
            });
            const filePath = Url.format({
                pathname: Path.resolve(__dirname, 'blank.html'),
                protocol: 'file:',
                slashes: true,
            });
            const windowOptions: BrowserWindowConstructorOptions = {
                center: true,
                fullscreen: false,
                fullscreenable: false,
                height: 600,
                maximizable: debug,
                minimizable: false,
                resizable: debug,
                show: debug,
                skipTaskbar: !debug,
                title: 'ngx-ssb-server',
                useContentSize: true,
                width: 800,
                webPreferences: {
                    nodeIntegration: true,
                },
            };
            const window = openWindow(
                filePath,
                windowOptions,
                Path.resolve(__dirname, '../dist-electron', 'start-sbot.js'),
                ssbConfig,
            );

            if (debug) {
                window.webContents.openDevTools();
            }
        }
    }));
}
