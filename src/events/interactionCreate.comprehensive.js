const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelSelectMenuBuilder,
    ChannelType,
    EmbedBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require('discord.js');
const User = require('../database/models/User');
const Event = require('../database/models/Event');
const Survey = require('../database/models/Survey');
const Ticket = require('../database/models/Ticket');
const GuildConfig = require('../database/models/GuildConfig');
const { createChromaEmbed, CHROMA_COLORS } = require('../utils/chroma');
const { buildTicketControls, createTicketChannel } = require('../utils/tickets');

function buildVastCardModalTwo() {
    return new ModalBuilder()
        .setCustomId('vast_card_modal_2')
        .setTitle('VAST CARD CUSTOMIZER 2/3')
        .addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('vc_primary_name').setLabel('Primary Name').setStyle(TextInputStyle.Short).setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('vc_secondary_name').setLabel('Secondary Name').setStyle(TextInputStyle.Short).setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('vc_socials').setLabel('Socials').setStyle(TextInputStyle.Paragraph).setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('vc_cursor').setLabel('Cursor').setStyle(TextInputStyle.Short).setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('vc_bio').setLabel('Bio').setStyle(TextInputStyle.Paragraph).setRequired(true)
            )
        );
}

function buildVastCardModalThree() {
    return new ModalBuilder()
        .setCustomId('vast_card_modal_3')
        .setTitle('VAST CARD CUSTOMIZER 3/3')
        .addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('vc_bio_style').setLabel('Bio Style').setStyle(TextInputStyle.Short).setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('vc_pfp').setLabel('PFP').setStyle(TextInputStyle.Short).setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('vc_location').setLabel('Location').setStyle(TextInputStyle.Short).setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('vc_accent_notes').setLabel('Accent Notes').setStyle(TextInputStyle.Paragraph).setRequired(true)
            )
        );
}

