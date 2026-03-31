const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { createChromaEmbed, CHROMA_COLORS } = require('../../utils/chroma');
const GuildConfig = require('../../database/models/GuildConfig');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('news')
        .setDescription('Manage news feeds')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(s => s.setName('add')
            .setDescription('Add a new RSS feed')
            .addStringOption(o => o.setName('url').setDescription('RSS Feed URL').setRequired(true))
            .addChannelOption(o => o.setName('channel').setDescription('Channel to post in').addChannelTypes(ChannelType.GuildText).setRequired(true)))
        .addSubcommand(s => s.setName('list').setDescription('List all active news feeds')),
    async execute(interaction) {
        const sub = interaction.options.getSubcommand();

        if (sub === 'add') {
            const url = interaction.options.getString('url');
            const channel = interaction.options.getChannel('channel');

            await GuildConfig.findOneAndUpdate(
                { guildId: interaction.guild.id },
                { $push: { newsFeedUrls: { url: url, channelId: channel.id } } },
                { upsert: true }
            );

            return interaction.reply({ content: `✅ Added news feed: **${url}** to <#${channel.id}>`, ephemeral: true });
        }

        if (sub === 'list') {
            const config = await GuildConfig.findOne({ guildId: interaction.guild.id });
            if (!config || !config.newsFeedUrls.length) {
                return interaction.reply({ content: '❌ No active news feeds configured!', ephemeral: true });
            }

            const feedList = config.newsFeedUrls.map(f => `• ${f.url} -> <#${f.channelId}>`).join('\n');
            const listEmbed = createChromaEmbed({
                title: 'ACTIVE NEWS FEEDS',
                description: feedList,
                color: CHROMA_COLORS.CYAN
            });

            return interaction.reply({ embeds: [listEmbed], ephemeral: true });
        }
    }
};
