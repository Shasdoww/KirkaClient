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
let matchCache = {};
let oldState;
let homeBadgeLoop;
let inGameBadgeLoop;
let regionLoop;

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
        createHomePageSettings();

        if (config.get('removeDiscordBtn', false)) {
            const elem = document.querySelector('#app > div.interface.text-2 > div.right-interface > div.settings-and-socicons > div.card-cont.soc-group');
            if (elem)
                elem.remove();
        }
        addButton();
        regionLoop = setInterval(setRegion, 500);
        homeBadge();
        break;
    case 'game':
        addSettingsButton();
        setPromo();
        inGameBadge();
        break;
    }

    if (state != 'game')
        return;

    if (config.get('showHP', true))
        observeHp();

    updateChatState();
}

ipcRenderer.on('msg', (e, msg, isError) => {
    createBalloon(msg, isError);
});

function createHomePageSettings() {
    const downloadBtn = document.querySelector('#right-interface > div.settings-and-socicons > div:nth-child(2)');
    const settingsBtn = downloadBtn.cloneNode(true);
    settingsBtn.childNodes[0].childNodes[1].innerText = 'SETTINGS';
    settingsBtn.onclick = () => {
        ipcRenderer.send('show-settings');
    };
    settingsBtn.childNodes[1].outerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="48px" viewBox="0 0 24 24" width="48px" fill="#FFFFFF"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M23 2H1v16h9v2H8v2h8v-2h-2v-2h9V2zm-2 14H3V4h18v12z"/></svg>';
    downloadBtn.parentNode.replaceChild(settingsBtn, downloadBtn);
}

async function addButton() {
    const addbtn = document.createElement('button');
    addbtn.innerText = 'Join using URL';
    addbtn.className = 'button play-btn animation';
    addbtn.style.display = 'flex';
    addbtn.style.alignSelf = 'center';
    addbtn.style.fontSize = '1.4rem';
    addbtn.style.border = 'none';
    addbtn.style.borderRadius = '5px';
    addbtn.style.padding = '5px';
    addbtn.style.cursor = 'pointer';
    addbtn.style.transition = 'background-color .3s';
    addbtn.style.transition = 'color .3s';
    addbtn.style.transitionTimingFunction = 'linear';
    addbtn.onclick = () => {
        ipcRenderer.send('joinLink');
    };
    addbtn.onmouseover = () => {
        addbtn.style.backgroundColor = 'white';
        addbtn.style.color = 'black';
    };
    addbtn.onmouseleave = () => {
        addbtn.style.backgroundColor = '#ffb914';
        addbtn.style.color = 'black';
    };
    addbtn.onmouseleave();
    const play = document.getElementsByClassName('play')[0];
    play.insertBefore(addbtn, play.firstChild);
}

function setRegion() {
    const region = document.querySelector('#app > div.interface.text-2 > div.play > div > div.select-region');
    if (!region || region.innerText.length == 0) {
        setTimeout(setRegion, 100);
        return;
    }
    const re = new RegExp(' ', 'g');
    const finalRegion = region.innerText.replace(re, '');
    localStorage.setItem('region', finalRegion);
}

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

    if (nicknameDiv === null || userIDdiv === null) {
        setTimeout(setUsername, 100);
        return;
    }
    if (nicknameDiv.innerText == 'Newbie') {
        config.delete('userID');
        config.delete('user');
        console.log('Guest Account');
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
    if (config.get('useBetterInv', true))
        betterInventory.launch();
}

function resetVars() {
    FPSdiv = null;
    settings = null;
    matchCache = {};
    if (homeBadgeLoop)
        clearInterval(homeBadgeLoop);
    if (inGameBadgeLoop)
        clearInterval(inGameBadgeLoop);
    if (regionLoop)
        clearInterval(regionLoop);
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

async function homeBadge() {
    homeBadgeLoop = setInterval(() => {
        const allpossible = document.getElementsByClassName('nickname');
        const id = config.get('userID', null);
        if (!id)
            return;

        for (let key = 0; key < allpossible.length; key++) {
            const nickname = allpossible[key];
            if (nickname.innerText.replace(new RegExp(' ', 'g'), '') != config.get('user'))
                continue;
            const children = nickname.children;
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                if (child.tagName != 'IMG')
                    continue;
                if (String(child.src).includes('discord'))
                    child.remove();
            }
            const badge = checkbadge('home', id);
            if (badge == undefined)
                continue;

            nickname.insertAdjacentHTML('beforeend', `<img data-v-e6e1daf8 clientbadge src="${badge.url}" height=20 title=${badge.role}>`);
        }
    }, 1000);
}

async function inGameBadge() {
    inGameBadgeLoop = setInterval(() => {
        const allPossible = [];
        allPossible.push(...document.getElementsByClassName('nickname'));
        allPossible.push(...document.getElementsByClassName('player-name'));
        generateCache();

        for (let i = 0; i < allPossible.length; i++) {
            const element = allPossible[i];
            const re = new RegExp(' ', 'g');
            const userid = matchCache[element.innerText.replace(re, '')];
            const children = element.children;
            for (let j = 0; j < children.length; j++) {
                const child = children[j];
                if (child.tagName != 'IMG')
                    continue;
                if (String(child.src).includes('discord'))
                    child.remove();
            }
            const badge = checkbadge('game', userid);
            if (badge == undefined)
                continue;
            element.style.display = 'flex';
            element.insertAdjacentHTML('beforeend', `<img data-v-e6e1daf8 clientbadge src="${badge.url}" height=20 title=${badge.role} style="margin-left: 2px;">`);
        }
    }, 1000);
}

function generateCache() {
    const ele = document.getElementsByClassName('player-left');
    if (ele.length == 0) {
        setTimeout(generateCache, 100);
        return;
    }

    for (let k = 0; k < ele.length; k++) {
        const children = ele[k].children;
        if (children.length != 3)
            continue;
        const re = new RegExp(' ', 'g');
        const re2 = new RegExp('\\n', 'g');
        const re3 = new RegExp('#', 'g');
        const userid = children[2].innerText.replace(re2, '').replace(re3, '');
        if (userid.length != 6)
            continue;
        matchCache[children[1].innerText.replace(re, '')] = userid;
    }
}

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
    const gameUrl = document.location.href;
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

function getBadge(type, confirmID) {
    const data = badgesData['data'][type];
    for (let j = 0; j < data.length; j++) {
        const badgeData = data[j];
        if (type != 'custom')
            badgeData['url'] = badgesData.url[type];
        if (badgeData.id === confirmID)
            return badgeData;
    }
}

function checkbadge(state, confID = 'ABX') {
    if (!badgesData)
        return;

    const confirmID = (state === 'home') ? config.get('userID') : confID;
    const preferred = badgesData['pref'][confirmID];
    let searchBadge = null;
    if (preferred && confirmID == config.get('userID'))
        searchBadge = preferred;

    const allPossible = [];
    const allTypes = Object.keys(badgesData['data']);
    for (let i = 0; i < allTypes.length; i++) {
        const badgeType = allTypes[i];
        if (searchBadge && badgeType != searchBadge)
            continue;
        const data = badgesData.data[badgeType];
        for (let j = 0; j < data.length; j++) {
            const badgeData = data[j];
            if (badgeData.id === confirmID)
                allPossible.push(badgeType);
        }
    }
    if (allPossible.length > 0) {
        if (allPossible.includes('custom'))
            return getBadge('custom', confirmID);
        return getBadge(allPossible[0], confirmID);
    }
}
