const { SlashCommandBuilder } = require('discord.js');
const { createChromaEmbed, CHROMA_COLORS } = require('../../utils/chroma');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('study')
        .setDescription('Start a 25-minute focus session (Pomodoro)'),
    async execute(interaction) {
        const studyEmbed = createChromaEmbed({
            title: 'FOCUS SESSION STARTED',
            description: `🕒 **TIME:** 25 Minutes\n\nStay focused, no distractions. The bot will alert you when it's time for a break!`,
            color: CHROMA_COLORS.CYAN
        });

        await interaction.reply({ embeds: [studyEmbed] });

        // Timer
        setTimeout(async () => {
            const breakEmbed = createChromaEmbed({
                title: 'FOCUS SESSION ENDED',
                description: `☕ **TIME FOR A BREAK!**\n\nYou studied for 25 minutes. Take a 5-minute break and recharge.`,
                color: CHROMA_COLORS.YELLOW
            });

            try {
                // Try to ping in channel
                await interaction.followUp({ content: `${interaction.user} Your study session is over!`, embeds: [breakEmbed] });
                // Also try to DM
                await interaction.user.send({ embeds: [breakEmbed] }).catch(() => {});
            } catch (error) {
                console.error('[Command: study] Failed to send break alert:', error);
            }
        }, 25 * 60 * 1000); // 25 minutes
    }
};
