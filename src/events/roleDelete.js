const { AuditLogEvent } = require('discord.js');
const { trackAction } = require('../utils/antiNuke');

module.exports = {
    name: 'roleDelete',
    async execute(client, role) {
        if (!role.guild) return;

        try {
            const fetchedLogs = await role.guild.fetchAuditLogs({
                limit: 1,
                type: AuditLogEvent.RoleDelete,
            });
            const deletionLog = fetchedLogs.entries.first();

            if (!deletionLog) return;

            const { executor, target } = deletionLog;
            if (target.id === role.id) {
                await trackAction(role.guild, executor, 'ROLE_DELETE', role.name);
            }
        } catch (error) {
            console.error('[Event: roleDelete] Error:', error);
        }
    },
};
