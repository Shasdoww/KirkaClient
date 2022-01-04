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
let invData;
let byRarity;
let byWeapon;
let default_ = [],
    common = [],
    rare = [],
    epic = [],
    legen = [],
    ar9 = [],
    bayonet = [],
    lar = [],
    m60 = [],
    mac10 = [],
    scar = [],
    shark = [],
    vita = [],
    weatie = [],
    chars = [];

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

        break;
    case 'game':
        addSettingsButton();
        setPromo();
        break;
    }

    if (state != 'game')
        return;

    if (config.get('showFPS', true))
        refreshLoop();

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
    console.log('User set as:', user, 'with ID:', userID);
    config.set('user', user);
    config.set('userID', userID);

    makeInventory();
}

async function makeInventory() {
    invData = await ipcRenderer.invoke('sendInvData', localStorage.getItem('token'));
    const invBtn = document.querySelector('#app > div.interface.text-2 > div.right-interface > div.right-icons > div.card-cont.text-1.inventory-card');
    invBtn.addEventListener('click', createBetterInventory);
    queueTabHandler();
}

async function queueTabHandler() {
    const allTabs = document.getElementsByClassName('tab');
    if (allTabs.length == 0) {
        setTimeout(queueTabHandler, 100);
        return;
    }
    allTabs.forEach(tab => {
        tab.addEventListener('click', () => clearHeadings(true));
        console.log('Added clearHeadings');
    });
}

async function createBetterInventory() {
    const allItems = document.querySelector('#app > div.view > div > div > div.content > div > div.content > div.subjects');
    console.log(allItems);
    if (!allItems) {
        setTimeout(createBetterInventory, 100);
        return;
    }
    const allSkins = allItems.children;
    console.log(allSkins.length);
    if (allSkins.length == 0) {
        setTimeout(createBetterInventory, 100);
        return;
    }

    default_ = [];
    common = [];
    rare = [];
    epic = [];
    legen = [];
    ar9 = [];
    bayonet = [];
    lar = [];
    m60 = [];
    mac10 = [];
    scar = [];
    shark = [];
    vita = [];
    weatie = [];
    chars = [];

    if (!document.getElementById('searchDiv')) {
        console.log('Making Utils');
        const optionsMenu = document.createElement('div');
        optionsMenu.style = 'width: 100%; font-size: 1.2rem; font-weight: 650; margin-top: .2rem; display: flex;';
        optionsMenu.innerText = '\u200b'; // Empty character

        const styles = document.createElement('style');
        styles.innerHTML = `
        .toggle {
            position: absolute;
            display: inline-flex;
        }
        
        .toggle input {
            position: absolute;
            opacity: 0;
            width: 0;
            height: 0;
        }
        
        .textbox {
            background-color: #00f5e9;
            box-shadow: 0 0 12px #00f5e9;
        }
        
        .toggle .check {
            color: #fff;
            font-size: 1em;
            text-align: center;
            display: block;
            font-family: Arial, Helvetica, sans-serif;
        }
        
        .slider {
            position: relative;
            display: block;
            cursor: pointer;
            background-color: #333;
            transition: 0.4s;
            width: 2.4vw;
            height: 2vh;
        }
        
        .slider:before {
            content: "";
            position: absolute;
            height: 10px;
            width: 10px;
            background-color: #fff;
            transition: 0.4s;
            top: 2px;
            left: 4px;
        }
        
        input:checked + .slider {
            background-color: #00f5e9;
            box-shadow: 0 0 12px #00f5e9;
        }
        
        input:checked + .slider:before {
            transform: translateX(11px);
        }
        
        .slider.round {
            border-radius: 20px;
            margin-top: 0.3rem;
        }
        .slider.round::before {
            border-radius: 20px;
        }
        `;

        const searchDiv = document.createElement('label');
        searchDiv.style = 'margin-right: 15px';
        searchDiv.className = 'textbox';

        const searchInput = document.createElement('input');
        searchInput.type = 'input';
        searchInput.innerText = '';
        searchInput.id = 'searchDiv';
        searchInput.placeholder = 'Search for skin';
        searchDiv.oninput = () => {
            const value = document.getElementById('searchDiv').value;
            const allItemsUpdated = document.querySelector('#app > div.view > div > div > div.content > div > div.content > div.subjects').children;
            allItemsUpdated.forEach(item => {
                if (item.className != 'subject')
                    return;
                if (item.getElementsByClassName('item-name')[0].innerText.toLowerCase().includes(value.toLowerCase()))
                    item.style = 'display: flex';
                else
                    item.style = 'display: none';
            });
        };
        searchDiv.appendChild(searchInput);

        const toggleDiv = document.createElement('label');
        toggleDiv.style = 'position: relative';
        toggleDiv.className = 'toggle';
        const label1 = document.createElement('label');
        label1.innerText = 'Sort by Rarity';
        label1.style = 'padding-right: 4px;';
        toggleDiv.appendChild(label1);

        const span1 = document.createElement('span');
        span1.className = 'check';
        toggleDiv.appendChild(span1);

        const toggleInput = document.createElement('input');
        toggleInput.type = 'checkbox';
        toggleInput.id = 'sortMode';
        toggleInput.checked = false;
        toggleInput.onchange = () => {
            if (document.getElementById('sortMode').disabled)
                return;
            sortInventory(allItems);
        };
        toggleDiv.appendChild(toggleInput);

        const span2 = document.createElement('span');
        span2.className = 'slider round';
        toggleDiv.appendChild(span2);

        const label2 = document.createElement('label');
        label2.innerText = 'Sort by Type';
        label2.style = 'padding-left: 4px;';
        toggleDiv.appendChild(label2);

        optionsMenu.appendChild(searchDiv);
        optionsMenu.appendChild(toggleDiv);
        allItems.appendChild(styles);
        allItems.appendChild(optionsMenu);
    }

    const active = document.getElementsByClassName('tab active')[0];
    const state = active.getElementsByClassName('name')[0].innerText;
    let isCharacters = false;
    console.log(state);
    if (state == 'CHESTS') {
        document.getElementById('sortMode').selected = false;
        document.getElementById('sortMode').disabled = true;
    } else
        document.getElementById('sortMode').disabled = false;

    if (state == 'CHARACTERS')
        isCharacters = true;

    for (let i = 0; i < allSkins.length; i++) {
        const child = allSkins[i];
        if (child.className != 'subject')
            continue;
        const name = child.getElementsByClassName('item-name')[0].innerText;
        const rarity = getRarityByName(name);
        switch (rarity) {
        case 'DEFAULT':
            default_.push(child);
            break;
        case 'COMMON':
            common.push(child);
            break;
        case 'RARE':
            rare.push(child);
            break;
        case 'EPIC':
            epic.push(child);
            break;
        case 'LEGENDARY':
            legen.push(child);
            break;
        default:
            console.error('No rarity found for:', name);
            common.push(child);
            break;
        }
        const weapon = getWeaponByName(name);
        switch (weapon) {
        case 'AR-9':
            ar9.push(child);
            break;
        case 'Bayonet':
            bayonet.push(child);
            break;
        case 'LAR':
            lar.push(child);
            break;
        case 'M60':
            m60.push(child);
            break;
        case 'MAC-10':
            mac10.push(child);
            break;
        case 'SCAR':
            scar.push(child);
            break;
        case 'Shark':
            shark.push(child);
            break;
        case 'VITA':
            vita.push(child);
            break;
        case 'Weatie':
            weatie.push(child);
            break;
        case 'Character':
            chars.push(child);
            break;
        default:
            console.error('No type found for:', name);
            ar9.push(child);
            break;
        }
    }

    byRarity = [
        [default_, 'Default'],
        [legen, 'Legendary'],
        [epic, 'Epic'],
        [rare, 'Rare'],
        [common, 'Common']
    ];
    // ['AR-9', 'Bayonet', 'LAR', 'M60', 'MAC-10', 'SCAR', 'Shark', 'VITA', 'Weatie']
    if (isCharacters) {
        byWeapon = [
            [chars, 'Character']
        ];
    } else {
        byWeapon = [
            [ar9, 'AR-9'],
            [bayonet, 'Bayonet'],
            [lar, 'LAR'],
            [m60, 'M60'],
            [mac10, 'MAC-10'],
            [scar, 'SCAR'],
            [shark, 'Shark'],
            [vita, 'VITA'],
            [weatie, 'Weatie']
        ];
    }

    sortInventory(allItems);
}

