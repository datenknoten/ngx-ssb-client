/**
 * @license MIT
 */

import {
    MimeTypedBuffer,
    RegisterBufferProtocolRequest,
} from 'electron';
import {
    Magic,
    MAGIC_MIME_TYPE,
} from 'mmmagic';
import * as util from 'util';
const pull = require('pull-stream');
const ref = require('ssb-ref');
const debug = require('debug')('ngx:ssb:blob');
const signale = require('signale');

type requestCallback = (buffer?: Buffer | MimeTypedBuffer) => void;

function drainFunc(blobId: string, magic: any, cb: requestCallback) {
    return async function(error: any, array: Buffer[]) {
        if (error) {
            signale.error(`Failed to fetch blob ${blobId}`);
            signale.error(error);
            cb();
            return;
        }
        debug(`fetched blob ${blobId}`);
        const data = Buffer.concat(array);
        magic.detect(data, (err: any, mimeType: any) => {
            if (err) {
                signale.error(`Failed to get mimetype for ${blobId}`);
                signale.error({ err });
                cb();
            }
            signale.debug(`Fetched blob ${blobId} as ${mimeType} with size ${data.length}`);
            cb({
                mimeType,
                data,
            });
        });
    };
}

export function createBlobHandler() {
    return async function(request: RegisterBufferProtocolRequest, cb: requestCallback) {
        const ssbClient = util.promisify(require('ssb-client'));
        const sbot = await ssbClient();
        const hasBlob = util.promisify(sbot.blobs.has);
        const wantsBlob = util.promisify(sbot.blobs.want);
        const magic = new Magic(MAGIC_MIME_TYPE);

        try {

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
                    pull.collect(drainFunc(blobId, magic, cb)),
                );
            } else {
                cb();
                return;
            }
        } catch (error) {
            signale.error('failed to fetch blob');
            signale.error(error);
            signale.error(JSON.stringify(request, undefined, '  '));
            cb();
        }
    };
}
