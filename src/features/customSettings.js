/* eslint-disable no-undef */
const Store = require('electron-store');
const config = new Store();

module.exports = [
    {
        name: 'Mute Startup Video',
        id: 'muteVideo',
        category: 'Startup',
        type: 'checkbox',
        val: config.get('muteVideo', false),
    },
    {
        name: 'Start as Fullscreen',
        id: 'fullScreenStart',
        category: 'Startup',
        type: 'checkbox',
        val: config.get('fullScreenStart', true),
    },
    {
        name: 'Unlimited FPS',
        id: 'unlimitedFPS',
        category: 'Performance',
        type: 'checkbox',
        needsRestart: true,
        val: config.get('unlimitedFPS', false),
    },
    {
        name: 'Discord Rich Presence',
        id: 'discordRPC',
        category: 'Performance',
        type: 'checkbox',
        val: config.get('discordRPC', true),
        run: (function() {
            ipcRenderer.send('toggleRPC');
        })
    },
    {
        name: 'Comma Format Numbers',
        id: 'commaFormat',
        category: 'Game',
        type: 'checkbox',
        val: config.get('commaFormat', true),
    },
    {
        name: 'Client Badges',
        id: 'clientBadges',
        category: 'Badges',
        type: 'checkbox',
        needsRestart: true,
        val: config.get('clientBadges', true),
    },
    {
        name: 'Preferred Badge',
        id: 'prefBadge',
        category: 'Badges',
        type: 'list',
        values: ['None', 'Developer', 'Contributor', 'Staff', 'Patreon', 'GFX Artist', 'V.I.P', 'Kirka Dev', 'Server Booster', 'Custom Badge'],
        val: config.get('prefBadge', 'None'),
        run: (async function() {
            const badgeValues = {
                'Developer': 'dev',
                'Contributor': 'con',
                'Staff': 'staff',
                'Patreon': 'patreon',
                'GFX Artist': 'gfx',
                'V.I.P': 'vip',
                'Kirka Dev': 'kdev',
                'Server Booster': 'nitro',
                'Custom Badge': 'custom',
                'None': null
            };
            const data = {
                userid: config.get('userID'),
                badge: badgeValues[config.get('prefBadge', 'None')]
            };
            ipcRenderer.send('updatePreferred', data);
        })
    },
    {
        name: 'Show HP',
        id: 'showHP',
        category: 'Game',
        type: 'checkbox',
        val: config.get('showHP', true),
    },
    {
        name: 'Remove Discord button from HomePage',
        id: 'removeDiscordBtn',
        category: 'Game',
        type: 'checkbox',
        val: config.get('removeDiscordBtn', false),
    },
    {
        name: 'Prevent Ctrl+W from closing client',
        id: 'controlW',
        category: 'Game',
        type: 'checkbox',
        val: config.get('controlW', true),
    },
    {
        name: 'Prevent M4 and M5 default actions',
        id: 'preventM4andM5',
        category: 'Game',
        type: 'checkbox',
        needsRestart: true,
        val: config.get('preventM4andM5', true),
    },
    {
        name: 'In-game Chat Mode',
        id: 'chatType',
        category: 'Game',
        type: 'list',
        values: ['Show', 'Hide', 'While Focused'],
        val: config.get('chatType', 'Show'),
        run: (function run(contents) {
            contents.send('updateChat');
        })
    },
    {
        name: 'Custom CSS',
        id: 'css',
        category: 'Game',
        type: 'input',
        needsRestart: true,
        val: config.get('css', ''),
        placeholder: 'CSS URL (http/https only)'
    },
    {
        name: 'Updates Behaviour',
        id: 'updateType',
        category: 'Updates',
        type: 'list',
        values: ['Ask for download', 'Auto download'],
        val: config.get('updateType', 'Auto download')
    },
    {
        name: 'Receive Beta Updates',
        id: 'betaTester',
        category: 'Updates',
        type: 'checkbox',
        needsRestart: true,
        val: config.get('betaTester', false)
    }
];