function sortInventory(allItems) {
    clearHeadings(false);
    const lineBreak = document.createElement('div');
    lineBreak.style = 'width: 100%';
    const toDisplay = document.getElementById('sortMode').checked ? byWeapon : byRarity;
    toDisplay.forEach(parent => {
        const title = document.createElement('div');
        title.style = 'width: 100%; font-size: 1.5rem; font-weight: 450; margin-top: .15rem';
        title.innerText = parent[1];
        title.className = 'skin-heading';
        allItems.appendChild(title);

        parent[0].forEach(element => {
            allItems.appendChild(element);
        });
        allItems.appendChild(lineBreak.cloneNode());
    });
}

function clearHeadings(alsoSort) {
    console.log('Clearing headings');
    const oldHeadings = document.getElementsByClassName('skin-heading');
    const length = oldHeadings.length;
    for (let i = 0; i < length; i++)
        oldHeadings[0].remove();
    console.log('sort:', alsoSort);
    if (alsoSort)
        createBetterInventory();
}

function getRarityByName(name) {
    if (['AR-9', 'Bayonet', 'LAR', 'M60', 'MAC-10', 'SCAR', 'Shark', 'VITA', 'Weatie', 'James', 'Elizabeth'].includes(name))
        return 'DEFAULT';

    for (let i = 0; i < invData.length; i++) {
        const skin = invData[i];
        if (name == skin.item.name)
            return skin.item.rarity;
    }
}

function getWeaponByName(name) {
    for (let i = 0; i < invData.length; i++) {
        const skin = invData[i];
        if (name == skin.item.name) {
            if (skin.item.parent)
                return skin.item.parent.name;
            else {
                if (skin.item.type == 'BODY_SKIN')
                    return 'Character';
                return skin.item.name;
            }
        }
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

const times = [];
let fps = 0;

function refreshLoop() {
    updateFPS(fps);

    window.requestAnimationFrame(() => {
        const now = performance.now();
        while (times.length > 0 && times[0] <= now - 1000)
            times.shift();

        times.push(now);
        fps = times.length;

        refreshLoop();
    });
}

function updateFPS(_fps) {
    leftIcons = document.querySelector('.state-cont');
    if (leftIcons === null) return;
    if (FPSdiv === null) {
        FPSdiv = document.createElement('div');
        leftIcons.appendChild(FPSdiv);
    }
    if (!config.get('showFPS', true))
        FPSdiv.innerText = '';
    else
        FPSdiv.innerText = `FPS: ${_fps}`;
}

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
