/* eslint-disable no-unused-vars */
/* eslint-disable quotes */

const fs = require('fs');

const fileChecker = new RegExp(/require\('bytenode'\); module\.exports = require\('\.\/.*'\);(?!.|\n)/, 'gm');

class KirkaClientScript {

    constructor(initiator) {
        this.scriptName = initiator.scriptName;
        this.scriptUUID = initiator.scriptUUID;
        this.ver = initiator.ver;
        this.desc = initiator.desc;
        this.allowedLoc = initiator.allowedLoc;
        this.allowedPlat = initiator.allowedPlat;
        this.sett = initiator.sett;
        this.launchMain = initiator.launchMain;
        this.launchRenderer = initiator.launchRenderer;

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

module.exports.pluginChecker = (filePath, token) => {
    const fileContent = fs.readFileSync(filePath);
    const check = fileContent.toString().match(fileChecker);

    if (!check)
        return 404;

    return 200;
};

module.exports.pluginLoader = (filePath) => {
    return new KirkaClientScript(require(filePath)('token'));
};
