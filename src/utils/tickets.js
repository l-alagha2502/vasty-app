const {
    ActionRowBuilder,
    AttachmentBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    PermissionFlagsBits
} = require('discord.js');
const Ticket = require('../database/models/Ticket');
const GuildConfig = require('../database/models/GuildConfig');
const { createChromaEmbed, CHROMA_COLORS } = require('./chroma');

function buildTicketControls(ticketId, claimedBy) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`ticket_claim_${ticketId}`)
            .setLabel(claimedBy ? 'Claimed' : 'Claim Ticket')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(Boolean(claimedBy)),
        new ButtonBuilder()
            .setCustomId(`ticket_abort_${ticketId}`)
            .setLabel('Abort Ticket')
            .setStyle(ButtonStyle.Danger)
    );
}

async function createTicketChannel(interaction, type) {
    const config = await GuildConfig.findOne({ guildId: interaction.guild.id });
    if (!config?.modRoleId) {
        throw new Error('Moderator role is not configured.');
    }

    const existing = await Ticket.findOne({
        guildId: interaction.guild.id,
        userId: interaction.user.id,
        status: { $in: ['OPEN', 'CLAIMED'] },
        type
    });

    if (existing) {
        return { existing };
    }

    const nextNumber = (config.ticketCounter || 0) + 1;
    config.ticketCounter = nextNumber;
    await config.save();

    const parent = config.ticketCategoryId || null;
    const channelName = `${type.toLowerCase()}-${String(nextNumber).padStart(4, '0')}`;

    const channel = await interaction.guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent,
        permissionOverwrites: [
            {
                id: interaction.guild.roles.everyone.id,
                deny: [PermissionFlagsBits.ViewChannel]
            },
            {
                id: interaction.user.id,
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.AttachFiles,
                    PermissionFlagsBits.ReadMessageHistory
                ]
            },
            {
                id: config.modRoleId,
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.AttachFiles,
                    PermissionFlagsBits.ReadMessageHistory,
                    PermissionFlagsBits.ManageChannels
                ]
            }
        ],
        reason: `Vasty ticket created by ${interaction.user.tag}`
    });

    const ticket = await Ticket.create({
        guildId: interaction.guild.id,
        channelId: channel.id,
        userId: interaction.user.id,
        ticketNumber: nextNumber,
        type,
        addedUserIds: []
    });

    const embed = createChromaEmbed({
        title: `${type} Ticket #${nextNumber}`,
        description: `Owner: ${interaction.user}\nStatus: OPEN\n\nA moderator can claim or abort this ticket using the controls below.`,
        color: type === 'REPORT' ? CHROMA_COLORS.CYAN : CHROMA_COLORS.GREEN
    });

    await channel.send({
        content: `<@&${config.modRoleId}> ${interaction.user}`,
        embeds: [embed],
        components: [buildTicketControls(ticket.id, null)]
    });

    return { ticket, channel };
}

async function closeTicketChannel(channel, closedBy) {
    const ticket = await Ticket.findOne({ channelId: channel.id, status: { $in: ['OPEN', 'CLAIMED'] } });
    if (!ticket) {
        throw new Error('No active ticket found for this channel.');
    }

    const config = await GuildConfig.findOne({ guildId: channel.guild.id });
    const messages = await channel.messages.fetch({ limit: 100 });
    const transcriptLines = [...messages.values()]
        .sort((a, b) => a.createdTimestamp - b.createdTimestamp)
        .map(message => {
            const stamp = new Date(message.createdTimestamp).toISOString();
            const attachments = message.attachments.map(attachment => attachment.url).join(', ');
            return `[${stamp}] ${message.author?.tag || 'Unknown'}: ${message.content || ''}${attachments ? ` | attachments: ${attachments}` : ''}`;
        });

    const transcript = transcriptLines.join('\n') || 'No transcript content recorded.';
    ticket.status = 'CLOSED';
    ticket.closedBy = closedBy.id;
    ticket.closedAt = new Date();
    ticket.transcript = transcript;
    await ticket.save();

    const transcriptFile = new AttachmentBuilder(
        Buffer.from(transcript, 'utf8'),
        { name: `ticket-${ticket.ticketNumber}.txt` }
    );

    if (config?.ticketTranscriptChannelId) {
        const transcriptChannel = channel.guild.channels.cache.get(config.ticketTranscriptChannelId);
        if (transcriptChannel?.isTextBased()) {
            const summaryEmbed = createChromaEmbed({
                title: `Ticket Closed #${ticket.ticketNumber}`,
                description: `Owner: <@${ticket.userId}>\nClosed by: ${closedBy}\nType: ${ticket.type}`,
                color: CHROMA_COLORS.CYAN
            });

            await transcriptChannel.send({
                embeds: [summaryEmbed],
                files: [transcriptFile]
            }).catch(error => {
                console.error('[Tickets] Failed to post transcript:', error);
            });
        }
    }

    await channel.delete(`Ticket closed by ${closedBy.tag}`);
    return ticket;
}

module.exports = {
    buildTicketControls,
    closeTicketChannel,
    createTicketChannel
};
