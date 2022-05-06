const { version } = require('./const');
const { dialog, app } = require('electron');
const Store = require('electron-store');
const config = new Store();
const fs = require('fs');
const path = require('path');
const https = require('https');
const log = require('electron-log');
const { exec } = require('child_process');

async function autoUpdate(contents, updateData) {
    contents.send('tip');
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    wait(2500).then(() => {
        try {
            contents.send('tip');
        } catch (err) {
            // pass
        }
    });
    contents.send('message', 'Checking for updates...');
    contents.send('version', `v${version}`);

    const latest = updateData.version;
    if (latest != version) {
        if (config.get('updateType', 'Auto download') == 'Ask for download') {
            if (!updateData.force) {
                const options = {
                    buttons: ['Yes', 'No'],
                    message: 'Update Found! Download and install now?'
                };
                const response = await dialog.showMessageBox(options);
                if (response.response === 1)
                    return false;
            } else {
                const options = {
                    buttons: ['Ok'],
                    message: 'Update Found! This update is marked as compulsary by the developer, thus will be installed anyways.'
                };
                await dialog.showMessageBox(options);
            }
        }

        await downloadUpdate(contents, updateData);
        return true;
    } else {
        contents.send('message', 'No update. Starting Client...');
        return false;
    }
}

function ensureFile() {
    if (!fs.existsSync(path.join(__dirname, '../../../app.asar.unpacked')))
        fs.mkdirSync(path.join(__dirname, '../../../app.asar.unpacked'));

    fs.writeFileSync(path.join(__dirname, '../../../app.asar.unpacked/update.bat'), `set "params=%*"
    cd /d "%~dp0" && ( if exist "%temp%\\getadmin.vbs" del "%temp%\\getadmin.vbs" ) && fsutil dirty query %systemdrive% 1>nul 2>nul || (  echo Set UAC = CreateObject^("Shell.Application"^) : UAC.ShellExecute "cmd.exe", "/k cd ""%~sdp0"" && %~s0 %params%", "", "runas", 1 >> "%temp%\\getadmin.vbs" && "%temp%\\getadmin.vbs" && exit /B )
    
    ROBOCOPY "%AppData%/KirkaClient/app.asar" "app.asar" /mov
    exit`);
}

async function downloadUpdate(contents, updateData) {
    const updateUrl = updateData.url;
    const updateSize = updateData.size;
    const downloadDestination = path.join('./resources/app.asar');
    // const downloadDestination = path.join('./app.asar');

    return new Promise((resolve) => {
        const myreq = https.get(updateUrl, (res) => {
            res.setEncoding('binary');

            let a = '';
            res.on('data', function(chunk) {
                a += chunk;
                const percentage = Math.round(100 * a.length / updateSize);
                contents.send('message', `Downloading- ${percentage}% complete...`);
            });

            res.on('end', async function() {
                process.noAsar = true;
                try {
                    fs.writeFile(downloadDestination, a, 'binary', (err) => {
                        if (err)
                            throw err;
                        resolve();
                    });
                } catch (e) {
                    fs.writeFile(app.getPath('userData') + '/app.asar', a, 'binary', (err) => {
                        if (err)
                            throw err;
                        ensureFile();
                        const updatePath = path.join(__dirname, '../../../app.asar.unpacked/update.bat');
                        log.info(`"${updatePath}"`);
                        const ls = exec(`"${updatePath}"`);

                        ls.stdout.on('data', function(data) {
                            log.info('stdout: ' + data);
                        });

                        ls.stderr.on('data', function(data) {
                            log.error('stderr: ' + data);
                        });

                        ls.on('exit', function(code) {
                            log.info('child process exited with code ' + code);
                            resolve();
                        });
                    });
                }
            });
        });
        myreq.end();
    });
}

module.exports.autoUpdate = autoUpdate;
