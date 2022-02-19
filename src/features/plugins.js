/* eslint-disable no-unused-vars */
/* eslint-disable quotes */

const fs = require('fs');
const https = require('http');
const fileChecker = new RegExp(/require\('bytenode'\); module\.exports = require\('\.\/.*'\);(?!.|\n)/, 'gm');
const log = require('electron-log');
const { v4: uuidv4 } = require('uuid');

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

    installUpdate() {
        console.log('Updates');
    }

    reverse(string) {
        return string.split('').reverse().join('');
    }

    getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min) + min);
    }

    ensureIntegrity() {
        return new Promise((resolve, reject) => {
            const _base = parseInt(Date.now() / 10000);
            const uuid = uuidv4();
            const _base2 = _base * 17;
            const data = {
                uuid: this.scriptUUID,
                tokenv1: this.reverse(_base.toString()),
                tokenv2: this.reverse(_base2.toString()),
                a: uuid.split('-')[0],
                aa: uuid.split('-')[3],
                secret: this.getRandomInt(2 ** 8, 2 ** 10)
            };
            const request = {
                method: 'POST',
                port: 5000,
                hostname: '127.0.0.1',
                path: '/api/plugins/updates',
                headers: {
                    'Content-Type': 'application/json'
                },
            };

            const req = https.request(request, res => {
                res.setEncoding('utf-8');
                let chunks = '';
                log.info(`POST: ${res.statusCode} with payload ${JSON.stringify(data)}`);
                if (res.statusCode != 201)
                    reject()
                else {
                    res.on('data', (chunk) => {
                        chunks += chunk; 
                    });
                    res.on('end', () => {
                        const data = JSON.parse(chunks);
                        if (!data.tokenv3)
                            reject()
                        
                        if (tokenv3 !== reverse(String(((tokenv1 + 145067) - tokenv2) * 9)))
                            reject()

                        resolve(data);
                    })
                }
            });
            req.on('error', error => {
                log.error(`POST Error: ${error}`);
            });

            req.write(JSON.stringify(data));
            req.end();
        });
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
