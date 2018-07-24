/**
 * @license MIT
 */

import {
    MimeTypedBuffer,
    RegisterBufferProtocolRequest,
} from 'electron';
import * as path from 'path';

// import {
//     Magic,
//     MAGIC_MIME_TYPE,
// } from 'mmmagic';

const Dat = require('dat-node');

import * as url from 'url';

const signale = require('signale');

type requestCallback = (buffer?: Buffer | MimeTypedBuffer) => void;

export function createDatHandler() {
    return async function (request: RegisterBufferProtocolRequest, cb: requestCallback) {
        // const magic = new Magic(MAGIC_MIME_TYPE);

        try {
            const datUrl = url.parse(request.url);
            if (!(typeof datUrl.host === 'string')) {
                throw new Error('Invalid url');
            }

            let filepath = '/tmp';
            if (typeof process.env.HOME === 'string') {
                filepath = path.join(process.env.HOME, '.ssb', 'datfiles', datUrl.host);
            } else if (typeof process.env.USERPROFILE === 'string') {
                filepath = path.join(filepath, '.ssb', 'datfiles', datUrl.host);
            }

            const buffer = await new Promise<any>((resolve: any, reject: any) => {
                Dat(filepath, {
                    temp: true,
                    sparse: true,
                    key: datUrl.host,
                }, (err: any, dat: any) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    dat.joinNetwork();

                    dat.archive.readFile(datUrl.path, function (downloadError: any, content: any) {
                        if (downloadError) {
                            reject(downloadError);
                            return;
                        }
                        resolve(content);
                    });
                });
            });

            console.log(buffer);

            cb({
                mimeType: 'application/octet-stream',
                data: buffer,
            });

        } catch (error) {
            signale.error('failed to fetch blob');
            signale.error(error);
            signale.error(JSON.stringify(request, undefined, '  '));
            cb();
        }
    };
}
