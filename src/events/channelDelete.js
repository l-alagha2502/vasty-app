const { AuditLogEvent } = require('discord.js');
const { trackAction } = require('../utils/antiNuke');

module.exports = {
    name: 'channelDelete',
    async execute(client, channel) {
        if (!channel.guild) return;

        try {
            // Fetch audit logs to find the executor
            const fetchedLogs = await channel.guild.fetchAuditLogs({
                limit: 1,
                type: AuditLogEvent.ChannelDelete,
            });
            const deletionLog = fetchedLogs.entries.first();

            if (!deletionLog) return;

            const { executor, target } = deletionLog;
            if (target.id === channel.id) {
                await trackAction(channel.guild, executor, 'CHANNEL_DELETE', channel.name);
            }
        } catch (error) {
            console.error('[Event: channelDelete] Error:', error);
        }
    },
};
