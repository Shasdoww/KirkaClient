/* eslint-disable no-undef */
/* eslint-disable no-case-declarations */
const allSettings = require('../features/customSettings');
const { ipcRenderer } = require('electron');
const { pluginLoader } = require('../features/plugins');
let installedPlugins;

ipcRenderer.on('make-settings', () => {
    makeSettings();
});

ipcRenderer.on('statusUpdate', (ev, uuid, status) => {
    console.log(uuid, status);
});

function uninstallPlugin(button, uuid) {
    setState(button, '--in-progress', 'Uninstalling...');
    ipcRenderer.invoke('uninstallPlugin', uuid).then(result => {
        console.log(result);
        setState(button, '--done', 'Refresh?');
        button.onclick = () => handlePlugins();
        installedPlugins = JSON.parse(ipcRenderer.sendSync('installedPlugins'));
    });
}

function downloadPlugin(button, uuid) {
    setState(button, '--in-progress', 'Downloading...');
    ipcRenderer.invoke('downloadPlugin', uuid).then(result => {
        console.log(result);
        setState(button, '--done', 'Install Now?');
        button.onclick = () => ipcRenderer.send('reboot');
        installedPlugins = JSON.parse(ipcRenderer.sendSync('installedPlugins'));
    });
}

function setState(button, varName, text) {
    button.innerText = text;
    button.style.backgroundColor = `var(${varName})`;
}

function takeAcion(button, uuid) {
    if (installedPlugins.includes(uuid))
        uninstallPlugin(button, uuid);
    else
        downloadPlugin(button, uuid);
}

function handlePlugins() {
    installedPlugins = JSON.parse(ipcRenderer.sendSync('installedPlugins'));
    console.log(installedPlugins);
    $.ajax({
        url: 'https://kirkaclient.herokuapp.com/api/plugins',
        complete: (res) => {
            const data = res.responseJSON;
            paintCards(data);
        }
    });
}

function paintCards(data) {
    document.getElementsByClassName('frame-content')[0].innerHTML = '';
    document.getElementsByClassName('frame-content')[1].innerHTML = '';
    data.forEach(d => {
        const card = document.createElement('div');
        card.className = 'card';

        const topDiv = document.createElement('div');
        topDiv.classList = 'card-text item-name';
        const fake = document.createElement('span');
        fake.style.marginLeft = '5px';

        const name = document.createElement('label');
        name.classList = 'card-label bold';
        name.innerText = `${d.name} v${d.ver}`;

        const toolTip = document.createElement('div');
        toolTip.classList = 'tooltip help';
        const material = document.createElement('span');
        material.classList = 'material-icons md-48';
        material.style.fontSize = 'large';
        material.innerText = 'help';
        const desc = document.createElement('span');
        desc.classList = 'tooltiptext tooltip-top';
        desc.innerText = d.desc;
        toolTip.appendChild(material);
        toolTip.appendChild(desc);

        topDiv.appendChild(fake);
        topDiv.appendChild(name);
        topDiv.appendChild(toolTip);

        const image = document.createElement('div');
        image.style.backgroundImage = `url('${d.img}')`;
        image.className = 'card-image';

        const bottomDiv = document.createElement('div');
        bottomDiv.classList = 'card-text bottom';
        const dlCount = document.createElement('label');
        dlCount.className = 'util';
        // dlCount.innerText = `${d.dls} Downloads`;
        const dlBtn = document.createElement('button');
        dlBtn.onclick = () => takeAcion(dlBtn, d.uuid);

        bottomDiv.appendChild(dlCount);
        bottomDiv.appendChild(dlBtn);

        card.appendChild(topDiv);
        card.appendChild(image);
        card.appendChild(bottomDiv);
        if (installedPlugins.includes(d.uuid)) {
            dlBtn.classList = 'util uninstall';
            dlBtn.innerText = 'Uninstall';
            document.getElementsByClassName('frame-content')[1].appendChild(card);
        } else {
            dlBtn.classList = 'util download';
            dlBtn.innerText = 'Download';
            document.getElementsByClassName('frame-content')[0].appendChild(card);
        }
    });
}

const loadedScripts = [];

async function loadScripts() {
    const scripts = JSON.parse(await ipcRenderer.invoke('allowedScripts'));
    scripts.forEach(filePath => {
        const script = pluginLoader(filePath);
        loadedScripts.push(script);
    });
}

