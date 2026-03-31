const { EmbedBuilder } = require('discord.js');
const GuildConfig = require('../database/models/GuildConfig');

module.exports = {
    name: 'messageUpdate',
    async execute(client, oldMessage, newMessage) {
        if (!oldMessage.guild || oldMessage.author?.bot) return;
        if (oldMessage.content === newMessage.content) return; // Ignore non-content changes (like embed loading)

        try {
            const config = await GuildConfig.findOne({ guildId: oldMessage.guild.id });
            if (!config || !config.loggingChannelId) return;

            const loggingChannel = oldMessage.guild.channels.cache.get(config.loggingChannelId);
            if (!loggingChannel) return;

            const editEmbed = new EmbedBuilder()
                .setTitle('✏️ Message Edited')
                .setAuthor({ name: oldMessage.author.tag, iconURL: oldMessage.author.displayAvatarURL() })
                .setURL(newMessage.url)
                .setColor('#ffd700')
                .addFields(
                    { name: 'Channel', value: `${oldMessage.channel}`, inline: true },
                    { name: 'Author ID', value: oldMessage.author.id, inline: true },
                    { name: 'Original Content', value: oldMessage.content ? (oldMessage.content.substring(0, 1024)) : '*None*' },
                    { name: 'Updated Content', value: newMessage.content ? (newMessage.content.substring(0, 1024)) : '*None*' }
                )
                .setTimestamp()
                .setFooter({ text: `Message ID: ${oldMessage.id}` });

            // Detect Ghost Ping in Edit (removed mention)
            const oldMentions = oldMessage.mentions.users.size + oldMessage.mentions.roles.size + (oldMessage.mentions.everyone ? 1 : 0);
            const newMentions = newMessage.mentions.users.size + newMessage.mentions.roles.size + (newMessage.mentions.everyone ? 1 : 0);
            if (oldMentions > newMentions) {
                editEmbed.addFields({ name: '🚨 Ghost Ping in Edit', value: 'Mentions were removed from this message during an edit.' });
                editEmbed.setColor('#ff4500');
            }

            await loggingChannel.send({ embeds: [editEmbed] });
        } catch (error) {
            console.error('[Event: messageUpdate] Error:', error);
        }
    },
};
