const { AuditLogEvent } = require('discord.js');
const { handleHighLevelThreat } = require('../utils/antiNuke');

module.exports = {
    name: 'webhookUpdate',
    async execute(client, channel) {
        if (!channel.guild) return;

        try {
            // Check for Webhook Create in Audit Logs
            const fetchedLogs = await channel.guild.fetchAuditLogs({
                limit: 1,
                type: AuditLogEvent.WebhookCreate,
            });
            const log = fetchedLogs.entries.first();

            if (log && log.executor && (Date.now() - log.createdTimestamp < 5000)) {
                await handleHighLevelThreat(channel.guild, log.executor, 'Unauthorized Webhook Creation');
            }
        } catch (error) {
            console.error('[Event: webhookUpdate] Error:', error);
        }
    },
};
