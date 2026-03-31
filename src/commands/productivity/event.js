const { 
    SlashCommandBuilder, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    ActionRowBuilder, 
    EmbedBuilder, 
    ButtonBuilder, 
    ButtonStyle 
} = require('discord.js');
const { createChromaEmbed, CHROMA_COLORS } = require('../../utils/chroma');
const Event = require('../../database/models/Event');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('event')
        .setDescription('Schedule a new server event'),
    async execute(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('event_creation_modal')
            .setTitle('🚀 CREATE NEW EVENT');

        const titleInput = new TextInputBuilder()
            .setCustomId('event_title')
            .setLabel('EVENT TITLE')
            .setPlaceholder('Enter a catchy title')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const timeInput = new TextInputBuilder()
            .setCustomId('event_time')
            .setLabel('EVENT TIME (YYYY-MM-DD HH:MM)')
            .setPlaceholder('e.g., 2026-12-25 18:00 (UTC)')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const descInput = new TextInputBuilder()
            .setCustomId('event_desc')
            .setLabel('DESCRIPTION')
            .setPlaceholder('What\'s happening?')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(titleInput),
            new ActionRowBuilder().addComponents(timeInput),
            new ActionRowBuilder().addComponents(descInput)
        );

        await interaction.showModal(modal);

        try {
            const filter = (i) => i.customId === 'event_creation_modal' && i.user.id === interaction.user.id;
            const modalSubmit = await interaction.awaitModalSubmit({ filter, time: 300000 });

            const title = modalSubmit.fields.getTextInputValue('event_title');
            const timeStr = modalSubmit.fields.getTextInputValue('event_time');
            const description = modalSubmit.fields.getTextInputValue('event_desc');

            const eventDate = new Date(timeStr);
            if (isNaN(eventDate.getTime())) {
                return modalSubmit.reply({ content: '❌ Invalid date format! Please use YYYY-MM-DD HH:MM.', ephemeral: true });
            }

            const eventEmbed = createChromaEmbed({
                title: `NEW EVENT: ${title.toUpperCase()}`,
                description: `${description}\n\n📅 **TIME:** <t:${Math.floor(eventDate.getTime() / 1000)}:F>\n👤 **HOST:** ${interaction.user}`,
                color: CHROMA_COLORS.CYAN
            });

            const buttons = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('event_rsvp')
                    .setLabel('RSVP')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('event_timezone')
                    .setLabel('TIMEZONE HELP')
                    .setStyle(ButtonStyle.Secondary)
            );

            const msg = await modalSubmit.reply({ embeds: [eventEmbed], components: [buttons], fetchReply: true });

            // Save to DB
            const newEvent = new Event({
                guildId: interaction.guild.id,
                title: title,
                description: description,
                time: eventDate,
                creatorId: interaction.user.id,
                rsvps: [],
                messageId: msg.id
            });
            await newEvent.save();

        } catch (error) {
            console.error('[Command: event] Error:', error);
        }
    }
};
