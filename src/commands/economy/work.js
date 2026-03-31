const { SlashCommandBuilder } = require('discord.js');
const User = require('../../database/models/User');
const PendingWork = require('../../database/models/PendingWork');
const GuildConfig = require('../../database/models/GuildConfig');
const { createChromaEmbed, CHROMA_COLORS } = require('../../utils/chroma');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('work')
        .setDescription('Assign work to earn Sparks!'),
    async execute(interaction) {
        try {
            const now = Date.now();
            const cooldown = 3600000; // 1 hour

            const user = await User.findOne({ userId: interaction.user.id }) || new User({ userId: interaction.user.id });
            const config = await GuildConfig.findOne({ guildId: interaction.guild.id });

            if (!config || !config.proofChannelId) {
                return interaction.reply({ content: '❌ Proof channel not configured! Admins must set it in `/setup`.', ephemeral: true });
            }

            if (user.lastWorkAt && now - user.lastWorkAt.getTime() < cooldown) {
                const timeLeft = cooldown - (now - user.lastWorkAt.getTime());
                const mins = Math.floor(timeLeft / 60000);
                return interaction.reply({ content: `⏳ You're too tired! Wait **${mins}m** to work again.`, ephemeral: true });
            }

            // check if already has pending work
            const existingWork = await PendingWork.findOne({ userId: interaction.user.id, guildId: interaction.guild.id });
            if (existingWork && existingWork.expiresAt > now) {
                return interaction.reply({ content: `❌ You already have an active assignment! Post proof in <#${config.proofChannelId}>.`, ephemeral: true });
            }

            const payout = Math.floor(Math.random() * 1501) + 1000; // 1,000–2,500
            const expiresAt = new Date(now + 15 * 60000); // 15 mins

            await PendingWork.findOneAndUpdate(
                { userId: interaction.user.id, guildId: interaction.guild.id },
                { expiresAt, payout },
                { upsert: true }
            );

            user.lastWorkAt = now;
            await user.save();

            await interaction.reply({
                content: `Work assigned. Post a picture of your work in <#${config.proofChannelId}> within 15 minutes to claim your pay.`,
                ephemeral: true
            });

        } catch (error) {
            console.error('[Command: work] Error:', error);
            await interaction.reply({ content: '❌ System error!', ephemeral: true });
        }
    }
};
