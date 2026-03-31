const { SlashCommandBuilder } = require('discord.js');
const { createChromaEmbed, CHROMA_COLORS } = require('../../utils/chroma');
const GuildConfig = require('../../database/models/GuildConfig');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vent')
        .setDescription('Send an anonymous message to the vent channel')
        .addStringOption(o => o.setName('message').setDescription('What\'s on your mind?').setRequired(true)),
    async execute(interaction) {
        const message = interaction.options.getString('message');
        
        try {
            const config = await GuildConfig.findOne({ guildId: interaction.guild.id });
            if (!config || !config.ventChannelId) {
                return interaction.reply({ content: '❌ The vent channel is not configured on this server! Admins must use `/setup`.', ephemeral: true });
            }

            const ventChannel = interaction.guild.channels.cache.get(config.ventChannelId);
            if (!ventChannel) {
                return interaction.reply({ content: '❌ Could not find the configured vent channel!', ephemeral: true });
            }

            const ventEmbed = createChromaEmbed({
                title: 'ANONYMOUS VENT',
                description: message,
                color: CHROMA_COLORS.MAGENTA,
                footer: { text: 'Community Support • You are not alone.' }
            });

            await ventChannel.send({ embeds: [ventEmbed] });
            await interaction.reply({ content: '🤫 Your vent has been sent anonymously.', ephemeral: true });

        } catch (error) {
            console.error('[Command: vent] Error:', error);
            await interaction.reply({ content: '❌ There was an error while sending your vent!', ephemeral: true });
        }
    }
};
