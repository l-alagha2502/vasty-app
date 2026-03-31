const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('logs')
    .setDescription('Retrieve logs or projects submissions')
    .addSubcommand(s => s.setName('projects').setDescription('Show recent project submissions')),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const store = require('../utils/store').getStore();
    const data = store.read();
    if (sub === 'projects') {
      const projects = data._projects || [];
      if (projects.length === 0) return interaction.reply({ content: 'No project submissions logged.', ephemeral: true });
      const lines = projects.slice(-10).map(p => `${p.userTag} at ${new Date(p.at).toLocaleString()}: ${p.link || p.desc || 'no description'}`);
      interaction.reply({ content: lines.join('\n'), ephemeral: true });
    }
  }
};
