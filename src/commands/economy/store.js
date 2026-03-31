const { SlashCommandBuilder } = require('discord.js');
const User = require('../../database/models/User');
const { createChromaEmbed, CHROMA_COLORS } = require('../../utils/chroma');

const storeItems = [
    { id: 'embed_links', name: 'Embed Links Permission', cost: 1000, type: 'perk' },
    { id: 'badge_star', name: 'Vast Star Badge', cost: 500, type: 'badge', icon: '⭐' },
    { id: 'badge_pro', name: 'Vast Pro Badge', cost: 2500, type: 'badge', icon: '🚀' },
    { id: 'vast_card', name: 'The Vast Card', cost: 50000, type: 'special', unlockLevel: 50, unlockRole: 'Ally' }
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('store')
        .setDescription('Vast Global Store')
        .addSubcommand(s => s.setName('list').setDescription('List all store items'))
        .addSubcommand(s => s.setName('buy').setDescription('Buy an item from the store')
            .addStringOption(o => o.setName('item').setDescription('Item ID to buy').setRequired(true))),
    
    async execute(interaction) {
        const sub = interaction.options.getSubcommand();

        if (sub === 'list') {
            const fields = storeItems.map(item => ({
                name: `${item.name} (${item.id})`,
                value: item.id === 'vast_card'
                    ? `Cost: **${item.cost} Sparks**\nGate: **Level 50 (Ally)**`
                    : `Cost: **${item.cost} Sparks**`,
                inline: true
            }));

            const storeEmbed = createChromaEmbed({
                title: 'VAST GLOBAL STORE',
                fields: fields,
                color: CHROMA_COLORS.YELLOW
            });

            return interaction.reply({ embeds: [storeEmbed] });
        }

        if (sub === 'buy') {
            const itemId = interaction.options.getString('item');
            const item = storeItems.find(i => i.id === itemId);

            if (!item) {
                return interaction.reply({ content: '❌ Invalid Item ID!', ephemeral: true });
            }

            const user = await User.findOne({ userId: interaction.user.id });
            if (!user || user.sparks < item.cost) {
                return interaction.reply({ content: '❌ You don\'t have enough Sparks!', ephemeral: true });
            }

            if (item.type === 'perk' && user.unlockedPerks.includes(item.id)) {
                return interaction.reply({ content: '❌ You already have this perk!', ephemeral: true });
            }

            if (item.type === 'badge' && user.badges.includes(item.icon)) {
                return interaction.reply({ content: '❌ You already have this badge!', ephemeral: true });
            }

            if (itemId === 'vast_card') {
                if (user.level < 50) {
                    return interaction.reply({ content: '❌ **GATE LOCKED.** You must be **Level 50 (Ally)** to purchase the Vast Card!', ephemeral: true });
                }

                if (user.ownedItems.includes('vast_card')) {
                    return interaction.reply({ content: '❌ You already own the Vast Card.', ephemeral: true });
                }
            }

            user.sparks -= item.cost;

            if (item.type === 'perk') {
                user.unlockedPerks.push(item.id);
            } else if (item.type === 'badge') {
                user.badges.push(item.icon);
            } else if (item.type === 'special') {
                user.ownedItems.push(item.id);
            }

            await user.save();

            const embed = createChromaEmbed({
                title: 'Purchase Complete',
                description: item.id === 'vast_card'
                    ? `You bought **${item.name}** for **${item.cost} Sparks**.\nRun **/vastcard customize** to submit your 14-field order sheet.`
                    : `You bought **${item.name}** for **${item.cost} Sparks**.`,
                color: CHROMA_COLORS.GREEN
            });

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};