module.exports = {
    name: 'interactionCreate',
    async execute(client, interaction) {
        if (interaction.isButton()) {
            try {
                if (interaction.customId.startsWith('trivia_')) {
                    const [, status, userId] = interaction.customId.split('_');
                    if (interaction.user.id !== userId) {
                        return interaction.reply({ content: '❌ This is not your trivia.', ephemeral: true });
                    }

                    if (status === 'correct') {
                        const user = await User.findOneAndUpdate({ userId: interaction.user.id }, {}, { new: true, upsert: true });
                        user.sparks += 10;
                        await user.save();
                        return interaction.update({ content: '✅ CORRECT. You earned 10 Sparks.', components: [] });
                    }

                    return interaction.update({ content: '❌ Wrong answer.', components: [] });
                }

                if (interaction.customId.startsWith('giveaway_join_')) {
                    client.giveawayParticipants = client.giveawayParticipants || new Map();
                    const giveawayId = interaction.customId.split('_')[2];
                    const participants = client.giveawayParticipants.get(giveawayId) || new Set();

                    if (participants.has(interaction.user.id)) {
                        return interaction.reply({ content: '❌ You already joined.', ephemeral: true });
                    }

                    participants.add(interaction.user.id);
                    client.giveawayParticipants.set(giveawayId, participants);
                    return interaction.reply({ content: '✅ Joined giveaway.', ephemeral: true });
                }

                if (interaction.customId === 'event_rsvp') {
                    const event = await Event.findOne({ messageId: interaction.message.id });
                    if (!event) return interaction.reply({ content: '❌ Event not found.', ephemeral: true });

                    if (event.rsvps.includes(interaction.user.id)) {
                        event.rsvps = event.rsvps.filter(id => id !== interaction.user.id);
                        await event.save();
                        return interaction.reply({ content: '❌ RSVP removed.', ephemeral: true });
                    }

                    event.rsvps.push(interaction.user.id);
                    await event.save();
                    return interaction.reply({ content: '✅ RSVP confirmed.', ephemeral: true });
                }

                if (interaction.customId === 'event_timezone') {
                    const event = await Event.findOne({ messageId: interaction.message.id });
                    if (!event) return interaction.reply({ content: '❌ Event not found.', ephemeral: true });

                    const unixTime = Math.floor(event.time.getTime() / 1000);
                    await interaction.user.send({
                        content: `Event time:\n<t:${unixTime}:F>\n<t:${unixTime}:R>`
                    }).catch(() => null);
                    return interaction.reply({ content: '✅ Sent your local event time in DM.', ephemeral: true });
                }

                if (interaction.customId.startsWith('survey_start_')) {
                    const survey = await Survey.findOne({ guildId: interaction.guild.id }).sort({ createdAt: -1 });
                    if (!survey) return interaction.reply({ content: '❌ Survey not found.', ephemeral: true });

                    const modal = new ModalBuilder()
                        .setCustomId(`survey_submit_${survey._id}`)
                        .setTitle(survey.title.slice(0, 45).toUpperCase());

                    for (const [index, question] of survey.questions.entries()) {
                        modal.addComponents(
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder()
                                    .setCustomId(`q_${index}`)
                                    .setLabel(question.slice(0, 45))
                                    .setStyle(TextInputStyle.Paragraph)
                                    .setRequired(true)
                            )
                        );
                    }

                    return interaction.showModal(modal);
                }

                if (interaction.customId === 'ticket_panel_support' || interaction.customId === 'ticket_panel_report') {
                    const type = interaction.customId.endsWith('report') ? 'REPORT' : 'SUPPORT';
                    const result = await createTicketChannel(interaction, type);

                    if (result.existing) {
                        const existingChannel = interaction.guild.channels.cache.get(result.existing.channelId);
                        return interaction.reply({
                            content: existingChannel
                                ? `❌ You already have an open ${type.toLowerCase()} ticket: ${existingChannel}`
                                : '❌ You already have an open ticket.',
                            ephemeral: true
                        });
                    }

                    return interaction.reply({
                        content: `✅ ${type} ticket created: ${result.channel}`,
                        ephemeral: true
                    });
                }

                if (interaction.customId.startsWith('ticket_claim_')) {
                    const ticketId = interaction.customId.split('_')[2];
                    const ticket = await Ticket.findById(ticketId);
                    if (!ticket) return interaction.reply({ content: '❌ Ticket not found.', ephemeral: true });

                    const config = await GuildConfig.findOne({ guildId: interaction.guild.id });
                    if (config?.modRoleId && !interaction.member.roles.cache.has(config.modRoleId)) {
                        return interaction.reply({ content: '❌ Only moderators can claim tickets.', ephemeral: true });
                    }

                    ticket.claimedBy = interaction.user.id;
                    ticket.status = 'CLAIMED';
                    await ticket.save();

                    const embed = createChromaEmbed({
                        title: `Ticket Claimed #${ticket.ticketNumber}`,
                        description: `${interaction.user} is now assigned to this ticket.`,
                        color: CHROMA_COLORS.GREEN
                    });

                    return interaction.update({
                        embeds: [embed],
                        components: [buildTicketControls(ticket.id, interaction.user.id)]
                    });
                }

                if (interaction.customId.startsWith('ticket_abort_')) {
                    const ticketId = interaction.customId.split('_')[2];
                    const ticket = await Ticket.findById(ticketId);
                    if (!ticket) return interaction.reply({ content: '❌ Ticket not found.', ephemeral: true });

                    await Ticket.findByIdAndDelete(ticketId);
                    await interaction.reply({ content: '✅ Ticket aborted.', ephemeral: true });
                    await interaction.channel.delete(`Ticket aborted by ${interaction.user.tag}`);
                    return;
                }

                if (interaction.customId.startsWith('nuke_restore_')) {
                    return interaction.reply({
                        content: '🛠️ Restore path acknowledged. Review the security log and recreate affected resources manually.',
                        ephemeral: true
                    });
                }

                if (interaction.customId.startsWith('nuke_confirm_')) {
                    return interaction.reply({
                        content: '✅ Panic confirmation logged.',
                        ephemeral: true
                    });
                }
            } catch (error) {
                console.error('[InteractionCreate] Button error:', error);
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: '❌ Interaction failed.', ephemeral: true }).catch(() => null);
                }
            }
        }

        if (interaction.isModalSubmit()) {
            try {
                if (interaction.customId === 'vast_card_modal_1') {
                    client.vastCardOrders = client.vastCardOrders || new Map();
                    client.vastCardOrders.set(interaction.user.id, {
                        background_asset: interaction.fields.getTextInputValue('vc_background_asset'),
                        background_style: interaction.fields.getTextInputValue('vc_background_style'),
                        effects: interaction.fields.getTextInputValue('vc_effects'),
                        opacity: interaction.fields.getTextInputValue('vc_opacity'),
                        blur: interaction.fields.getTextInputValue('vc_blur')
                    });
                    return interaction.showModal(buildVastCardModalTwo());
                }

                if (interaction.customId === 'vast_card_modal_2') {
                    const order = client.vastCardOrders?.get(interaction.user.id);
                    if (!order) {
                        return interaction.reply({ content: '❌ Customizer session expired.', ephemeral: true });
                    }

                    Object.assign(order, {
                        primary_name: interaction.fields.getTextInputValue('vc_primary_name'),
                        secondary_name: interaction.fields.getTextInputValue('vc_secondary_name'),
                        socials: interaction.fields.getTextInputValue('vc_socials'),
                        cursor: interaction.fields.getTextInputValue('vc_cursor'),
                        bio: interaction.fields.getTextInputValue('vc_bio')
                    });

                    return interaction.showModal(buildVastCardModalThree());
                }

                if (interaction.customId === 'vast_card_modal_3') {
                    const order = client.vastCardOrders?.get(interaction.user.id);
                    if (!order) {
                        return interaction.reply({ content: '❌ Customizer session expired.', ephemeral: true });
                    }

                    Object.assign(order, {
                        bio_style: interaction.fields.getTextInputValue('vc_bio_style'),
                        pfp: interaction.fields.getTextInputValue('vc_pfp'),
                        location: interaction.fields.getTextInputValue('vc_location'),
                        accent_notes: interaction.fields.getTextInputValue('vc_accent_notes')
                    });

                    const user = await User.findOne({ userId: interaction.user.id });
                    if (!user?.ownedItems.includes('vast_card')) {
                        client.vastCardOrders.delete(interaction.user.id);
                        return interaction.reply({ content: '❌ You do not own the Vast Card.', ephemeral: true });
                    }

                    user.vastCardCustomization = order;
                    await user.save();

                    const config = await GuildConfig.findOne({ guildId: interaction.guild.id });
                    const staffChannel = config?.staffOrdersChannelId
                        ? interaction.guild.channels.cache.get(config.staffOrdersChannelId)
                        : null;

                    const fields = [
                        ['1. Background', order.background_asset],
                        ['2. Background Style', order.background_style],
                        ['3. Effects', order.effects],
                        ['4. Opacity', order.opacity],
                        ['5. Blur', order.blur],
                        ['6. Primary Name', order.primary_name],
                        ['7. Secondary Name', order.secondary_name],
                        ['8. Socials', order.socials],
                        ['9. Cursor', order.cursor],
                        ['10. Bio', order.bio],
                        ['11. Bio Style', order.bio_style],
                        ['12. PFP', order.pfp],
                        ['13. Location', order.location],
                        ['14. Accent Notes', order.accent_notes]
                    ].map(([name, value]) => ({ name, value: value || 'N/A' }));

                    const orderEmbed = createChromaEmbed({
                        title: 'Vast Card Order Sheet',
                        description: `Customer: ${interaction.user} (${interaction.user.id})`,
                        color: CHROMA_COLORS.CYAN,
                        fields
                    });

                    if (staffChannel?.isTextBased()) {
                        const founderPing = config?.founderRoleId ? `<@&${config.founderRoleId}>` : '@here';
                        await staffChannel.send({ content: founderPing, embeds: [orderEmbed] });
                    }

                    client.vastCardOrders.delete(interaction.user.id);
                    return interaction.reply({ content: '✅ Vast Card order submitted.', ephemeral: true });
                }

                if (interaction.customId.startsWith('survey_submit_')) {
                    const surveyId = interaction.customId.split('_')[2];
                    const survey = await Survey.findById(surveyId);
                    if (!survey) return interaction.reply({ content: '❌ Survey no longer exists.', ephemeral: true });

                    const answers = survey.questions.map((question, index) => ({
                        question,
                        answer: interaction.fields.getTextInputValue(`q_${index}`)
                    }));

                    survey.responses.push({ userId: interaction.user.id, answers });
                    await survey.save();
                    return interaction.reply({ content: '✅ Survey submitted.', ephemeral: true });
                }

                if (interaction.customId === 'build_embed_modal') {
                    const title = interaction.fields.getTextInputValue('embed_title');
                    const description = interaction.fields.getTextInputValue('embed_desc');
                    const colorInput = interaction.fields.getTextInputValue('embed_color') || '#00FF00';
                    const imageInput = interaction.fields.getTextInputValue('embed_image');
                    const footerInput = interaction.fields.getTextInputValue('embed_footer');

                    const embed = new EmbedBuilder().setDescription(description).setColor(colorInput);
                    if (title) embed.setTitle(title);
                    if (imageInput) embed.setImage(imageInput);
                    if (footerInput) embed.setFooter({ text: footerInput });

                    client.tempEmbeds = client.tempEmbeds || new Map();
                    client.tempEmbeds.set(interaction.user.id, embed);

                    const row = new ActionRowBuilder().addComponents(
                        new ChannelSelectMenuBuilder()
                            .setCustomId('select_embed_channel')
                            .setPlaceholder('Select a target channel')
                            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
                    );

                    return interaction.reply({
                        content: '✅ Embed built. Select a target channel.',
                        embeds: [embed],
                        components: [row],
                        ephemeral: true
                    });
                }
            } catch (error) {
                console.error('[InteractionCreate] Modal error:', error);
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: '❌ Modal processing failed.', ephemeral: true }).catch(() => null);
                }
            }
        }

        if (interaction.isChannelSelectMenu() && interaction.customId === 'select_embed_channel') {
            try {
                const embed = interaction.client.tempEmbeds?.get(interaction.user.id);
                if (!embed) {
                    return interaction.reply({ content: '❌ No pending embed found.', ephemeral: true });
                }

                const channelId = interaction.values[0];
                const channel = interaction.guild.channels.cache.get(channelId);
                if (!channel?.isTextBased()) {
                    return interaction.reply({ content: '❌ Invalid target channel.', ephemeral: true });
                }

                await channel.send({ embeds: [embed] });
                interaction.client.tempEmbeds.delete(interaction.user.id);
                return interaction.update({ content: `✅ Embed sent to ${channel}.`, embeds: [], components: [] });
            } catch (error) {
                console.error('[InteractionCreate] Select menu error:', error);
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: '❌ Channel selection failed.', ephemeral: true }).catch(() => null);
                }
            }
        }
    }
};
