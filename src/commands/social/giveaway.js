const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const { createChromaEmbed, CHROMA_COLORS } = require('../../utils/chroma');

const activeGiveaways = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('Create a new giveaway')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addStringOption(o => o.setName('prize').setDescription('What are you giving away?').setRequired(true))
        .addIntegerOption(o => o.setName('duration').setDescription('Duration in minutes').setRequired(true))
        .addIntegerOption(o => o.setName('winners').setDescription('Number of winners').setRequired(false).setMinValue(1)),
    async execute(interaction) {
        const prize = interaction.options.getString('prize');
        const duration = interaction.options.getInteger('duration');
        const winnersCount = interaction.options.getInteger('winners') || 1;
        const endTime = Date.now() + (duration * 60 * 1000);

        const giveawayEmbed = createChromaEmbed({
            title: '✨ VAST GIVEAWAY',
            description: `**PRIZE:** ${prize}\n**WINNERS:** ${winnersCount}\n**ENDS:** <t:${Math.floor(endTime / 1000)}:R>`,
            color: CHROMA_COLORS.CYAN
        });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`giveaway_join_${interaction.id}`)
                .setLabel('JOIN GIVEAWAY')
                .setStyle(ButtonStyle.Success)
        );

        const msg = await interaction.reply({ embeds: [giveawayEmbed], components: [row], fetchReply: true });

        client.giveawayParticipants = client.giveawayParticipants || new Map();
        const participants = new Set();
        client.giveawayParticipants.set(interaction.id, participants);

        // Timer to end giveaway
        setTimeout(async () => {
            const winners = [];
            const users = Array.from(client.giveawayParticipants.get(interaction.id) || []);
            
            if (users.length > 0) {
                for (let i = 0; i < Math.min(winnersCount, users.length); i++) {
                    const winnerIdx = Math.floor(Math.random() * users.length);
                    winners.push(users.splice(winnerIdx, 1)[0]);
                }
            }

            const winnerText = winners.length > 0 ? winners.map(id => `<@${id}>`).join(', ') : 'No one joined!';
            
            const endEmbed = createChromaEmbed({
                title: '✨ GIVEAWAY ENDED',
                description: `**PRIZE:** ${prize}\n**WINNERS:** ${winnerText}`,
                color: CHROMA_COLORS.MAGENTA
            });

            await msg.edit({ embeds: [endEmbed], components: [] });
            if (winners.length > 0) {
                await interaction.channel.send(`🎉 Congratulations ${winnerText}! You won **${prize}**!`);
                // Try to DM winners
                for (const winnerId of winners) {
                    const winnerUser = await interaction.client.users.fetch(winnerId);
                    await winnerUser.send(`🎉 You won **${prize}** in the giveaway on **${interaction.guild.name}**!`).catch(() => {});
                }
            }

            client.giveawayParticipants.delete(interaction.id);
        }, duration * 60 * 1000);
    }
};
