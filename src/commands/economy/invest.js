const { SlashCommandBuilder } = require('discord.js');
const User = require('../../database/models/User');
const Market = require('../../database/models/Market');
const { createChromaEmbed, CHROMA_COLORS } = require('../../utils/chroma');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('invest')
        .setDescription('Global Investment Market')
        .addSubcommand(s => s.setName('prices').setDescription('Check current share prices'))
        .addSubcommand(s => s.setName('buy').setDescription('Buy shares in a Vast company')
            .addStringOption(o => o.setName('company').setDescription('Company to invest in').setRequired(true)
                .addChoices(
                    { name: 'Vast Tech', value: 'VAST_TECH' },
                    { name: 'Vast Media', value: 'VAST_MEDIA' },
                    { name: 'Vast Global', value: 'VAST_GLOBAL' }
                ))
            .addIntegerOption(o => o.setName('amount').setDescription('Amount of shares to buy').setRequired(true).setMinValue(1)))
        .addSubcommand(s => s.setName('sell').setDescription('Sell your shares')
            .addStringOption(o => o.setName('company').setDescription('Company to sell shares from').setRequired(true)
                .addChoices(
                    { name: 'Vast Tech', value: 'VAST_TECH' },
                    { name: 'Vast Media', value: 'VAST_MEDIA' },
                    { name: 'Vast Global', value: 'VAST_GLOBAL' }
                ))
            .addIntegerOption(o => o.setName('amount').setDescription('Amount of shares to sell').setRequired(true).setMinValue(1))),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();

        if (sub === 'prices') {
            const marketData = await Market.find({});
            const fields = marketData.map(c => ({
                name: `${c.name} (${c.companyId})`,
                value: `Price: **${c.currentPrice} Sparks** / share`,
                inline: true
            }));

            const priceEmbed = createChromaEmbed({
                title: 'MARKET PRICES',
                fields: fields,
                color: CHROMA_COLORS.MAGENTA
            });

            return interaction.reply({ embeds: [priceEmbed] });
        }

        const companyId = interaction.options.getString('company');
        const amount = interaction.options.getInteger('amount');
        const company = await Market.findOne({ companyId: companyId });

        if (sub === 'buy') {
            const totalCost = company.currentPrice * amount;
            const user = await User.findOne({ userId: interaction.user.id });

            if (!user || user.sparks < totalCost) {
                return interaction.reply({ content: '❌ You don\'t have enough Sparks!', ephemeral: true });
            }

            // Atomic update to subtract Sparks and add shares
            await User.findOneAndUpdate(
                { userId: interaction.user.id },
                { $inc: { sparks: -totalCost } }
            );

            // Find or create investment entry
            let investment = user.investments.find(i => i.companyId === companyId);
            if (!investment) {
                user.investments.push({ companyId: companyId, shares: amount });
            } else {
                investment.shares += amount;
            }
            await user.save();

            return interaction.reply({
                content: `🚀 Successfully bought **${amount} shares** in **${company.name}** for **${totalCost} Sparks**!`
            });
        }

        if (sub === 'sell') {
            const user = await User.findOne({ userId: interaction.user.id });
            const investmentIndex = user?.investments.findIndex(i => i.companyId === companyId);
            const investment = user?.investments[investmentIndex];

            if (!investment || investment.shares < amount) {
                return interaction.reply({ content: '❌ You don\'t have enough shares to sell!', ephemeral: true });
            }

            const totalReturn = company.currentPrice * amount;

            // Atomic update to add Sparks and remove shares
            await User.findOneAndUpdate(
                { userId: interaction.user.id },
                { $inc: { sparks: totalReturn } }
            );

            investment.shares -= amount;
            if (investment.shares === 0) {
                user.investments.splice(investmentIndex, 1);
            }
            await user.save();

            return interaction.reply({
                content: `💸 Successfully sold **${amount} shares** in **${company.name}** for **${totalReturn} Sparks**!`
            });
        }
    }
};
