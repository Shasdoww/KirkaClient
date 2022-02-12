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
        name: 'Enable Resource Swapper',
        id: 'resourceSwapper',
        category: 'Startup',
        type: 'checkbox',
        val: config.get('resourceSwapper', true),
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
        name: 'Custom Sniper Scope',
        id: 'customScope',
        category: 'Game',
        type: 'input',
        val: config.get('customScope', ''),
        placeholder: 'Scope url'
    },
    {
        name: 'Scope Size',
        id: 'scopeSize',
        category: 'Game',
        type: 'slider',
        min: 10,
        max: 1000,
        val: config.get('scopeSize', 400)
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
        name: 'Twitch Integration',
        id: 'twitchInt',
        category: 'Twitch',
        type: 'checkbox',
        needsRestart: true,
        val: config.get('twitchInt', false),
    },
    {
        name: 'Show Twitch chat in Kirka chat',
        id: 'twitchChatSwap',
        category: 'Twitch',
        type: 'checkbox',
        val: config.get('twitchChatSwap', false),
    },
    {
        name: 'Bot Username',
        id: 'botUsername',
        category: 'Twitch',
        type: 'input',
        needsRestart: true,
        placeholder: 'Twitch Bot Username',
        val: config.get('botUsername', '')
    },
    {
        name: 'Bot OAuth',
        id: 'botOAuth',
        category: 'Twitch',
        type: 'input',
        password: true,
        needsRestart: true,
        placeholder: 'Twitch Bot OAuth Token',
        val: config.get('botOAuth', '')
    },
    {
        name: 'Twitch Channel',
        id: 'twitchChannel',
        category: 'Twitch',
        type: 'input',
        needsRestart: true,
        placeholder: 'Your Twitch channel name.',
        val: config.get('twitchChannel', '')
    },
    {
        name: 'Link Command',
        id: 'linkCommand',
        category: 'Twitch',
        type: 'input',
        placeholder: 'Command to get the link of your game',
        val: config.get('linkCommand', '!link')
    },
    {
        name: 'Link Message',
        id: 'linkMessage',
        category: 'Twitch',
        type: 'input',
        placeholder: '{link} = Gamelink. Client will auto-replace that.',
        val: config.get('linkMessage', 'Join here: {link}')
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
