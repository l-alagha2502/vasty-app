const { SlashCommandBuilder } = require('discord.js');
const Invite = require('../../database/models/Invite');
const { createChromaEmbed, CHROMA_COLORS } = require('../../utils/chroma');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('invites')
        .setDescription('Track invite stats')
        .addUserOption(o => o.setName('user').setDescription('Target user').setRequired(false)),
    async execute(interaction) {
        const user = interaction.options.getUser('user') || interaction.user;
        
        try {
            const inviteData = await Invite.find({ guildId: interaction.guild.id, inviterId: user.id });

            let total = 0, fake = 0, left = 0;
            inviteData.forEach(i => {
                total += i.total;
                fake += i.fake;
                left += i.left;
            });

            const inviteEmbed = createChromaEmbed({
                title: `${user.username.toUpperCase()}'S INVITES`,
                fields: [
                    { name: 'TOTAL', value: String(total), inline: true },
                    { name: 'FAKE', value: String(fake), inline: true },
                    { name: 'LEFT', value: String(left), inline: true },
                    { name: 'NET', value: String(total - fake - left), inline: true }
                ],
                color: CHROMA_COLORS.CYAN
            });

            await interaction.reply({ embeds: [inviteEmbed] });

        } catch (error) {
            console.error('[Command: invites] Error:', error);
            await interaction.reply({ content: '❌ There was an error while fetching your invites!', ephemeral: true });
        }
    }
};
