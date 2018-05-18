require('ts-node').register({
    project: 'tsconfig.electron.json'
});
require('./electron/start-electron');
