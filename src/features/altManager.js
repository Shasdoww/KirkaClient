const Store = require('electron-store');
const config = new Store();
const scriptName = 'Alt Manager';
const { ipcRenderer } = require('electron');

async function addListner() {
    const btn = document.getElementsByClassName('card-cont avatar-info')[0];
    console.log(btn);
    btn.addEventListener('click', addButton);
}

async function addButton() {
    const div = document.getElementsByClassName('bottom')[0];
    console.log(div);
    if (!div) {
        setTimeout(addButton, 100);
        return;
    }
    const html = `
    <div data-v-02c36fca="" class="triangle"></div>
    <div data-v-02c36fca="" class="text">Switch Account</div>
    <div data-v-02c36fca="" class="borders">
        <div data-v-02c36fca="" class="border-top border"></div>
        <div data-v-02c36fca="" class="border-bottom border"></div>
    </div>
    `;
    const switchAccBtn = document.createElement('button');
    switchAccBtn.setAttribute('data-v-02c36fca', '');
    switchAccBtn.setAttribute('data-v-51621522', '');
    switchAccBtn.className = 'button button rectangle';
    switchAccBtn.style = 'background-color: var(--secondary-1); --hover-color:var(--secondary-2); --top:var(--secondary-2); --bottom:var(--secondary-6); margin-right: 5px;';
    switchAccBtn.innerHTML = html;
    div.insertBefore(switchAccBtn, div.firstChild);
    div.onclick = showAlts;
}

async function showAlts() {
    document.getElementsByClassName('text-2 name-page')[0].innerText = ' Alt Manager ';
    document.getElementsByClassName('profile-cont')[0].style.display = 'none';
    const mainDiv = document.createElement('div');
    const alts = config.get('alts', []);
    const userAlts = document.createElement('div');
    userAlts.className = 'userAlts';
    addAlts(userAlts, alts);
    const bottomBtns = document.createElement('div');
    bottomBtns.className = 'bottom';
    bottomBtns.style = 'display: flex; flex-direction: row; align-items: center;';
    bottomBtns.appendChild(getBtn('Add Account'));
    bottomBtns.appendChild(getBtn('Remove Account'));
    mainDiv.appendChild(userAlts);
    mainDiv.appendChild(bottomBtns);
    console.log(userAlts);
    const content = document.querySelector('#app > div.view > div > div > div.content');
    content.insertBefore(mainDiv, content.firstChild);
}

function addAlts(ele, alts) {
    for (let i = 0; i < alts.length; i++) {
        const alt = alts[i];
        ele.appendChild(getBtn(alt));
    }
}

function getBtn(label) {
    const html = `
    <div data-v-02c36fca="" class="triangle"></div>
    <div data-v-02c36fca="" class="text">${label}</div>
    <div data-v-02c36fca="" class="borders">
        <div data-v-02c36fca="" class="border-top border"></div>
        <div data-v-02c36fca="" class="border-bottom border"></div>
    </div>
    `;
    const btn = document.createElement('button');
    btn.setAttribute('data-v-02c36fca', '');
    btn.setAttribute('data-v-51621522', '');
    btn.className = 'button button rectangle';
    btn.style = 'background-color: var(--secondary-1); --hover-color:var(--secondary-2); --top:var(--secondary-2); --bottom:var(--secondary-6); margin: 5px;';
    btn.innerHTML = html;
    return btn;
}

module.exports = {
    name: scriptName,
    settings: [
    ],
    launch: addListner
};
