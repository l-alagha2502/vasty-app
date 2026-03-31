const { AuditLogEvent } = require('discord.js');
const { handleHighLevelThreat } = require('../utils/antiNuke');

module.exports = {
    name: 'guildUpdate',
    async execute(client, oldGuild, newGuild) {
        try {
            // Check for Owner Change (Server Transfer)
            if (oldGuild.ownerId !== newGuild.ownerId) {
                const fetchedLogs = await newGuild.fetchAuditLogs({
                    limit: 1,
                    type: AuditLogEvent.GuildUpdate,
                });
                const log = fetchedLogs.entries.first();

                if (log && log.executor) {
                    await handleHighLevelThreat(newGuild, log.executor, 'Unauthorized Server Ownership Transfer');
                }
            }
        } catch (error) {
            console.error('[Event: guildUpdate] Error:', error);
        }
    },
};
