const Store = require('electron-store');
const config = new Store();

let badgesData;

function initBadges(socket) {
    if (config.get('clientBadges', true)) {
        socket.send({ type: 4 });
        setInterval(() => {
            socket.send({ type: 4 });
        }, 120000);
    }
}

function sendBadges(data) {
    badgesData = data;
}

function getBadge(type, user = null) {
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
    } else {
        return {
            type: type,
            url: badgeURLs[type]
        };
    }
}

function checkBadge(user) {
    return undefined;
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
    if (preferred != 'None')
        searchBadge = badgeValues[preferred];

    if (searchBadge) {
        if (badgesData[searchBadge].includes(user))
            return getBadge(searchBadge, user);
    } else {
        const allPossible = [];
        const allTypes = Object.keys(badgesData);
        for (let i = 0; i < allTypes.length; i++) {
            const badgeType = allTypes[i];
            if (badgesData[badgeType].includes(user))
                allPossible.push(badgeType);
        }
        if (allPossible.length)
            return getBadge(allPossible[0]);
        return undefined;
    }
}

module.exports.checkBadge = checkBadge;
module.exports.sendBadges = sendBadges;
module.exports.initBadges = initBadges;
