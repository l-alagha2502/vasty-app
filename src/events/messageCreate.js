const GuildConfig = require('../database/models/GuildConfig');
const PendingWork = require('../database/models/PendingWork');
const User = require('../database/models/User');
const { createChromaEmbed, CHROMA_COLORS } = require('../utils/chroma');
const { handleMilestones } = require('../utils/leveling');
const { updateGuildStatsDisplay } = require('../utils/stats');

function hasImageAttachment(message) {
    return message.attachments.some(attachment => {
        const type = attachment.contentType || '';
        return type.startsWith('image/');
    });
}

function hasMediaAttachment(message) {
    return message.attachments.size > 0;
}

module.exports = {
    name: 'messageCreate',
    async execute(client, message) {
        if (!message.guild || message.author.bot) return;

        try {
            const config = await GuildConfig.findOneAndUpdate(
                { guildId: message.guild.id },
                {},
                { new: true, upsert: true }
            );

            if (config.mediaChannelId === message.channel.id && !hasMediaAttachment(message)) {
                await message.delete().catch(() => null);
                return;
            }

            if (config.countingChannelId === message.channel.id) {
                const content = message.content.trim();
                const expected = (config.lastCount || 0) + 1;
                if (content !== String(expected)) {
                    await message.delete().catch(() => null);
                    return;
                }

                config.lastCount = expected;
                config.lastCounterId = message.author.id;
                await config.save();
                return;
            }

            if (config.proofChannelId === message.channel.id) {
                const pendingWork = await PendingWork.findOne({
                    guildId: message.guild.id,
                    userId: message.author.id,
                    expiresAt: { $gt: new Date() }
                });

                if (pendingWork && hasImageAttachment(message)) {
                    const user = await User.findOneAndUpdate(
                        { userId: message.author.id },
                        {},
                        { new: true, upsert: true }
                    );

                    user.sparks += pendingWork.payout;
                    await user.save();
                    await PendingWork.deleteOne({ _id: pendingWork._id });

                    const proofEmbed = createChromaEmbed({
                        title: 'Proof Validated',
                        description: `${message.author} earned **${pendingWork.payout} Sparks** for completing their proof-of-work submission.`,
                        color: CHROMA_COLORS.GREEN
                    });

                    await message.reply({ embeds: [proofEmbed] }).catch(() => null);
                }
            }

            config.totalMessages = (config.totalMessages || 0) + 1;
            await config.save();
            await updateGuildStatsDisplay(message.guild, config);

            const now = Date.now();
            let user = await User.findOne({ userId: message.author.id });
            if (!user) {
                user = new User({ userId: message.author.id });
            }

            if (user.lastMessageAt && now - user.lastMessageAt.getTime() < 10000) {
                return;
            }

            const oldLevel = user.level;
            user.xp += Math.floor(Math.random() * 21) + 10;
            user.sparks += Math.floor(Math.random() * 11) + 5;
            user.lastMessageAt = new Date(now);
            await user.save();

            if (user.level > oldLevel && message.member) {
                await handleMilestones(message.member, oldLevel, user.level);
            }
        } catch (error) {
            console.error('[Event: messageCreate] Error:', error);
        }
    }
};
