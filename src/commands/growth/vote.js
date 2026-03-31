const { SlashCommandBuilder } = require('discord.js');
const { createChromaEmbed, CHROMA_COLORS } = require('../../utils/chroma');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vote')
        .setDescription('Vote for Vasty on Top.gg to earn Sparks!'),
    async execute(interaction) {
        const voteEmbed = createChromaEmbed({
            title: 'SUPPORT THE VAST NETWORK',
            description: `Help us grow and earn **50 Sparks**! Every vote keeps us alive.\n\n[CLICK HERE TO VOTE ON TOP.GG](https://top.gg/bot/${interaction.client.user.id}/vote)`,
            color: CHROMA_COLORS.MAGENTA
        });

        await interaction.reply({ embeds: [voteEmbed] });
    }
};
