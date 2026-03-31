const { SlashCommandBuilder } = require('discord.js');
const { createChromaEmbed, CHROMA_COLORS } = require('../../utils/chroma');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('quote')
        .setDescription('Turn a message into a Chroma-styled quote')
        .addStringOption(o => o.setName('message_id').setDescription('ID of the message to quote').setRequired(true)),
    async execute(interaction) {
        const messageId = interaction.options.getString('message_id');
        
        try {
            const message = await interaction.channel.messages.fetch(messageId);
            
            const quoteEmbed = createChromaEmbed({
                title: 'CHROMA QUOTE',
                description: `"${message.content}"`,
                color: CHROMA_COLORS.WHITE,
                footer: { text: `Quoted from ${message.author.tag}`, iconURL: message.author.displayAvatarURL() }
            });

            await interaction.reply({ embeds: [quoteEmbed] });

        } catch (error) {
            await interaction.reply({ content: '❌ Could not find that message in this channel!', ephemeral: true });
        }
    }
};
