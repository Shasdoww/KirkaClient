/* eslint-disable prefer-const */
/* eslint-disable no-unused-vars */
const { ipcRenderer, remote } = require('electron');
const Store = require('electron-store');
const config = new Store();
const fixwebm = require('../recorder/fix');
const os = require('os');
const path = require('path');
const fs = require('fs');
const getBlobDuration = require('get-blob-duration');
const autoJoin = require('../features/autoJoin');
const betterInventory = require('../features/betterInventory');
console.log('bi:', betterInventory);
let leftIcons;
let FPSdiv = null;
let mediaRecorder = null;
let filepath = '';
let starttime;
let pausetime;
let pause;
let totalPause = 0;
let recordedChunks = [];
let recording = false;
let paused = false;
let badgesData;
let settings;
let isChatFocus = false;
let logDir;
ipcRenderer.on('logDir', (e, val) => {
    logDir = val;
});

let oldState;
window.addEventListener('DOMContentLoaded', (event) => {
    setInterval(() => {
        const newState = currentState();
        if (oldState != newState) {
            oldState = newState;
            doOnLoad();
        }
    }, 1000);
});

function doOnLoad() {
    resetVars();
    const html = `
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">
    <link rel="stylesheet" href="${config.get('css')}">
    <style>

    #show-clientNotif{
        position: absolute;
        transform: translate(-50%,-50%);
        top: 50%;
        left: 50%;
        background-color: #101020;
        color: #ffffff;
        padding: 20px;
        border-radius: 5px;
        cursor: pointer;
    }
    #clientNotif{
        width: 380px;
        height: 80px;
        padding-left: 20px;
        background-color: #ffffff;
        box-shadow: 0 10px 20px rgba(75, 50, 50, 0.05);
        border-left: 8px solid #47d764;
        border-radius: 7px;
        display: grid;
        grid-template-columns: 1.2fr 6fr 0.5fr;
        transform: translate(-400px);
        transition: 1s;
    }
    .container-1,.container-2{
        align-self: center;
    }
    .container-1 i{
        font-size: 40px;
        color: #47d764;
    }
    .container-2 {
        text-shadow: 0px 0px #000000;
        font-size: 18px;
        border: none;
        text-align: left;
        padding: 0;
        margin: 0;
        box-sizing: border-box;
    }
    .container-2 p:first-child{
        color: #101020;
    }
    .container-2 p:last-child{
        color: #656565;
    }
    #clientNotif button{
        align-self: flex-start;
        background-color: transparent;
        font-size: 25px;
        line-height: 0;
        color: #656565;
        cursor: pointer;
    }
    </style>
    <div class="wrapper" style="width: 420px;
    padding: 30px 20px;
    position: absolute;
    bottom: 50px;
    left: 0;
    overflow: hidden;">
    <div id="clientNotif">
        <div class="container-1">
        </div>
        <div class="container-2">
        </div>
    </div>
    </div>`;
    const state = currentState();
    if (state === 'unknown')
        return;
    console.log('DOM Content loaded for:', state);
    let promo;
    const div = document.createElement('div');
    div.className = 'clientNotifDIV';
    div.innerHTML = html;

    function setPromo() {
        promo = document.getElementsByClassName('info')[0];
        if (promo === undefined) {
            setTimeout(setPromo, 1000);
            return;
        }
        promo.appendChild(div);
    }

    switch (state) {
    case 'home':
        settings = document.getElementById('clientSettings');
        setUsername();
        promo = document.getElementsByClassName('left-interface')[0];
        promo.appendChild(div);
        // eslint-disable-next-line no-case-declarations
        const canvas = document.getElementById('left-icons');
        if (canvas) {
            canvas.insertAdjacentHTML('beforeend', '<div data-v-6be9607e="" id="clientSettings" class="icon-btn text-1" style="--i:3;" data-v-45658db6=""><div data-v-45658db6="" class="wrapper"><img data-v-b8de1e14="" data-v-4f66c13e="" src="https://media.discordapp.net/attachments/912303941449039932/913787350738407434/client_icon.png" width="90%" height="auto"><div data-v-4f66c13e="" class="text-icon">CLIENT</div></div></div>');
            settings = document.getElementById('clientSettings');
            settings.onclick = () => {
                ipcRenderer.send('show-settings');
            };
        }

        if (config.get('removeDiscordBtn', false)) {
            const elem = document.querySelector('#app > div.interface.text-2 > div.right-interface > div.settings-and-socicons > div.card-cont.soc-group');
            if (elem)
                elem.remove();
        }
        break;
    case 'game':
        addSettingsButton();
        setPromo();
        break;
    }

    if (state != 'game')
        return;

    if (config.get('showHP', true))
        observeHp();

    updateChatState();

    const url = config.get('customScope');
    if (url) {
        setInterval(function() {
            const x = document.getElementsByClassName('sniper-mwNMW')[0];
            if (x) {
                if (x.src != url) {
                    x.src = url;
                    x.width = config.get('scopeSize', 200);
                    x.height = config.get('scopeSize', 200);
                    x.removeAttribute('class');
                }
            }
        }, 1000);
    }
}

