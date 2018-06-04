/**
 * @license MIT
 */

const util = require('util');
const pull = require('pull-stream');
const signale = require('signale');
import {
    Magic,
    MAGIC_MIME_TYPE,
} from 'mmmagic';

exports.version = '1.0.0';

exports.manifest = {
    getMimeTypeFor: 'async',
};

type callbackType = (error: any, mimeType?: string) => void;


exports.init = (sbot: any) => {
    return {
        getMimeTypeFor: async (blobId: string, cb: callbackType) => {
            const hasBlobFunc = util.promisify(sbot.blobs.has);
            const hasBlob = await hasBlobFunc(blobId);
            const magic = new Magic(MAGIC_MIME_TYPE);

            if (hasBlob) {
                pull(
                    sbot.blobs.get(blobId),
                    pull.collect((error: any, array: Buffer[]) => {
                        if (error) {
                            signale.error(`Failed to get mimetype for ${blobId}`);
                            signale.error({ error });
                            cb(`Failed to fetch blob ${blobId}`, undefined);
                            return;
                        }
                        const data = Buffer.concat(array);
                        magic.detect(data, (err: any, mimeType: any) => {
                            if (err) {
                                cb(null, 'application/octet-stream');
                            }
                            cb(null, mimeType);
                        });
                    }),
                );
            } else {
                cb(null, 'application/octet-stream');
            }
        },
    };
};