window.addEventListener('DOMContentLoaded', async() => {
    console.log('DOM Loaded');
    const check = document.getElementsByClassName('plugin-frame');
    if (check.length > 0) {
        handlePlugins();
        return;
    }
    await loadScripts();
    const mainDIV = document.createElement('div');
    mainDIV.id = 'optionsHolder';

    const table = document.getElementsByTagName('table')[0];
    const label = document.createElement('label');
    label.id = 'name';
    label.innerText = 'Search for a setting:';

    const input = document.createElement('input');
    input.type = 'input';
    input.innerText = '';
    input.id = 'searchBar';
    input.placeholder = 'Search Bar';
    input.value = '';
    input.oninput = () => {
        const newTable = document.getElementsByTagName('table')[0];
        newTable.innerHTML = '';
        makeSettings(newTable);
    };
    loadedScripts.forEach(script => {
        allSettings.push(...script.sett);
    });
    mainDIV.appendChild(label);
    mainDIV.appendChild(input);
    table.before(mainDIV);
    makeSettings(table);
});

function makeSettings(table) {
    const doneCategories = [];
    const searchFilter = document.getElementById('searchBar').value;

    for (let i = 0; i < allSettings.length; i++) {
        const option = allSettings[i];
        if (!(option.name.toLowerCase().includes(searchFilter.toLowerCase()) || option.category.toLowerCase().includes(searchFilter.toLowerCase())))
            continue;
        if (doneCategories.includes(option.category))
            continue;
        const mainDiv = document.createElement('div');
        const category = document.createElement('label');

        category.innerHTML = `<b>${option.category}</b>`;
        category.className = 'cat';

        mainDiv.id = option.category;
        mainDiv.className = 'catDIV';

        mainDiv.appendChild(category);
        table.appendChild(mainDiv);
        table.appendChild(document.createElement('br'));
        doneCategories.push(option.category);
    }

    for (let i = 0; i < allSettings.length; i++) {
        const option = allSettings[i];
        if (!(option.name.toLowerCase().includes(searchFilter.toLowerCase()) || option.category.toLowerCase().includes(searchFilter.toLowerCase())))
            continue;
        const mainDIV = document.createElement('div');
        mainDIV.className = 'option';

        const optName = document.createElement('label');
        optName.innerText = option.name;
        optName.id = 'name';
        if (option.needsRestart) {
            const optSpan = document.createElement('span');
            optSpan.style = 'color: #eb5656';
            optSpan.innerText = '*';
            optName.appendChild(optSpan);
        }
        mainDIV.appendChild(optName);

        const label = document.createElement('label');
        const input = document.createElement('input');

        switch (option.type) {
        case 'checkbox':
            label.className = 'toggle';
            const span1 = document.createElement('span');
            span1.className = 'check';
            label.appendChild(span1);

            input.type = 'checkbox';
            input.id = option.id;
            option.val ? input.checked = true : input.checked = false;
            input.onchange = () => checkbox(option);
            label.appendChild(input);

            const span2 = document.createElement('span');
            span2.className = 'slider round';
            label.appendChild(span2);

            mainDIV.appendChild(label);
            break;
        case 'input':
            label.className = 'textbox';
            option.password ? input.type = 'password' : input.type = 'input';
            input.innerText = '';
            input.id = option.id;
            option.placeholder ? input.placeholder = option.placeholder : '';
            input.value = option.val;
            input.oninput = () => inputbox(option);

            mainDIV.appendChild(input);
            break;
        case 'list':
            const optionValues = option.values;

            const select = document.createElement('select');
            select.id = option.id;
            select.onchange = () => inputbox(option);

            for (let j = 0; j < optionValues.length; j++) {
                const opt = document.createElement('option');
                opt.value = optionValues[j];
                opt.innerText = optionValues[j];
                optionValues[j] == option.val ? opt.selected = true : opt.selected = false;
                select.appendChild(opt);
            }
            const optValue = document.createElement('label');
            optValue.className = 'textbox';

            optValue.appendChild(select);
            mainDIV.appendChild(optValue);
            break;
        case 'slider':
            const div = document.createElement('div');
            div.className = 'slidecontainer';

            label.className = 'textbox';
            label.id = `${option.id}-label`;
            label.value = option.val;

            input.type = 'range';
            input.min = option.min;
            input.max = option.max;
            input.value = option.val;
            input.className = 'rangeSlider';
            input.id = option.id;
            input.onchange = () => sliderVal(option);

            div.appendChild(label);
            div.appendChild(input);

            mainDIV.appendChild(div);
            break;
        }
        const category = document.getElementById(option.category);
        category.appendChild(mainDIV);
    }
    const endNote = document.createElement('tr');
    endNote.innerHTML = `<td>
                        <label id="name">\n\n<span style="color: #eb5656">*</span> Requires Restart</label>
                        </td>`;
    table.appendChild(endNote);
}
