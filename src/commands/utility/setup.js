const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionFlagsBits,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require('discord.js');
const GuildConfig = require('../../database/models/GuildConfig');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Interactive Setup Wizard for configuring the bot')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        // Create an initial highly polished Embed
        const setupEmbed = new EmbedBuilder()
            .setTitle('⚙️ Vasty Bot - Interactive Setup Wizard')
            .setDescription('Welcome to the on-board configuration system for your server!\nThere is no web dashboard—everything is configured securely inside Discord. Click a category below to configure its settings.')
            .setColor(interaction.client.config?.colors?.primary || '#5865F2')
            .setFooter({ text: 'Vasty Bot • Administrator Setup' })
            .setTimestamp();

        // Create Button Row for categories
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('setup_security')
                .setLabel('🛡️ Security')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('setup_utilities')
                .setLabel('🛠️ Utilities')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('setup_economy')
                .setLabel('💰 Economy')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('setup_growth')
                .setLabel('📈 Growth')
                .setStyle(ButtonStyle.Primary)
        );

        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('setup_productivity')
                .setLabel('📅 Productive')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('setup_social')
                .setLabel('🎉 Social')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('setup_intelligence')
                .setLabel('🧠 Intel')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('setup_staff')
                .setLabel('👷 Staff')
                .setStyle(ButtonStyle.Danger)
        );

        // Send the message with embed and buttons
        const message = await interaction.reply({
            embeds: [setupEmbed],
            components: [row, row2],
            ephemeral: true,
            fetchReply: true
        });

        // Set up an interaction collector for the buttons
        const collector = message.createMessageComponentCollector({ time: 300000 }); // 5 minutes

        collector.on('collect', async i => {
            if (i.customId === 'setup_social') {
                const modal = new ModalBuilder()
                    .setCustomId('modal_setup_social')
                    .setTitle('🎉 Social Configuration');

                const ventChannelInput = new TextInputBuilder()
                    .setCustomId('vent_channel')
                    .setLabel('Anonymous Vent Channel ID')
                    .setPlaceholder('Enter Channel ID')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false);

                modal.addComponents(new ActionRowBuilder().addComponents(ventChannelInput));
                await i.showModal(modal);
            } else if (i.customId === 'setup_staff') {
                const modal = new ModalBuilder()
                    .setCustomId('modal_setup_staff')
                    .setTitle('👷 Staff & Orders Configuration');

                const staffChannelInput = new TextInputBuilder()
                    .setCustomId('staff_channel')
                    .setLabel('Staff Orders Channel ID')
                    .setPlaceholder('Enter Channel ID')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false);

                const designerRoleInput = new TextInputBuilder()
                    .setCustomId('designer_role')
                    .setLabel('Vast Card Designer Role ID')
                    .setPlaceholder('Enter Role ID')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false);

                modal.addComponents(
                    new ActionRowBuilder().addComponents(staffChannelInput),
                    new ActionRowBuilder().addComponents(designerRoleInput)
                );
                await i.showModal(modal);
            } else if (i.customId === 'setup_security') {
                const modal = new ModalBuilder()
                    .setCustomId('modal_setup_security_v2')
                    .setTitle('🛡️ Security & Moderation Configuration');

                const securityChannelInput = new TextInputBuilder()
                    .setCustomId('security_channel')
                    .setLabel('Secure Logging Channel ID')
                    .setPlaceholder('Alerts for Anti-Nuke')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false);

                const loggingChannelInput = new TextInputBuilder()
                    .setCustomId('logging_channel')
                    .setLabel('Advanced Logging Channel ID')
                    .setPlaceholder('Message edits/deletes')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false);

                const whitelistInput = new TextInputBuilder()
                    .setCustomId('whitelisted_users')
                    .setLabel('Whitelisted User IDs (comma separated)')
                    .setPlaceholder('123456789,987654321')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(false);

                modal.addComponents(
                    new ActionRowBuilder().addComponents(securityChannelInput),
                    new ActionRowBuilder().addComponents(loggingChannelInput),
                    new ActionRowBuilder().addComponents(whitelistInput)
                );

                await i.showModal(modal);
            } else if (i.customId === 'setup_utilities') {
                const modal = new ModalBuilder()
                    .setCustomId('modal_setup_utilities_v2')
                    .setTitle('🛠️ Utilities Configuration');

                const joinToCreateInput = new TextInputBuilder()
                    .setCustomId('join_to_create')
                    .setLabel('Join to Create VC ID')
                    .setPlaceholder('Channel ID for "Creator" VC')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false);

                const tempVoiceCategoryInput = new TextInputBuilder()
                    .setCustomId('temp_category')
                    .setLabel('Temp VC Category ID')
                    .setPlaceholder('Category ID for created VCs')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false);

                modal.addComponents(
                    new ActionRowBuilder().addComponents(joinToCreateInput),
                    new ActionRowBuilder().addComponents(tempVoiceCategoryInput)
                );

                await i.showModal(modal);
            } else if (['setup_economy', 'setup_growth', 'setup_productivity', 'setup_social', 'setup_intelligence'].includes(i.customId)) {
                
                const moduleName = i.customId.split('_')[1];
                const dbKeyMap = {
                    economy: 'economyEnabled',
                    growth: 'growthEnabled',
                    productivity: 'productivityEnabled',
                    social: 'socialEnabled',
                    intelligence: 'intelligenceEnabled'
                };
                const dbKey = dbKeyMap[moduleName];
                
                try {
                    // Fetch existing config
                    let config = await GuildConfig.findOne({ guildId: i.guild.id });
                    if (!config) {
                        config = new GuildConfig({ guildId: i.guild.id });
                    }

                    // Toggle the setting
                    config[dbKey] = !config[dbKey];
                    await config.save();
                    
                    await i.reply({ content: `✅ Successfully toggled \`${moduleName}\` to: **${config[dbKey] ? 'Enabled' : 'Disabled'}**`, ephemeral: true });
                } catch(error) {
                    console.error('Toggle Setup Error:', error);
                    await i.reply({ content: '❌ An error occurred while toggling the setting.', ephemeral: true });
                }
            }
        });

        collector.on('end', () => {
            // Disable buttons after 5 minutes
            const disabledRow = new ActionRowBuilder().addComponents(
                row.components.map(btn => ButtonBuilder.from(btn).setDisabled(true))
            );
            interaction.editReply({ components: [disabledRow] }).catch(() => {});
        });
    }
};
