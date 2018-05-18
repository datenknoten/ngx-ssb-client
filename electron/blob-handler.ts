/**
 * @license MIT
 */

import * as util from 'util';
import {
    MAGIC_MIME_TYPE,
    Magic,
} from 'mmmagic';
import { RegisterBufferProtocolRequest, MimeTypedBuffer } from 'electron';
const pull = require('pull-stream');
const ref = require('ssb-ref');
const debug = require('debug')('ngx:ssb:blob');

export function createBlobHandler(sbot: any) {
    const hasBlob = util.promisify(sbot.blobs.has);
    const wantsBlob = util.promisify(sbot.blobs.want);
    const magic = new Magic(MAGIC_MIME_TYPE);

    return async function (request: RegisterBufferProtocolRequest, cb: (buffer?: Buffer | MimeTypedBuffer) => void) {
        const blobId = ref.extract(request.url);
        const type = ref.type(blobId);

        if (type === 'blob') {
            debug(`fetching blob ${blobId}`);

            if (!(await hasBlob(blobId))) {
                debug(`blob ${blobId} not available, trying to fetch`);
                await wantsBlob(blobId);
            }

            pull(
                sbot.blobs.get(blobId),
                pull.collect(async function (error: any, array: Buffer[]) {
                    if (error) {
                        // tslint:disable-next-line:no-console
                        console.error(`Failed to fetch blob ${blobId}`);
                        // tslint:disable-next-line:no-console
                        console.error({ error });
                        cb();
                        return;
                    }
                    debug(`fetched blob ${blobId}`);
                    const data = Buffer.concat(array);
                    magic.detect(data, (err: any, mimeType: any) => {
                        if (err) {
                            // tslint:disable-next-line:no-console
                            console.error(`Failed to get mimetype for ${blobId}`);
                            // tslint:disable-next-line:no-console
                            console.error({ err });
                            cb();
                        }
                        debug(`Fetched blob ${blobId} as ${mimeType} with size ${data.length}`);
                        cb({
                            mimeType,
                            data,
                        });
                    });
                }),
            );
        } else {
            cb();
            return;
        }
    };
}
