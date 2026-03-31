const { SlashCommandBuilder } = require('discord.js');
const User = require('../../database/models/User');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('level')
    .setDescription('View your current level and XP')
    .addUserOption(o => o.setName('user').setDescription('Target user').setRequired(false)),
  async execute(interaction) {
    const user = interaction.options.getUser('user') || interaction.user;
    const profile = await User.findOne({ userId: user.id });
    const userXp = profile ? { xp: profile.xp, level: profile.level } : { xp: 0, level: 1 };
    await interaction.reply({
      content: `${user.username} is Level **${userXp.level}** with **${userXp.xp} XP**.`
    });
  }
};
