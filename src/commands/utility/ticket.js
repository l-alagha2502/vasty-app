const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType
} = require('discord.js');
const Ticket = require('../../database/models/Ticket');
const GuildConfig = require('../../database/models/GuildConfig');
const { createChromaEmbed, CHROMA_COLORS } = require('../../utils/chroma');
const { closeTicketChannel } = require('../../utils/tickets');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Manage Vasty support tickets')
        .addSubcommand(subcommand =>
            subcommand.setName('panel').setDescription('Post or refresh the support panel'))
        .addSubcommand(subcommand =>
            subcommand.setName('add')
                .setDescription('Add a user to the current ticket')
                .addUserOption(option => option.setName('user').setDescription('User to add').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand.setName('remove')
                .setDescription('Remove a user from the current ticket')
                .addUserOption(option => option.setName('user').setDescription('User to remove').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand.setName('close').setDescription('Close the current ticket and save a transcript'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const config = await GuildConfig.findOneAndUpdate(
            { guildId: interaction.guild.id },
            {},
            { new: true, upsert: true }
        );

        if (subcommand === 'panel') {
            const targetChannel = config.supportChannelId
                ? interaction.guild.channels.cache.get(config.supportChannelId)
                : interaction.channel;

            if (!targetChannel || targetChannel.type !== ChannelType.GuildText) {
                return interaction.reply({ content: '❌ Configure a text support channel first.', ephemeral: true });
            }

            const panelEmbed = createChromaEmbed({
                title: 'Support Hub',
                description: 'Need help or need to file a report? Use the buttons below. The bot will create a private ticket and ping the moderator role immediately.',
                color: CHROMA_COLORS.CYAN
            });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('ticket_panel_support').setLabel('Support').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('ticket_panel_report').setLabel('Report').setStyle(ButtonStyle.Danger)
            );

            const message = await targetChannel.send({ embeds: [panelEmbed], components: [row] });
            config.supportChannelId = targetChannel.id;
            config.supportPanelMessageId = message.id;
            await config.save();

            return interaction.reply({ content: `✅ Support panel posted in ${targetChannel}.`, ephemeral: true });
        }

        const ticket = await Ticket.findOne({ channelId: interaction.channel.id, status: { $in: ['OPEN', 'CLAIMED'] } });
        if (!ticket) {
            return interaction.reply({ content: '❌ This command only works inside an active ticket channel.', ephemeral: true });
        }

        if (subcommand === 'add') {
            const user = interaction.options.getUser('user', true);
            await interaction.channel.permissionOverwrites.edit(user.id, {
                ViewChannel: true,
                SendMessages: true,
                ReadMessageHistory: true,
                AttachFiles: true
            });

            if (!ticket.addedUserIds.includes(user.id)) {
                ticket.addedUserIds.push(user.id);
                await ticket.save();
            }

            return interaction.reply({ content: `✅ Added ${user} to this ticket.`, ephemeral: true });
        }

        if (subcommand === 'remove') {
            const user = interaction.options.getUser('user', true);
            await interaction.channel.permissionOverwrites.delete(user.id).catch(() => null);
            ticket.addedUserIds = ticket.addedUserIds.filter(id => id !== user.id);
            await ticket.save();
            return interaction.reply({ content: `✅ Removed ${user} from this ticket.`, ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });
        await closeTicketChannel(interaction.channel, interaction.user);
        return interaction.followUp({ content: `✅ Ticket #${ticket.ticketNumber} closed and transcript saved.`, ephemeral: true }).catch(() => null);
    }
};
