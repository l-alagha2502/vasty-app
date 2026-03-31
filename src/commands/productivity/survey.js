const { 
    SlashCommandBuilder, 
    PermissionFlagsBits, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    ActionRowBuilder 
} = require('discord.js');
const { createChromaEmbed, CHROMA_COLORS } = require('../../utils/chroma');
const Survey = require('../../database/models/Survey');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('survey')
        .setDescription('Create a multi-question survey (Admins only)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(o => o.setName('title').setDescription('Survey Title').setRequired(true))
        .addStringOption(o => o.setName('q1').setDescription('Question 1').setRequired(true))
        .addStringOption(o => o.setName('q2').setDescription('Question 2').setRequired(false))
        .addStringOption(o => o.setName('q3').setDescription('Question 3').setRequired(false)),
    async execute(interaction) {
        const title = interaction.options.getString('title');
        const q1 = interaction.options.getString('q1');
        const q2 = interaction.options.getString('q2');
        const q3 = interaction.options.getString('q3');

        const questions = [q1];
        if (q2) questions.push(q2);
        if (q3) questions.push(q3);

        const surveyEmbed = createChromaEmbed({
            title: `SURVEY: ${title.toUpperCase()}`,
            description: `Help us improve by answering these ${questions.length} questions!\n\nClick the button below to start.`,
            color: CHROMA_COLORS.MAGENTA
        });

        const row = new ActionRowBuilder().addComponents(
            new (require('discord.js').ButtonBuilder)()
                .setCustomId(`survey_start_${interaction.id}`)
                .setLabel('START SURVEY')
                .setStyle(require('discord.js').ButtonStyle.Success)
        );

        await interaction.reply({ embeds: [surveyEmbed], components: [row] });

        // Store survey info in DB
        const newSurvey = new Survey({
            guildId: interaction.guild.id,
            title: title,
            questions: questions,
            responses: []
        });
        await newSurvey.save();

        // Modal handling will be in interactionCreate.js using survey_start_{interactionId}
    }
};
