const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { createChromaEmbed, CHROMA_COLORS } = require('../../utils/chroma');
const User = require('../../database/models/User');

const questions = [
    { q: 'What is the capital of France?', a: ['Paris', 'Berlin', 'London', 'Madrid'], c: 0 },
    { q: 'What is 2 + 2?', a: ['3', '4', '5', '6'], c: 1 },
    { q: 'Which planet is known as the Red Planet?', a: ['Venus', 'Mars', 'Jupiter', 'Saturn'], c: 1 },
    { q: 'What is the largest ocean on Earth?', a: ['Atlantic', 'Indian', 'Arctic', 'Pacific'], c: 3 }
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('trivia')
        .setDescription('Test your knowledge and earn Sparks!'),
    async execute(interaction) {
        const question = questions[Math.floor(Math.random() * questions.length)];
        
        const triviaEmbed = createChromaEmbed({
            title: 'VAST TRIVIA',
            description: `**QUESTION:** ${question.q}`,
            color: CHROMA_COLORS.CYAN
        });

        const buttons = new ActionRowBuilder().addComponents(
            question.a.map((ans, idx) => 
                new ButtonBuilder()
                    .setCustomId(`trivia_${idx === question.c ? 'correct' : 'wrong'}_${interaction.user.id}`)
                    .setLabel(ans)
                    .setStyle(ButtonStyle.Primary)
            )
        );

        await interaction.reply({ embeds: [triviaEmbed], components: [buttons] });
    }
};
