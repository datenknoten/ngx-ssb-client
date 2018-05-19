/**
 * @license MIT
 */

declare var window: Window;
interface Window {
    process: any;
    require: any;
    [index: string]: any;
}

const fs = window.require('fs');
const path = window.require('path');
const electron = window.require('electron');

const createSbot = window.require('scuttlebot')
    .use(window.require('scuttlebot/plugins/master'))
    .use(window.require('scuttlebot/plugins/gossip'))
    .use(window.require('scuttlebot/plugins/replicate'))
    .use(window.require('ssb-friends'))
    .use(window.require('ssb-blobs'))
    .use(window.require('ssb-backlinks'))
    .use(window.require('ssb-private'))
    .use(window.require('scuttlebot/plugins/invite'))
    .use(window.require('scuttlebot/plugins/local'))
    .use(window.require('scuttlebot/plugins/logging'))
    .use(window.require('ssb-query'))
    .use(window.require('ssb-about'))
    .use(window.require('ssb-search'))
    .use(window.require('ssb-names'))
    .use(window.require('ssb-ws'));

export default function startSbot(ssbConfig: any) {
    const context = {
        sbot: createSbot(ssbConfig),
        config: ssbConfig
    };
    ssbConfig.manifest = context.sbot.getManifest();
    fs.writeFileSync(path.join(ssbConfig.path, 'manifest.json'), JSON.stringify(ssbConfig.manifest));
    electron.ipcRenderer.send('server-started', ssbConfig);
}
