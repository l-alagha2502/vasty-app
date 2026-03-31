const { EmbedBuilder } = require('discord.js');
const GuildConfig = require('../database/models/GuildConfig');

module.exports = {
    name: 'messageDelete',
    async execute(client, message) {
        if (!message.guild || message.author?.bot) return;

        try {
            const config = await GuildConfig.findOne({ guildId: message.guild.id });
            if (!config || !config.loggingChannelId) return;

            const loggingChannel = message.guild.channels.cache.get(config.loggingChannelId);
            if (!loggingChannel) return;

            const deleteEmbed = new EmbedBuilder()
                .setTitle('🗑️ Message Deleted')
                .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
                .setColor('#ff4500')
                .addFields(
                    { name: 'Channel', value: `${message.channel}`, inline: true },
                    { name: 'Author ID', value: message.author.id, inline: true },
                    { name: 'Content', value: message.content ? (message.content.substring(0, 1024)) : '*None (maybe an embed or attachment)*' }
                )
                .setTimestamp()
                .setFooter({ text: `Message ID: ${message.id}` });

            // Ghost Ping Detection
            if (message.mentions.users.size > 0 || message.mentions.roles.size > 0 || message.mentions.everyone) {
                deleteEmbed.addFields({ name: '🚨 Ghost Ping Detected', value: 'This message contained mentions and was deleted.' });
                deleteEmbed.setColor('#ff0000');
            }

            await loggingChannel.send({ embeds: [deleteEmbed] });
        } catch (error) {
            console.error('[Event: messageDelete] Error:', error);
        }
    },
};
