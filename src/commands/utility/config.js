const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const GuildConfig = require('../../database/models/GuildConfig');
const { createChromaEmbed, CHROMA_COLORS } = require('../../utils/chroma');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('Configure Vasty Bot production modules')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand.setName('welcome')
                .setDescription('Set the welcome channel and custom message')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Welcome target channel')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('message')
                        .setDescription('Use {user} and {server} placeholders')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand.setName('autorole')
                .setDescription('Set member and bot auto-roles')
                .addRoleOption(option => option.setName('member_role').setDescription('Role for human members').setRequired(true))
                .addRoleOption(option => option.setName('bot_role').setDescription('Role for bots').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand.setName('channels')
                .setDescription('Configure channel IDs used by the priority modules')
                .addChannelOption(option => option.setName('proof').setDescription('Proof-of-work channel').addChannelTypes(ChannelType.GuildText).setRequired(false))
                .addChannelOption(option => option.setName('media').setDescription('Media-only channel').addChannelTypes(ChannelType.GuildText).setRequired(false))
                .addChannelOption(option => option.setName('counting').setDescription('Counting game channel').addChannelTypes(ChannelType.GuildText).setRequired(false))
                .addChannelOption(option => option.setName('support').setDescription('Support panel channel').addChannelTypes(ChannelType.GuildText).setRequired(false))
                .addChannelOption(option => option.setName('event_post').setDescription('Scheduled event posting channel').addChannelTypes(ChannelType.GuildText).setRequired(false))
                .addChannelOption(option => option.setName('staff_orders').setDescription('Vast Card staff orders channel').addChannelTypes(ChannelType.GuildText).setRequired(false))
                .addChannelOption(option => option.setName('transcripts').setDescription('Ticket transcript channel').addChannelTypes(ChannelType.GuildText).setRequired(false))
                .addChannelOption(option => option.setName('ticket_category').setDescription('Ticket category').addChannelTypes(ChannelType.GuildCategory).setRequired(false))
                .addChannelOption(option => option.setName('member_stats').setDescription('Voice/stat channel for member count').addChannelTypes(ChannelType.GuildVoice).setRequired(false))
                .addChannelOption(option => option.setName('message_stats').setDescription('Voice/stat channel for message count').addChannelTypes(ChannelType.GuildVoice).setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand.setName('roles')
                .setDescription('Configure role IDs used by the priority modules')
                .addRoleOption(option => option.setName('moderator').setDescription('Moderator role').setRequired(false))
                .addRoleOption(option => option.setName('founder').setDescription('Founder role to ping for Vast Card orders').setRequired(false))),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const config = await GuildConfig.findOneAndUpdate(
            { guildId: interaction.guild.id },
            {},
            { new: true, upsert: true }
        );

        if (subcommand === 'welcome') {
            config.welcomeChannelId = interaction.options.getChannel('channel', true).id;
            config.welcomeMessage = interaction.options.getString('message', true);
        } else if (subcommand === 'autorole') {
            config.memberRoleId = interaction.options.getRole('member_role', true).id;
            config.botRoleId = interaction.options.getRole('bot_role', true).id;
        } else if (subcommand === 'channels') {
            const proof = interaction.options.getChannel('proof');
            const media = interaction.options.getChannel('media');
            const counting = interaction.options.getChannel('counting');
            const support = interaction.options.getChannel('support');
            const eventPost = interaction.options.getChannel('event_post');
            const staffOrders = interaction.options.getChannel('staff_orders');
            const transcripts = interaction.options.getChannel('transcripts');
            const ticketCategory = interaction.options.getChannel('ticket_category');
            const memberStats = interaction.options.getChannel('member_stats');
            const messageStats = interaction.options.getChannel('message_stats');

            if (proof) config.proofChannelId = proof.id;
            if (media) config.mediaChannelId = media.id;
            if (counting) {
                config.countingChannelId = counting.id;
                config.lastCount = 0;
                config.lastCounterId = null;
            }
            if (support) config.supportChannelId = support.id;
            if (eventPost) config.eventPostChannelId = eventPost.id;
            if (staffOrders) config.staffOrdersChannelId = staffOrders.id;
            if (transcripts) config.ticketTranscriptChannelId = transcripts.id;
            if (ticketCategory) config.ticketCategoryId = ticketCategory.id;
            if (memberStats) config.statsMemberChannelId = memberStats.id;
            if (messageStats) config.statsMessageChannelId = messageStats.id;
        } else if (subcommand === 'roles') {
            const moderator = interaction.options.getRole('moderator');
            const founder = interaction.options.getRole('founder');
            if (moderator) config.modRoleId = moderator.id;
            if (founder) config.founderRoleId = founder.id;
        }

        await config.save();

        const embed = createChromaEmbed({
            title: 'Configuration Updated',
            description: `Saved \`/config ${subcommand}\` for **${interaction.guild.name}**.`,
            color: CHROMA_COLORS.GREEN
        });

        return interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