ipcRenderer.on('msg', (e, msg, isError) => {
    createBalloon(msg, isError);
});

function addSettingsButton() {
    const canvas = document.querySelector('#app > div.game-interface > div.esc-interface > div.right-container > div.head > div.head-right');
    if (canvas) {
        if (document.getElementById('clientSettingsGame'))
            return;
        canvas.insertAdjacentHTML('afterbegin', '<button data-v-02c36fca="" id = "clientSettingsGame" data-v-b427fee8="" class="button right-btn rectangle" style="background-color: var(--secondary-5); --hover-color:#5C688F; --top:#5C688F; --bottom:#252E4B; width: 5vw;; padding: 0px; margin: 0px;"><div data-v-02c36fca="" class="triangle"></div><div data-v-02c36fca="" class="text"><img data-v-b8de1e14="" data-v-b427fee8="" src="https://media.discordapp.net/attachments/912303941449039932/913787350738407434/client_icon.png" width="100%" height="auto"></div><div data-v-02c36fca="" class="borders"><div data-v-02c36fca="" class="border-top border"></div><div data-v-02c36fca="" class="border-bottom border"></div></div></button>');
        settings = document.querySelector('#app > div.game-interface > div.esc-interface > div.right-container > div.head > div.head-right > button:nth-child(1)');
        settings.addEventListener('click', () => {
            ipcRenderer.send('show-settings');
        });
    } else
        setTimeout(addSettingsButton, 500);
}

async function setUsername() {
    const nicknameDiv = document.querySelector('#app > div.interface.text-2 > div.team-section > div.player > div > div.head-right > div.nickname');
    const userIDdiv = document.querySelector('#auth-user > div > div.card-cont.avatar-info > div.username');

    if (nicknameDiv === null || nicknameDiv.innerText == 'Newbie' || userIDdiv === null) {
        setTimeout(setUsername, 100);
        return;
    }

    const re = new RegExp(' ', 'g');
    const re2 = new RegExp('\\n', 'g');
    const re3 = new RegExp('#', 'g');
    const user = nicknameDiv.innerText.replace(re, '');
    const userID = userIDdiv.innerText.replace(re2, '').replace(re3, '');
    console.log('Setting user as', user, userID);
    config.set('user', user);
    config.set('userID', userID);
    console.log('User set as:', user, 'with ID:', userID);
    if (config.get('useBetterInv', true)) {
        console.log('launching bI', betterInventory);
        betterInventory.launch();
        console.log('bi launched');
    }
}

function resetVars() {
    FPSdiv = null;
    settings = null;
}

function observeHp() {
    const hpNode = document.querySelector('#app > div.game-interface > div.desktop-game-interface > div.state > div.hp > div.cont-hp > div');
    if (!hpNode) {
        setTimeout(observeHp, 100);
        return;
    }
    hpObserver.observe(hpNode, {
        attributes: true,
        attributeFilter: ['style']
    });
    document.querySelector('#app > div.game-interface > div.desktop-game-interface > div.state > div.hp > div.hp-title.text-1').innerText = '100';
}

function updateChatState() {
    const chatState = config.get('chatType', 'Show');
    switch (chatState) {
    case 'Hide':
        setChatState(false);
        break;
    case 'Show':
        setChatState(true);
        break;
    case 'While Focused':
        setChatState(false, true);
        break;
    }
}

