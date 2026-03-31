const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const User = require('../../database/models/User');
const { createChromaEmbed, CHROMA_COLORS } = require('../../utils/chroma');

function buildModalOne() {
    return new ModalBuilder()
        .setCustomId('vast_card_modal_1')
        .setTitle('VAST CARD CUSTOMIZER 1/3')
        .addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('vc_background_asset').setLabel('Background').setStyle(TextInputStyle.Short).setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('vc_background_style').setLabel('Background Style').setStyle(TextInputStyle.Short).setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('vc_effects').setLabel('Effects').setStyle(TextInputStyle.Short).setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('vc_opacity').setLabel('Opacity').setStyle(TextInputStyle.Short).setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('vc_blur').setLabel('Blur').setStyle(TextInputStyle.Short).setRequired(true)
            )
        );
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vastcard')
        .setDescription('View or customize your Vast Card')
        .addSubcommand(subcommand =>
            subcommand.setName('view').setDescription('View your Vast profile card'))
        .addSubcommand(subcommand =>
            subcommand.setName('customize').setDescription('Launch the 14-field Vast Card customizer')),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const user = await User.findOne({ userId: interaction.user.id });

        if (!user) {
            return interaction.reply({ content: '❌ Profile not found! Chat or work to initialize it.', ephemeral: true });
        }

        if (subcommand === 'customize') {
            if (!user.ownedItems.includes('vast_card')) {
                return interaction.reply({ content: '❌ You must own the Vast Card before customizing it.', ephemeral: true });
            }

            interaction.client.vastCardOrders = interaction.client.vastCardOrders || new Map();
            interaction.client.vastCardOrders.set(interaction.user.id, {});
            return interaction.showModal(buildModalOne());
        }

        const investmentList = user.investments.length > 0
            ? user.investments.map(i => `${i.companyId}: ${i.shares} shares`).join('\n')
            : 'No investments yet.';

        const badgeDisplay = user.badges.length > 0 ? user.badges.join(' ') : 'No badges earned.';
        const ownedCard = user.ownedItems.includes('vast_card') ? 'OWNED' : 'LOCKED';
        const customization = user.vastCardCustomization?.size
            ? [...user.vastCardCustomization.entries()].slice(0, 4).map(([key, value]) => `${key}: ${value}`).join('\n')
            : 'No custom order submitted yet.';

        const cardEmbed = createChromaEmbed({
            title: `${interaction.user.username}'s Vast Card`,
            color: CHROMA_COLORS.GREEN,
            thumbnail: interaction.user.displayAvatarURL({ extension: 'png', size: 256 }),
            fields: [
                { name: 'LEVEL', value: `**${user.level}**`, inline: true },
                { name: 'SPARKS', value: `**${user.sparks}**`, inline: true },
                { name: 'XP', value: `**${user.xp}**`, inline: true },
                { name: 'VAST CARD', value: ownedCard, inline: true },
                { name: 'BADGES', value: badgeDisplay },
                { name: 'INVESTMENTS', value: investmentList },
                { name: 'LAST CUSTOMIZATION', value: customization }
            ]
        });

        return interaction.reply({ embeds: [cardEmbed], ephemeral: true });
    }
};
