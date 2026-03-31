const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('role')
    .setDescription('Assign or remove roles')
    .addSubcommand(s => s.setName('add').setDescription('Add a role to a user').addUserOption(o => o.setName('target').setDescription('User').setRequired(true)).addRoleOption(r => r.setName('role').setDescription('Role').setRequired(true)))
    .addSubcommand(s => s.setName('remove').setDescription('Remove a role from a user').addUserOption(o => o.setName('target').setDescription('User').setRequired(true)).addRoleOption(r => r.setName('role').setDescription('Role').setRequired(true)))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const target = interaction.options.getMember('target');
    const role = interaction.options.getRole('role');
    if (!target || !role) return interaction.reply({ content: 'User or role not found', ephemeral: true });
    if (sub === 'add') {
      await target.roles.add(role);
      interaction.reply({ content: `Added role ${role.name} to ${target.user.tag}` });
    } else {
      await target.roles.remove(role);
      interaction.reply({ content: `Removed role ${role.name} from ${target.user.tag}` });
    }
  }
};
