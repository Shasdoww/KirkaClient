const { ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', async() => {
    const html = await ipcRenderer.invoke('get-html');
    const element = document.getElementById('changeLogs');
    element.innerHTML = html;
});
