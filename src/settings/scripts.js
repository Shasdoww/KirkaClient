/* eslint-disable no-unused-vars */
const Store = require('electron-store');
const config = new Store();
const { ipcRenderer, remote } = require('electron');
let globalOption;

function checkbox(option) {
    const customID = option.id;
    const val = document.getElementById(customID).checked;
    config.set(customID, val);
    if (option.run) {
        globalOption = option;
        const id = ipcRenderer.send('getContents');
    }
}

ipcRenderer.on('contentsID', (event, id) => {
    console.log('got contents:', id);
    console.log(globalOption);
    const window = remote.BrowserWindow.fromId(id);
    console.log(window)
    globalOption.run(window.webContents);
});

function inputbox(option) {
    const customID = option.id;
    const val = document.getElementById(customID).value;
    config.set(customID, val);
    if (option.run) {
        const id = ipcRenderer.sendSync('getContents');
        const window = remote.BrowserWindow.fromId(id);
        option.run(window.webContents);
    }
}

function sliderVal(option) {
    const customID = option.id;
    const slider = document.getElementById(customID);
    document.getElementById(`${customID}-label`).innerText = slider.value;
    config.set(customID, slider.value);
    if (option.run) {
        const id = ipcRenderer.sendSync('getContents');
        const window = remote.BrowserWindow.fromId(id);
        option.run(window.webContents);
    }
}
