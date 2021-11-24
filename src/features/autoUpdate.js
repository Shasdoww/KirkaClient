const https = require('follow-redirects').https;
const { version } = require('./const');
const fs = require('fs');
const path = require('path');

async function autoUpdate(contents, updateData) {
    contents.send('tip');
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    wait(5000).then(() => {
        contents.send('tip');
    });
    contents.send('message', 'Checking for updates...');
    contents.send('version', `KirkaClient v${version}`);

    const latest = updateData.version;
    if (latest != version) {
        await downloadUpdate(contents, updateData);
        return true;
    } else {
        contents.send('message', 'No update. Starting Client...');
        return false;
    }
}

async function downloadUpdate(contents, updateData) {
    const updateUrl = updateData.url;
    const updateSize = updateData.size;
    const dest = path.join('./resources/app.asar');
    // const dest = './app.asar';
    let myreq;

    async function downloadFile() {
        return new Promise((resolve) => {
            myreq = https.get(updateUrl, (res) => {
                res.setEncoding('binary');

                let a = '';
                res.on('data', function(chunk) {
                    a += chunk;
                    const percentage = Math.round(100 * a.length / updateSize);
                    contents.send('message', `Downloading- ${percentage}% complete...`);
                });

                res.on('end', function() {
                    process.noAsar = true;

                    fs.writeFile(dest, a, 'binary', function(err) {
                        if (err) console.log(err);
                    });

                    resolve();
                });
            });
        });
    }

    await downloadFile();
    myreq.end();
}

module.exports.autoUpdate = autoUpdate;
