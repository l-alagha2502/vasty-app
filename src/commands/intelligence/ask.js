const { SlashCommandBuilder } = require('discord.js');
const { createChromaEmbed, CHROMA_COLORS } = require('../../utils/chroma');
const { getAIResponse } = require('../../utils/ai');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ask')
        .setDescription('Ask Vast AI (Leo) for advice or help')
        .addStringOption(o => o.setName('query').setDescription('What do you want to ask?').setRequired(true)),
    async execute(interaction) {
        const query = interaction.options.getString('query');
        
        await interaction.deferReply();
        
        try {
            const response = await getAIResponse(query);
            
            const aiEmbed = createChromaEmbed({
                title: 'VAST AI (LEO) RESPONSE',
                description: response,
                color: CHROMA_COLORS.CYAN,
                footer: { text: 'Leo AI • Powered by Vast' }
            });

            await interaction.editReply({ embeds: [aiEmbed] });

        } catch (error) {
            console.error('[Command: ask] Error:', error);
            await interaction.editReply({ content: '❌ Leo is currently offline. Try again later!' });
        }
    }
};
