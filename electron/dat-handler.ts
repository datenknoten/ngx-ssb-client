/**
 * @license MIT
 */

import {
    MimeTypedBuffer,
    RegisterBufferProtocolRequest,
} from 'electron';
import * as path from 'path';

import {
    Magic,
    MAGIC_MIME_TYPE,
} from 'mmmagic';

const datModule = require('dat-node');

import * as url from 'url';

const signale = require('signale');

type requestCallback = (buffer?: Buffer | MimeTypedBuffer) => void;

async function downloadFile(filepath: string, datUrl: url.UrlWithStringQuery) {
    return new Promise<any>((resolve: any, reject: any) => {
        datModule(filepath, {
            temp: true,
            sparse: true,
            key: datUrl.host,
        }, (err: any, dat: any) => {
            if (err) {
                reject(err);
                return;
            }
            dat.joinNetwork();

            dat.archive.readFile(datUrl.path, function(downloadError: any, content: any) {
                if (downloadError) {
                    reject(downloadError);
                    return;
                }
                resolve(content);
            });
        });
    });
}

export function createDatHandler() {
    return async function(request: RegisterBufferProtocolRequest, cb: requestCallback) {
        const magic = new Magic(MAGIC_MIME_TYPE);

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

            const buffer = await downloadFile(filepath, datUrl);

            magic.detect(buffer, (err: any, mimeType: any) => {
                if (err) {
                    signale.error(`Failed to get mimetype for ${datUrl.host}`);
                    signale.error({ err });
                    cb();
                }
                signale.debug(`Fetched blob ${datUrl.host} as ${mimeType} with size ${buffer.length}`);
                cb({
                    mimeType: mimeType,
                    data: buffer,
                });
            });

        } catch (error) {
            signale.error('failed to fetch blob');
            signale.error(error);
            signale.error(JSON.stringify(request, undefined, '  '));
            cb();
        }
    };
}
