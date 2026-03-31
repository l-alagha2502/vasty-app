const { ChannelType } = require('discord.js');

function sanitizeChannelName(label, value) {
    return `${label}: ${value}`.slice(0, 100);
}

async function renameStatChannel(channel, label, value) {
    if (!channel || channel.type !== ChannelType.GuildVoice) return;

    const nextName = sanitizeChannelName(label, value);
    if (channel.name === nextName) return;

    await channel.setName(nextName, 'Vasty Bot live stats update');
}

async function updateGuildStatsDisplay(guild, config) {
    if (!guild || !config) return;

    const memberChannel = config.statsMemberChannelId
        ? guild.channels.cache.get(config.statsMemberChannelId)
        : null;
    const messageChannel = config.statsMessageChannelId
        ? guild.channels.cache.get(config.statsMessageChannelId)
        : null;

    await Promise.allSettled([
        renameStatChannel(memberChannel, 'Members', guild.memberCount),
        renameStatChannel(messageChannel, 'Messages', config.totalMessages || 0)
    ]);
}

module.exports = { updateGuildStatsDisplay };
