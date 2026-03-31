const User = require('../database/models/User');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        // Set interval to check VC for earning every 5 minutes
        setInterval(async () => {
            try {
                const guilds = client.guilds.cache;

                for (const [guildId, guild] of guilds) {
                    const voiceChannels = guild.channels.cache.filter(c => c.type === 2); // GuildVoice

                    for (const [channelId, channel] of voiceChannels) {
                        const members = channel.members.filter(m => !m.user.bot && !m.voice.selfMute && !m.voice.selfDeaf);

                        for (const [memberId, member] of members) {
                            // Grant Sparks to active users in VC
                            const sparksToAdd = Math.floor(Math.random() * 6) + 10; // 10-15 per 5 min

                            await User.findOneAndUpdate(
                                { userId: member.id },
                                { $inc: { sparks: sparksToAdd } },
                                { upsert: true }
                            );
                        }
                    }
                }
            } catch (error) {
                console.error('[Interval: vcEarning] Error:', error);
            }
        }, 300000); // 5 minutes
    }
};
