const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('voice')
    .setDescription('Create a temporary voice channel'),
  async execute(interaction) {
    const guild = interaction.guild;
    const category = interaction.channel.parent;
    const vcName = `${interaction.user.username}'s VC`;
    try {
      const channel = await guild.channels.create({
        name: vcName,
        type: 2, // GUILD_VOICE
        parent: category || null,
        permissionOverwrites: [
          {
            id: interaction.user.id,
            allow: ['ViewChannel', 'Connect', 'Speak', 'ManageChannels']
          },
          {
            id: guild.id, // @everyone role
            allow: ['Connect']
          }
        ]
      });
      await interaction.reply({ content: `Created your temporary voice channel: ${channel}`, ephemeral: true });
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: 'Failed to create voice channel.', ephemeral: true });
    }
  }
};