function setChatState(state, isFocusActive = false) {
    const chat = document.getElementsByClassName('chat chat-position')[0];
    isChatFocus = isFocusActive;
    if (chat === undefined) {
        setTimeout(() => { setChatState(state, isFocusActive); }, 1000);
        return;
    }
    if (state)
        chat.style = 'display: flex;';
    else
        chat.style = 'display: none;';
}

function showNotification() {
    let x = document.getElementById('clientNotif');
    clearTimeout(x);
    const toast = document.getElementById('clientNotif');
    toast.style.transform = 'translateX(0)';
    x = setTimeout(() => {
        toast.style.transform = 'translateX(-400px)';
    }, 3000);
}

function createBalloon(text, error = false) {
    let border = '';
    let style = '';

    if (error) {
        border = '<i class="fas fa-times-circle" style="color: #ff355b;"></i>';
        style = 'border-left: 8px solid #ff355b;';
    } else {
        border = '<i class="fas fa-check-square"></i>';
        style = 'border-left: 8px solid #47D764;';
    }

    const d1 = document.getElementsByClassName('container-1')[0];
    d1.innerHTML = border;
    const toast = document.getElementById('clientNotif');
    toast.style = style;
    const d2 = document.getElementsByClassName('container-2')[0];
    d2.innerHTML = `<p>${text}</p>`;
    showNotification();
}

function toggleChat() {
    const chat = document.getElementsByClassName('chat chat-position')[0];
    const input = document.getElementById('WMNn');
    if (document.activeElement == input) {
        setTimeout(toggleChat, 100);
        return;
    }
    if (chat.style.display == 'flex') {
        chat.blur();
        chat.style = 'display: none;';
    } else {
        chat.style = 'display: flex;';
        chat.focus();
        input.focus();
    }
}

window.addEventListener('keydown', function(event) {
    const autoJoinKey = config.get('AJ_keybind', 'F7');
    switch (event.key) {
    case 'F1':
        startRecording();
        break;
    case 'F2':
        stopRecording(true);
        break;
    case 'F3':
        stopRecording(false);
        break;
    case autoJoinKey:
        createBalloon('Searching for Games...');
        autoJoin.launch().then(res => {
            if (!res.success || res.found == 0) {
                createBalloon('No Match Found!', true);
                return;
            }

            const url = `https://kirka.io/games/${res.code}`;
            setTimeout(() => {
                console.log('Loading', url);
                window.location.replace(url);
            }, 0);
        });
        break;
    case 'Escape':
        addSettingsButton();
        break;
    case 'Enter':
        if (isChatFocus)
            toggleChat();
        break;
    }
});

ipcRenderer.on('updateChat', () => {
    updateChatState();
});

if (config.get('preventM4andM5', true)) {
    window.addEventListener('mouseup', (e) => {
        if (e.button === 3 || e.button === 4)
            e.preventDefault();
    });
}

window.addEventListener('load', () => {
    setInterval(() => {
        const allpossible = [];
        const all_nickname = document.getElementsByClassName('nickname');
        const all_tabs = document.getElementsByClassName('player-name text-2');
        allpossible.push(...all_nickname, ...all_tabs);

        for (const key in allpossible) {
            const nickname = allpossible[key];
            if (nickname.innerHTML.toString().includes('clientbadge')) {
                const children = nickname.children;
                for (let i = 0; i < children.length; i++) {
                    const child = children[i];
                    if (String(child.src).includes('discord'))
                        child.remove();
                }
            }
            let user = nickname.innerText.toString();
            const re = new RegExp(' ', 'g');
            user = user.replace(re, '');

            const badge = checkbadge(user);
            if (badge == undefined)
                continue;

            nickname.insertAdjacentHTML('beforeend', `<img data-v-e6e1daf8 clientbadge src="${badge.url}" height=20 title=${badge.role}>`);
        }
    }, 750);
});

const hpObserver = new MutationObserver((data, observer) => {
    data.forEach(ele => {
        const width = parseInt(ele.target.style.width.replace('%', ''));
        document.querySelector('#app > div.game-interface > div.desktop-game-interface > div.state > div.hp > div.hp-title.text-1').innerText = width;
    });
});

