const GuildConfig = require('../database/models/GuildConfig');
const { updateGuildStatsDisplay } = require('../utils/stats');

module.exports = {
    name: 'guildMemberRemove',
    async execute(client, member) {
        try {
            const config = await GuildConfig.findOne({ guildId: member.guild.id });
            if (config) {
                await updateGuildStatsDisplay(member.guild, config);
            }
        } catch (error) {
            console.error('[Event: guildMemberRemove] Error:', error);
        }
    }
};
