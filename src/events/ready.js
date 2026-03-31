const GuildConfig = require('../database/models/GuildConfig');
const PendingWork = require('../database/models/PendingWork');
const { updateGuildStatsDisplay } = require('../utils/stats');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(`Logged in as ${client.user.tag}`);

        client.invites = new Map();

        for (const guild of client.guilds.cache.values()) {
            try {
                const invites = await guild.invites.fetch();
                client.invites.set(guild.id, new Map(invites.map(invite => [invite.code, invite.uses])));
            } catch (error) {
                console.warn(`[Ready] Invite cache failed for guild ${guild.id}:`, error.message);
            }

            const config = await GuildConfig.findOne({ guildId: guild.id });
            if (config) {
                await updateGuildStatsDisplay(guild, config);
            }
        }

        setInterval(async () => {
            try {
                await PendingWork.deleteMany({ expiresAt: { $lte: new Date() } });
            } catch (error) {
                console.error('[Ready] Pending work cleanup failed:', error);
            }
        }, 60 * 1000);

        setInterval(async () => {
            try {
                const configs = await GuildConfig.find({
                    $or: [
                        { statsMemberChannelId: { $ne: null } },
                        { statsMessageChannelId: { $ne: null } }
                    ]
                });

                for (const config of configs) {
                    const guild = client.guilds.cache.get(config.guildId);
                    if (guild) {
                        await updateGuildStatsDisplay(guild, config);
                    }
                }
            } catch (error) {
                console.error('[Ready] Stat refresh failed:', error);
            }
        }, 5 * 60 * 1000);
    }
};
