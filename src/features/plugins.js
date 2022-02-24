/* eslint-disable no-unused-vars */
/* eslint-disable quotes */

const fs = require('fs');
const https = require('https');
const log = require('electron-log');
const { dialog } = require('electron');
const md5File = require('md5-file');
const path = require('path');
const { PluginManager } = require('live-plugin-manager');
require('bytenode');

class KirkaClientScript {

    constructor(scriptData) {
        this.scriptName = scriptData.scriptName;
        this.scriptUUID = scriptData.scriptUUID;
        this.ver = scriptData.ver;
        this.desc = scriptData.desc;
        this.allowedLoc = scriptData.allowedLoc;
        this.allowedPlat = scriptData.allowedPlat;
        this.sett = scriptData.sett;
        this.launchMain = scriptData.launchMain;
        this.launchRenderer = scriptData.launchRenderer;

        if (
            !this.scriptName ||
            !this.ver ||
            !this.desc ||
            !this.allowedLoc ||
            !this.allowedPlat ||
            !this.sett ||
            !this.launchMain ||
            !this.launchRenderer ||
            !this.scriptUUID
        )
            throw 'Invalid Script';
    }

    isLocationMatching(current) {
        return this.allowedLoc.some(location => ['all', current].includes(location));
    }

    isPlatformMatching() {
        return this.allowedPlat.some(platform => ['all', process.platform].includes(platform));
    }

    installUpdate(url, filePath) {
        return new Promise((resolve, reject) => {
            const req = https.get(url, (res) => {
                res.setEncoding('binary');
                let chunks = '';
                log.info(`Update GET: ${res.statusCode}`);

                res.on('data', (chunk) => {
                    chunks += chunk;
                });
                res.on('end', () => {
                    try {
                        fs.writeFileSync(filePath, chunks, 'binary');
                        resolve();
                    } catch (e) {
                        console.log(e);
                        dialog.showErrorBox('Failed to Update Plugin!',
                            'Please start client as Administrator.\nThis can be done by Right Click > Run as Administrator.');
                        resolve();
                    }
                });
            });
            req.on('error', error => {
                log.error(`Update Error: ${error}`);
            });
            req.end();
        });
    }

    ensureIntegrity(filePath) {
        return new Promise((resolve, reject) => {
            const hash = md5File.sync(filePath);
            const data = { hash: hash, uuid: this.scriptUUID };
            const request = {
                method: 'POST',
                hostname: 'kirkaclient.herokuapp.com',
                path: '/api/plugins/updates',
                headers: {
                    'Content-Type': 'application/json'
                },
            };

            const req = https.request(request, res => {
                res.setEncoding('utf-8');
                let chunks = '';
                log.info(`POST: ${res.statusCode} with payload ${JSON.stringify(data)}`);
                if (res.statusCode != 200)
                    reject();
                else {
                    res.on('data', (chunk) => {
                        chunks += chunk;
                    });
                    res.on('end', () => {
                        const response = JSON.parse(chunks);
                        const success = response.success;
                        if (!success)
                            reject();

                        resolve(response);
                    });
                }
            });
            req.on('error', error => {
                log.error(`POST Error: ${error}`);
                reject();
            });

            req.write(JSON.stringify(data));
            req.end();
        });
    }

}

module.exports.pluginLoader = (uuid, fileDir) => {
    const scriptPath = path.join(fileDir, `${uuid}`);
    const content = fs.readFileSync(scriptPath + '.json');
    const r = JSON.parse(content.toString());
    const modules = r.modules;

    const manager = new PluginManager({
        pluginsPath: fileDir + '/node_modules'
    });

    if (modules.length > 0) {
        modules.forEach(module => {
            manager.install(module);
        });
    }

    const script = require(scriptPath + '.jsc');
    return new KirkaClientScript(script('token'));
};
