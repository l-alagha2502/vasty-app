const GuildConfig = require('../database/models/GuildConfig');
const { updateGuildStatsDisplay } = require('../utils/stats');

module.exports = {
    name: 'guildMemberAdd',
    async execute(client, member) {
        try {
            const config = await GuildConfig.findOneAndUpdate(
                { guildId: member.guild.id },
                {},
                { new: true, upsert: true }
            );

            const roleId = member.user.bot ? config.botRoleId : config.memberRoleId;
            if (roleId) {
                await member.roles.add(roleId).catch(error => {
                    console.error('[GuildMemberAdd] Auto-role failed:', error);
                });
            }

            if (config.welcomeChannelId) {
                const channel = member.guild.channels.cache.get(config.welcomeChannelId);
                if (channel?.isTextBased()) {
                    const message = (config.welcomeMessage || 'Welcome {user} to {server}.')
                        .replace(/\{user\}/g, `${member}`)
                        .replace(/\{server\}/g, member.guild.name);
                    await channel.send({ content: message }).catch(() => null);
                }
            }

            await updateGuildStatsDisplay(member.guild, config);
        } catch (error) {
            console.error('[Event: guildMemberAdd] Error:', error);
        }
    }
};
