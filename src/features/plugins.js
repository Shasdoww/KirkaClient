/* eslint-disable no-unused-vars */
/* eslint-disable quotes */

const fs = require('fs');
const https = require('https');
const log = require('electron-log');
const { dialog } = require('electron');
const md5File = require('md5-file');
const path = require('path');
const { PluginManager } = require('live-plugin-manager');
let manager;
let tmpFile;
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

}

module.exports.pluginLoader = async function(uuid, fileDir, skipInstall = false, force = false) {
    log.info('call to load', uuid, 'with skipInstall as', skipInstall);
    const scriptPath = path.join(fileDir, `${uuid}`);

    if (!manager) {
        manager = new PluginManager({
            pluginsPath: path.join(fileDir, 'node_modules')
        });
    }

    if (!tmpFile) {
        tmpFile = path.join(fileDir, 'tmp.js');
        fs.writeFileSync(tmpFile, '');
    }

    if (!skipInstall) {
        const content = fs.readFileSync(scriptPath + '.json');
        const r = JSON.parse(content.toString());
        const modules = r.modules;

        log.info('Modules to install:', modules);
        for (let i = 0; i < modules.length; i++) {
            const mod = modules[i];
            if (manager.alreadyInstalled(mod) || !force) {
                log.info(mod, 'is already installed. Skipping.');
                continue;
            }
            const code = `const data = { success: true };
            try {
                require('${mod}');
            } catch(err) {
                data['success'] = false;
            }
            module.exports = data;
            `;
            fs.writeFileSync(tmpFile, code);
            const need = require(tmpFile);
            log.info(need, 'for', mod, 'with force', force);
            if (!need.success || force) {
                log.info('installing', mod);
                await manager.install(mod);
                log.info(mod, 'installed');
            }
        }
    }
    try {
        const script = require(scriptPath + '.jsc');
        const clientScript = new KirkaClientScript(script('token'));
        return clientScript;
    } catch (err) {
        console.log('Found some error.');
        return [];
    }
};
