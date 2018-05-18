"use strict";
/**
 * @license MIT
 */
Object.defineProperty(exports, "__esModule", { value: true });
const util = require("util");
const mmmagic_1 = require("mmmagic");
const pull = require('pull-stream');
const ref = require('ssb-ref');
const debug = require('debug')('ngx:ssb:blob');
function createBlobHandler(sbot) {
    const hasBlob = util.promisify(sbot.blobs.has);
    const wantsBlob = util.promisify(sbot.blobs.want);
    const magic = new mmmagic_1.Magic(mmmagic_1.MAGIC_MIME_TYPE);
    return async function (request, cb) {
        const blobId = ref.extract(request.url);
        const type = ref.type(blobId);
        if (type === 'blob') {
            debug(`fetching blob ${blobId}`);
            if (!(await hasBlob(blobId))) {
                debug(`blob ${blobId} not available, trying to fetch`);
                await wantsBlob(blobId);
            }
            pull(sbot.blobs.get(blobId), pull.collect(async function (error, array) {
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
                magic.detect(data, (err, mimeType) => {
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
            }));
        }
        else {
            cb();
            return;
        }
    };
}
exports.createBlobHandler = createBlobHandler;
