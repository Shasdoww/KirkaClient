const Store = require('electron-store');
const config = new Store();
const scriptName = 'Alt Manager';
const { ipcRenderer } = require('electron');

async function addButton() {
    const btn = document.getElementById('logout');
    console.log(btn);
}

async function showAlts() {
    const userAlts = config.get('alts', []);
    console.log(userAlts);
}

module.exports = {
    name: scriptName,
    settings: [
    ],
    launch: addButton
};
