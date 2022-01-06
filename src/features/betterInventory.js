const Store = require('electron-store');
const config = new Store();
const scriptName = 'Better Inventory';
const { ipcRenderer } = require('electron');

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

const noSkinsHide = 'width: 100%; font-size: 1.5rem; font-weight: 450; margin-top: .15rem; display: none;';
const noSkinsShow = 'width: 100%; font-size: 1.5rem; font-weight: 450; margin-top: .15rem; display: block;';

async function makeInventory() {
    invData = await ipcRenderer.invoke('sendInvData', localStorage.getItem('token'));
    const invBtn = document.querySelector('#app > div.interface.text-2 > div.right-interface > div.right-icons > div.card-cont.text-1.inventory-card');
    invBtn.addEventListener('click', () => {
        queueTabHandler();
        createBetterInventory();
    });
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

    if (!document.getElementById('menuUtilities')) {
        console.log('Making Utils');
        const optionsMenu = document.createElement('div');
        optionsMenu.style = 'width: 100%; font-size: 1.2rem; font-weight: 650; margin-top: .2rem; display: flex;';
        optionsMenu.innerText = '\u200b'; // Empty character
        optionsMenu.id = 'menuUtilities';

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
                width: 35px;
                height: 20px;
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
            }`;

        const searchDiv = document.createElement('label');
        searchDiv.style = 'margin-right: 15px';
        searchDiv.className = 'textbox';

        const searchInput = document.createElement('input');
        searchInput.type = 'input';
        searchInput.innerText = '';
        searchInput.id = 'searchDiv';
        searchInput.placeholder = 'Search for skin';
        searchDiv.oninput = organizeHeadings;
        searchDiv.appendChild(searchInput);

        const toggleDiv = document.createElement('label');
        toggleDiv.style = 'position: relative';
        toggleDiv.className = 'toggle';
        const label1 = document.createElement('label');
        label1.innerText = 'Sort by Rarity';
        label1.style = 'padding-right: 4px;';
        toggleDiv.appendChild(label1);

        const noItems = document.createElement('div');
        noItems.style = noSkinsHide;
        noItems.innerText = 'No skins found..';
        noItems.id = 'noSkinsFound';

        const span1 = document.createElement('span');
        span1.className = 'check';
        toggleDiv.appendChild(span1);

        const toggleInput = document.createElement('input');
        toggleInput.type = 'checkbox';
        toggleInput.id = 'sortMode';
        toggleInput.checked = false;
        toggleInput.onchange = () => {
            if (document.getElementsByClassName('tab active')[0].getElementsByClassName('name')[0].innerText === 'CHESTS')
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
        allItems.appendChild(noItems);
    }

    const active = document.getElementsByClassName('tab active')[0];
    const state = active.getElementsByClassName('name')[0].innerText;
    let isCharacters = false;
    console.log(state);
    if (state == 'CHESTS')
        return;

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
        [legen, 'Legendary'],
        [epic, 'Epic'],
        [rare, 'Rare'],
        [common, 'Common'],
        [default_, 'Default'],
    ];

    if (isCharacters) {
        byWeapon = [
            [chars, '']
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
    lineBreak.className = 'newLine';
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
    organizeHeadings();
}

function organizeHeadings() {
    console.log('organizeHeadings fired!');
    let itemsFound = false;
    const value = document.getElementById('searchDiv').value.toLowerCase();
    const allItemsUpdated = document.querySelector('#app > div.view > div > div > div.content > div > div.content > div.subjects').children;
    allItemsUpdated.forEach(item => {
        if (item.className != 'subject')
            return;
        if (item.getElementsByClassName('item-name')[0].innerText.toLowerCase().includes(value)) {
            item.style = 'display: flex;';
            itemsFound = true;
        } else
            item.style = 'display: none;';
    });
    if (itemsFound)
        document.getElementById('noSkinsFound').style = noSkinsHide;
    else
        document.getElementById('noSkinsFound').style = noSkinsShow;

    const headings = document.getElementsByClassName('skin-heading');
    headings.forEach(heading => {
        console.log('H:', heading);
        if (!itemsFound) { /* Pseudo Caching */
            heading.style.display = 'none';
            return;
        }
        let sibling = heading.nextSibling;
        // eslint-disable-next-line no-constant-condition
        while (true) {
            if (!sibling) {
                heading.style.display = 'none';
                break;
            }
            if (sibling.style.display != 'none' && sibling.className != 'newLine') {
                if (sibling.className != 'subject')
                    heading.style.display = 'none';
                else
                    heading.style.display = 'block';
                break;
            }
            sibling = sibling.nextSibling;
        }
    });
}

function clearHeadings(alsoSort) {
    const oldHeadings = document.getElementsByClassName('skin-heading');
    const length = oldHeadings.length;
    for (let i = 0; i < length; i++)
        oldHeadings[0].remove();
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
        if (name != skin.item.name)
            continue;
        if (skin.item.parent)
            return skin.item.parent.name;
        else {
            if (skin.item.type == 'BODY_SKIN')
                return 'Character';
            return skin.item.name;
        }
    }
}

module.exports = {
    name: scriptName,
    settings: [
        {
            name: 'Use BetterInventory by KirkaClient',
            id: 'useBetterInv',
            category: scriptName,
            type: 'checkbox',
            val: config.get('useBetterInv', true),
        },
    ],
    launch: makeInventory
};
