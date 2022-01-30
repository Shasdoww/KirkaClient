/* eslint-disable no-undef */
/* eslint-disable no-case-declarations */
const allSettings = require('../features/customSettings');
const autoJoin = require('../features/autoJoin');
const betterInventory = require('../features/betterInventory');
const { ipcRenderer } = require('electron');

ipcRenderer.on('make-settings', () => {
    makeSettings();
});

window.addEventListener('DOMContentLoaded', () => {
    const check = document.getElementsByClassName('about-wrapper');
    if (check.length > 0)
        return;

    const mainDIV = document.createElement('div');
    mainDIV.id = 'optionsHolder';
    mainDIV.style.marginTop = '65px';

    const table = document.getElementsByTagName('table')[0];
    const label = document.createElement('label');
    label.id = 'name';
    label.innerText = 'Search for a setting:';
    label.style.marginRight = '3px';

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
    allSettings.push(...autoJoin.settings);
    allSettings.push(...betterInventory.settings);
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
        const tableRow = document.createElement('tr');
        const mainDIV = document.createElement('div');

        const tdName = document.createElement('td');
        tdName.style.width = '65vw';
        const optName = document.createElement('label');
        optName.innerText = option.name;
        optName.id = 'name';
        if (option.needsRestart) {
            const optSpan = document.createElement('span');
            optSpan.style = 'color: #eb5656';
            optSpan.innerText = '*';
            optName.appendChild(optSpan);
        }
        tdName.appendChild(optName);
        const tdSpace = document.createElement('td');
        tdSpace.innerText = '\u200b';

        const tdValue = document.createElement('td');
        const label = document.createElement('label');
        const input = document.createElement('input');

        mainDIV.appendChild(tdName);
        mainDIV.appendChild(tdSpace);
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

            tdValue.appendChild(label);
            mainDIV.appendChild(tdValue);
            break;
        case 'input':
            label.className = 'textbox';
            option.password ? input.type = 'password' : input.type = 'input';
            input.innerText = '';
            input.id = option.id;
            option.placeholder ? input.placeholder = option.placeholder : '';
            input.value = option.val;
            input.oninput = () => inputbox(option);

            tdValue.appendChild(input);
            mainDIV.appendChild(tdValue);
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
            tdValue.appendChild(optValue);

            mainDIV.appendChild(tdValue);
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

            tdValue.appendChild(div);
            mainDIV.appendChild(tdValue);
            break;
        }
        const category = document.getElementById(option.category);
        category.appendChild(tableRow);
        tableRow.appendChild(mainDIV);
    }
    const endNote = document.createElement('tr');
    endNote.innerHTML = `<td>
                        <label id="name">\n\n<span style="color: #eb5656">*</span> Requires Restart</label>
                        </td>`;
    table.appendChild(endNote);
}
