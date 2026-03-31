module.exports = {
    // Bot settings
    botName: 'Vasty Bot',
    defaultPrefix: '!',

    // Module Toggles - Easily enable/disable entire systems
    modules: {
        economy: true,
        moderation: true,
        security: true, // Anti-nuke
        leveling: true,
        tickets: true,
        fun: true,
        music: false, // Disabled by default to save resources
        logging: true,
        growth: true,
        productivity: true,
        social: true,
        intelligence: true
    },

    // Developer / Owner IDs
    owners: ['YOUR_DISCORD_USER_ID'],

    // Embed configurations
    colors: {
        success: '#00ff00',
        error: '#ff0000',
        warning: '#ffff00',
        primary: '#5865F2'
    }
};
