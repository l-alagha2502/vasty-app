const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const store = require('../../utils/store');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Create a click-to-join giveaway')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(o => o.setName('prize').setDescription('Prize description').setRequired(true))
    .addIntegerOption(o => o.setName('winners').setDescription('Number of winners').setRequired(true))
    .addIntegerOption(o => o.setName('duration').setDescription('Duration in seconds').setRequired(true)),
  async execute(interaction, client) {
    const prize = interaction.options.getString('prize');
    const winners = interaction.options.getInteger('winners');
    const duration = interaction.options.getInteger('duration');
    const endAt = Date.now() + (duration * 1000);
    const embed = new EmbedBuilder().setTitle('Giveaway').setDescription(prize).addFields({ name: 'Winners', value: String(winners) }).setFooter({ text: `Ends at ${new Date(endAt).toLocaleString()}` });
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('giveaway_join').setLabel('Join Giveaway').setStyle(ButtonStyle.Primary)
    );
    const msg = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });
    const store = getStore();
    const data = store.read();
    data._giveaways = data._giveaways || {};
    data._giveaways[msg.id] = { channel: msg.channel.id, message: msg.id, guild: interaction.guild.id, prize, winners, endAt, entries: [] };
    store.write(data);

    // schedule end (simple setTimeout; will not persist across restarts)
    setTimeout(async () => {
      try {
        const latest = store.read();
        const g = latest._giveaways && latest._giveaways[msg.id];
        if (!g) return;
        const entries = [...new Set(g.entries)];
        if (entries.length === 0) {
          await msg.channel.send('No entries for giveaway.');
          delete latest._giveaways[msg.id];
          store.write(latest);
          return;
        }
        // pick winners
        const shuffled = entries.sort(() => 0.5 - Math.random());
        const picked = shuffled.slice(0, g.winners);
        await msg.channel.send(`Giveaway winners: ${picked.map(id => `<@${id}>`).join(', ')} — Prize: ${g.prize}`);
        delete latest._giveaways[msg.id];
        store.write(latest);
      } catch (e) { console.error(e); }
    }, duration * 1000);
  }
};
