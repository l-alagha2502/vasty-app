const { AuditLogEvent } = require('discord.js');
const { trackAction } = require('../utils/antiNuke');

module.exports = {
    name: 'guildMemberRemove',
    async execute(client, member) {
        if (!member.guild) return;

        try {
            // Check for Kick or Ban in Audit Logs
            const fetchedLogs = await member.guild.fetchAuditLogs({
                limit: 1,
            });
            const lastLog = fetchedLogs.entries.first();

            if (!lastLog) return;

            const { executor, target, action } = lastLog;

            // Check if it was a Kick or Ban within the last 5 seconds
            if (target.id === member.id && (Date.now() - lastLog.createdTimestamp < 5000)) {
                if (action === AuditLogEvent.MemberKick) {
                    await trackAction(member.guild, executor, 'MEMBER_KICK', member.user.tag);
                } else if (action === AuditLogEvent.MemberBanAdd) {
                    await trackAction(member.guild, executor, 'MEMBER_BAN', member.user.tag);
                }
            }
        } catch (error) {
            console.error('[Event: guildMemberRemove (Anti-Nuke)] Error:', error);
        }
    },
};
