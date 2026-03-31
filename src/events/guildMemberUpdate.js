const { EmbedBuilder } = require('discord.js');
const GuildConfig = require('../database/models/GuildConfig');

module.exports = {
    name: 'guildMemberUpdate',
    async execute(client, oldMember, newMember) {
        try {
            const config = await GuildConfig.findOne({ guildId: newMember.guild.id });
            if (!config || !config.loggingChannelId) return;

            const loggingChannel = newMember.guild.channels.cache.get(config.loggingChannelId);
            if (!loggingChannel) return;

            const embed = new EmbedBuilder()
                .setAuthor({ name: newMember.user.tag, iconURL: newMember.user.displayAvatarURL() })
                .setColor('#3498db')
                .setTimestamp()
                .setFooter({ text: `Member ID: ${newMember.id}` });

            // Nickname Change
            if (oldMember.nickname !== newMember.nickname) {
                embed.setTitle('👤 Nickname Changed')
                    .addFields(
                        { name: 'Old Nickname', value: oldMember.nickname || '*None*', inline: true },
                        { name: 'New Nickname', value: newMember.nickname || '*None*', inline: true }
                    );
                await loggingChannel.send({ embeds: [embed] });
            }

            // Role Changes
            const oldRoles = oldMember.roles.cache;
            const newRoles = newMember.roles.cache;

            if (oldRoles.size !== newRoles.size) {
                const addedRoles = newRoles.filter(role => !oldRoles.has(role.id));
                const removedRoles = oldRoles.filter(role => !newRoles.has(role.id));

                if (addedRoles.size > 0) {
                    embed.setTitle('✅ Roles Added')
                        .setColor('#2ecc71')
                        .setDescription(`Added to ${newMember}: ${addedRoles.map(r => `${r}`).join(', ')}`);
                    await loggingChannel.send({ embeds: [embed] });
                }

                if (removedRoles.size > 0) {
                    embed.setTitle('❌ Roles Removed')
                        .setColor('#e74c3c')
                        .setDescription(`Removed from ${newMember}: ${removedRoles.map(r => `${r}`).join(', ')}`);
                    await loggingChannel.send({ embeds: [embed] });
                }
            }
        } catch (error) {
            console.error('[Event: guildMemberUpdate] Error:', error);
        }
    },
};
