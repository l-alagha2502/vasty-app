const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mod')
    .setDescription('Moderation actions: ban/kick/warn/timeout/clear')
    .addSubcommand(s => s.setName('ban').setDescription('Ban a user').addUserOption(o => o.setName('target').setDescription('User to ban').setRequired(true)).addStringOption(o => o.setName('reason').setDescription('Reason')))
    .addSubcommand(s => s.setName('kick').setDescription('Kick a user').addUserOption(o => o.setName('target').setDescription('User to kick').setRequired(true)).addStringOption(o => o.setName('reason').setDescription('Reason')))
    .addSubcommand(s => s.setName('warn').setDescription('Warn a user').addUserOption(o => o.setName('target').setDescription('User to warn').setRequired(true)).addStringOption(o => o.setName('reason').setDescription('Reason')))
    .addSubcommand(s => s.setName('timeout').setDescription('Timeout a user').addUserOption(o => o.setName('target').setDescription('User to timeout').setRequired(true)).addIntegerOption(o => o.setName('duration').setDescription('Duration in minutes').setRequired(true)).addStringOption(o => o.setName('reason').setDescription('Reason')))
    .addSubcommand(s => s.setName('clear').setDescription('Mass-delete messages').addIntegerOption(o => o.setName('amount').setDescription('Amount of messages to delete (1-100)').setMinValue(1).setMaxValue(100).setRequired(true)))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers | PermissionFlagsBits.KickMembers | PermissionFlagsBits.ModerateMembers | PermissionFlagsBits.ManageMessages),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const reason = interaction.options.getString('reason') || 'No reason provided';
    
    if (sub === 'clear') {
        const amount = interaction.options.getInteger('amount');
        await interaction.channel.bulkDelete(amount, true);
        return interaction.reply({ content: `✅ Deleted ${amount} messages.`, ephemeral: true });
    }

    const target = interaction.options.getUser('target');
    const member = interaction.guild.members.cache.get(target.id);
    if (!member && sub !== 'warn') return interaction.reply({ content: 'Member not found', ephemeral: true });

    if (sub === 'ban') {
      if (!member.bannable) return interaction.reply({ content: 'I cannot ban this user.', ephemeral: true });
      await member.ban({ reason });
      interaction.reply({ content: `🚫 ${target.tag} was banned. Reason: ${reason}` });
    } else if (sub === 'kick') {
      if (!member.kickable) return interaction.reply({ content: 'I cannot kick this user.', ephemeral: true });
      await member.kick(reason);
      interaction.reply({ content: `👢 ${target.tag} was kicked. Reason: ${reason}` });
    } else if (sub === 'timeout') {
      const duration = interaction.options.getInteger('duration');
      if (!member.moderatable) return interaction.reply({ content: 'I cannot timeout this user.', ephemeral: true });
      await member.timeout(duration * 60 * 1000, reason);
      interaction.reply({ content: `⏳ ${target.tag} was timed out for ${duration} minutes. Reason: ${reason}` });
    } else if (sub === 'warn') {
      const store = require('../../utils/store');
      const data = store.get();
      data._warns = data._warns || {};
      data._warns[target.id] = data._warns[target.id] || [];
      data._warns[target.id].push({ by: interaction.user.id, reason, at: Date.now() });
      store.set(data);
      interaction.reply({ content: `⚠️ ${target.tag} was warned. Reason: ${reason}` });
    }
  }
};