async function configMR() {
    const clientWindow = remote.getCurrentWindow().getMediaSourceId();
    const constraints = {
        audio: {
            mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: clientWindow,
            }
        },
        video: {
            mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: clientWindow,
                minWidth: 1280,
                maxWidth: 1920,
                minHeight: 720,
                maxHeight: 1080,
                minFrameRate: 60
            }
        }
    };
    const options = {
        videoBitsPerSecond: 3000000,
        mimeType: 'video/webm; codecs=vp9'
    };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    mediaRecorder = new MediaRecorder(stream, options);
    console.log('mR', mediaRecorder);
    mediaRecorder.ondataavailable = (e) => { recordedChunks.push(e.data); };
    mediaRecorder.onstop = handleStop;
    mediaRecorder.onstart = () => {
        console.log('started recording');
        recording = true;
    };
    mediaRecorder.onpause = () => { paused = true; };
    mediaRecorder.onresume = () => { paused = false; };
    return mediaRecorder;
}

async function handleStop() {
    recording = false;
    if (starttime === undefined)
        return;
    const blob = new Blob(recordedChunks, {
        type: 'video/mp4;'
    });
    console.log('handeling stop. starttime:', starttime, 'Date.now():', Date.now(), 'pause:', totalPause, 'duration', Date.now() - starttime - totalPause);
    fixwebm(blob, Date.now() - starttime - totalPause, saveRecording);
}

async function startRecording() {
    if (mediaRecorder === null) {
        console.log('First Time: Configuring mR');
        try {
            const mR = await configMR();
            console.log('Configurated!', mR);
            mediaRecorder = mR;
            startrec();
        } catch (err) {
            console.error(err);
        }
    } else if (recording) {
        if (paused)
            resumeRecording();
        else
            pauseRecording();
    } else
        startrec();
}

function pauseRecording() {
    console.log('mR is paused!');
    pausetime = Date.now() - starttime - totalPause;
    try {
        mediaRecorder.pause();
        createBalloon('Recording Paused!');
    } catch (e) {
        console.error(e);
    }
    pause = Date.now();
}

function resumeRecording() {
    console.log('mR is resumed!');
    try {
        mediaRecorder.resume();
        createBalloon('Recording Resumed!');
    } catch (e) {
        console.error(e);
    }
    totalPause += Date.now() - pause;
}

let shouldSave = false;

function stopRecording(save) {
    if (!recording) {
        createBalloon('No recording in progress!', true);
        return;
    }
    if (mediaRecorder === undefined || mediaRecorder === null)
        return;

    if (save) {
        const folderPath = path.join(logDir, 'videos');
        console.log(folderPath);
        if (!fs.existsSync(folderPath))
            fs.mkdirSync(folderPath);
        filepath = path.join(folderPath, `kirkaclient-${new Date(Date.now()).toDateString()}.mp4`);
    }
    shouldSave = save;
    try {
        if (paused)
            mediaRecorder.resume();
        mediaRecorder.stop();
    } catch (e) {
        console.error(e);
    }
}

async function startrec() {
    console.log('mR state:', mediaRecorder.state);
    recordedChunks = [];
    try {
        mediaRecorder.start(500);
    } catch (e) {
        console.error(e);
    }
    createBalloon('Recording started!');
    starttime = Date.now();
    pause = 0;
    totalPause = 0;
    console.log('New mR state:', mediaRecorder.state);
}

function saveRecording(blob) {
    console.log('In saveRecording');
    getBlobDuration.default(blob).then(function(duration) {
        console.log(duration + ' seconds');
        if (isNaN(parseFloat(duration))) {
            console.error('Broken duration detected, attempting fix...');
            fixwebm(blob, 300000, saveRecording);
        } else {
            blob.arrayBuffer().then(buf => {
                const buffer = Buffer.from(buf);
                console.log('Filepath:', filepath);
                if (filepath !== '') fs.writeFileSync(filepath, buffer);
                if (shouldSave) createBalloon('Recording Saved!');
                else createBalloon('Recording Cancelled', true);
                console.log('Saved!');
            });
        }
    }).catch(err => {
        console.log(err);
    });
}

