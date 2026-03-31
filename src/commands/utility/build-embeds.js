const {
    SlashCommandBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    ChannelSelectMenuBuilder,
    ChannelType,
    EmbedBuilder,
    PermissionFlagsBits
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('build-embed')
        .setDescription('Open the Interactive Custom Embed Builder')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        // 1. Create the Modal
        const modal = new ModalBuilder()
            .setCustomId('build_embed_modal')
            .setTitle('🛠️ Custom Embed Builder');

        // Text inputs for embed payload
        const titleInput = new TextInputBuilder()
            .setCustomId('embed_title')
            .setLabel('Embed Title')
            .setPlaceholder('Enter your embed title')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setMaxLength(256);

        const descInput = new TextInputBuilder()
            .setCustomId('embed_desc')
            .setLabel('Embed Description')
            .setPlaceholder('Enter your embed description (Markdown supported)')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(4000);

        const colorInput = new TextInputBuilder()
            .setCustomId('embed_color')
            .setLabel('Embed Color (Hex)')
            .setPlaceholder('#5865F2')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setMaxLength(7);

        const imageInput = new TextInputBuilder()
            .setCustomId('embed_image')
            .setLabel('Embed Image URL')
            .setPlaceholder('https://example.com/image.png')
            .setStyle(TextInputStyle.Short)
            .setRequired(false);

        const footerInput = new TextInputBuilder()
            .setCustomId('embed_footer')
            .setLabel('Embed Footer')
            .setPlaceholder('Enter your embed footer text')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setMaxLength(2048);

        // Add inputs to rows
        modal.addComponents(
            new ActionRowBuilder().addComponents(titleInput),
            new ActionRowBuilder().addComponents(descInput),
            new ActionRowBuilder().addComponents(colorInput),
            new ActionRowBuilder().addComponents(imageInput),
            new ActionRowBuilder().addComponents(footerInput)
        );

        // Display modal to user
        await interaction.showModal(modal);

        // Await modal submission
        try {
            const filter = (i) => i.customId === 'build_embed_modal' && i.user.id === interaction.user.id;
            const modalSubmit = await interaction.awaitModalSubmit({ filter, time: 300000 }); // 5 minutes

            // Extract data from modal
            const title = modalSubmit.fields.getTextInputValue('embed_title');
            const description = modalSubmit.fields.getTextInputValue('embed_desc');
            const color = modalSubmit.fields.getTextInputValue('embed_color') || '#5865F2';
            const imageUrl = modalSubmit.fields.getTextInputValue('embed_image');
            const footerText = modalSubmit.fields.getTextInputValue('embed_footer');

            // Construct the Embed
            const customEmbed = new EmbedBuilder()
                .setDescription(description)
                .setColor(color);
            
            if (title) customEmbed.setTitle(title);
            if (imageUrl) customEmbed.setImage(imageUrl);
            if (footerText) customEmbed.setFooter({ text: footerText });

            // Create a channel select menu for the user to choose where to send it
            const channelSelect = new ChannelSelectMenuBuilder()
                .setCustomId('embed_channel_select')
                .setPlaceholder('Select a channel to send this embed')
                .setChannelTypes(ChannelType.GuildText);

            const row = new ActionRowBuilder().addComponents(channelSelect);

            // Reply ephemerally with the created embed to preview, and the select menu
            const replyMsg = await modalSubmit.reply({
                content: 'Embed preview! Where should I send this?',
                embeds: [customEmbed],
                components: [row],
                ephemeral: true,
                fetchReply: true
            });

            // Await channel selection
            const channelSelection = await replyMsg.awaitMessageComponent({
                filter: i => i.customId === 'embed_channel_select' && i.user.id === interaction.user.id,
                time: 60000
            });

            const selectedChannelId = channelSelection.values[0];
            const targetChannel = await interaction.guild.channels.fetch(selectedChannelId);

            // Send to target channel
            await targetChannel.send({ embeds: [customEmbed] });

            await channelSelection.update({
                content: `Success! Embed sent to ${targetChannel}.`,
                components: [],
                embeds: []
            });

        } catch (error) {
            console.error('Embed build error:', error);
            // Ignore timeouts
        }
    }
};
