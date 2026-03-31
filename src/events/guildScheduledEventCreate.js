const GuildConfig = require('../database/models/GuildConfig');
const { createChromaEmbed, CHROMA_COLORS } = require('../utils/chroma');

module.exports = {
    name: 'guildScheduledEventCreate',
    async execute(client, guildScheduledEvent) {
        try {
            const config = await GuildConfig.findOne({ guildId: guildScheduledEvent.guildId });
            if (!config?.eventPostChannelId) return;

            const guild = client.guilds.cache.get(guildScheduledEvent.guildId);
            const channel = guild?.channels.cache.get(config.eventPostChannelId);
            if (!channel?.isTextBased()) return;

            const eventUrl = guildScheduledEvent.url || `https://discord.com/events/${guildScheduledEvent.guildId}/${guildScheduledEvent.id}`;
            const embed = createChromaEmbed({
                title: 'New Discord Event',
                description: `**${guildScheduledEvent.name}** is live.\nJoin from: ${eventUrl}`,
                color: CHROMA_COLORS.CYAN
            });

            await channel.send({ embeds: [embed] });
        } catch (error) {
            console.error('[Event: guildScheduledEventCreate] Error:', error);
        }
    }
};