ipcRenderer.on('twitch-msg', (event, userName, userColor, msg) => {
    genChatMsg(msg, userName, userColor);
});

function genChatMsg(text, sender = '[KirkaClient]', style = null) {
    const chatHolder = document.getElementsByClassName('messages messages-cont')[0];
    if (chatHolder === undefined)
        return;

    const chatItem = document.createElement('div');
    const chatUser = document.createElement('span');
    const chatMsg = document.createElement('span');

    chatItem.className = 'message';
    chatMsg.className = 'chatMsg_client';
    chatMsg.innerText = text;
    chatUser.className = 'name';
    chatUser.innerText = `${sender}: `;
    if (style)
        chatUser.style.color = style;

    chatItem.appendChild(chatUser);
    chatItem.appendChild(chatMsg);
    chatHolder.appendChild(chatItem);
    chatHolder.scrollTop = chatHolder.scrollHeight;
    return chatMsg;
}

function currentState() {
    const gameUrl = window.location.href;
    if (!gameUrl.includes('kirka.io'))
        return 'unknown';
    if (gameUrl.includes('games'))
        return 'game';
    else
        return 'home';
}

ipcRenderer.on('badges', (event, data) => {
    badgesData = data;
});

function getBadge(type, user = null, role = null) {
    const badgeURLs = {
        'dev': 'https://media.discordapp.net/attachments/863805591008706607/874611064606699560/contributor.png',
        'staff': 'https://media.discordapp.net/attachments/863805591008706607/874611070478745600/staff.png',
        'patreon': 'https://media.discordapp.net/attachments/856723935357173780/874673648143855646/patreon.PNG',
        'gfx': 'https://media.discordapp.net/attachments/863805591008706607/874611068570333234/gfx.PNG',
        'con': 'https://media.discordapp.net/attachments/863805591008706607/874611066909380618/dev.png',
        'kdev': 'https://media.discordapp.net/attachments/874979720683470859/888703118118907924/kirkadev.PNG',
        'vip': 'https://media.discordapp.net/attachments/874979720683470859/888703150628941834/vip.PNG',
        'nitro': 'https://media.discordapp.net/attachments/874979720683470859/921387669743861821/nitro.png'
    };
    if (type == 'custom') {
        const customBadges = badgesData.custom;
        for (let i = 0; i < customBadges.length; i++) {
            const badgeData = customBadges[i];
            if (badgeData.name === user) {
                return {
                    type: badgeData.type,
                    url: badgeData.url,
                    name: user,
                    role: badgeData.role
                };
            }
        }
    } else if (badgesData[type].includes(user)) {
        return {
            type: type,
            url: badgeURLs[type],
            name: user,
            role: role
        };
    }
}

function checkbadge(user) {
    if (badgesData === undefined)
        return undefined;

    const preferred = config.get('prefBadge', 'None');
    const badgeValues = {
        'Developer': 'dev',
        'Contributor': 'con',
        'Staff': 'staff',
        'Patreon': 'patreon',
        'GFX Artist': 'gfx',
        'V.I.P': 'vip',
        'Kirka Dev': 'kdev',
        'Server Booster': 'nitro',
        'Custom Badge': 'custom'
    };

    let searchBadge = null;
    if (preferred != 'None' && user == config.get('user'))
        searchBadge = badgeValues[preferred];

    if (searchBadge)
        return getBadge(searchBadge, user, preferred);
    else {
        const allPossible = [];
        const allTypes = Object.keys(badgesData);
        for (let i = 0; i < allTypes.length; i++) {
            const badgeType = allTypes[i];

            if (badgesData[badgeType].includes(user))
                allPossible.push(badgeType);
            else if (badgeType == 'custom') {
                const customBadges = badgesData.custom;
                for (let j = 0; j < customBadges.length; j++) {
                    const badgeData = customBadges[j];
                    if (badgeData.name === user)
                        allPossible.push('custom');
                }
            }
        }

        if (allPossible.length) {
            if (allPossible.includes('custom'))
                return getBadge('custom', user);
            // eslint-disable-next-line no-undef
            return getBadge(allPossible[0], user, _.invert(badgeValues)[allPossible[0]]);
        }
        return undefined;
    }
}
