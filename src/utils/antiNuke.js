const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, AuditLogEvent } = require('discord.js');
const GuildConfig = require('../database/models/GuildConfig');

// In-memory cache for tracking actions
// Format: guildId: { userId: [timestamps] }
const actionCache = new Map();

// Tracked deletions and changes
const trackedActions = new Map();

/**
 * Tracks an administrative action and checks for nuke attempts.
 * @param {Guild} guild The guild where the action occurred.
 * @param {User} executor The user who performed the action.
 * @param {string} actionType The type of action (e.g., 'CHANNEL_DELETE').
 * @param {string} targetName The name of the deleted/changed target.
 */
async function trackAction(guild, executor, actionType, targetName) {
    if (!executor || executor.bot) return;

    // Check if whitelisted
    const config = await GuildConfig.findOne({ guildId: guild.id });
    if (!config || !config.antiNukeEnabled) return;
    if (config.whitelistedUsers.includes(executor.id) || executor.id === guild.ownerId) return;

    const now = Date.now();
    const guildId = guild.id;
    const userId = executor.id;

    if (!actionCache.has(guildId)) actionCache.set(guildId, new Map());
    const guildCache = actionCache.get(guildId);

    if (!guildCache.has(userId)) guildCache.set(userId, []);
    const userActions = guildCache.get(userId);

    // Filter actions within the last 10 seconds
    const recentActions = userActions.filter(timestamp => now - timestamp < 10000);
    recentActions.push(now);
    guildCache.set(userId, recentActions);

    // Track detailed log for the emergency embed
    if (!trackedActions.has(guildId)) trackedActions.set(guildId, new Map());
    const guildTracked = trackedActions.get(guildId);
    if (!guildTracked.has(userId)) guildTracked.set(userId, []);
    guildTracked.get(userId).push({ type: actionType, target: targetName, at: now });

    // Trigger Panic System if threshold reached (>3 actions in 10s)
    if (recentActions.length > 3) {
        await triggerPanic(guild, executor, config);
    }
}

/**
 * Triggers the Panic System (Anti-Nuke).
 */
async function triggerPanic(guild, executor, config) {
    try {
        const member = await guild.members.fetch(executor.id);
        
        // 1. Timeout user for 28 days
        if (member.moderatable) {
            await member.timeout(28 * 24 * 60 * 60 * 1000, 'Anti-Nuke: Rogue Moderator Detected');
        }

        // 2. Strip highest roles
        const highestRoles = member.roles.cache
            .filter(r => r.id !== guild.id && r.managed === false && r.position < guild.members.me.roles.highest.position)
            .sort((a, b) => b.position - a.position);
        
        if (highestRoles.size > 0) {
            await member.roles.remove(highestRoles, 'Anti-Nuke: Stripping roles from rogue moderator');
        }

        // 3. Send Emergency Embed
        const securityChannel = guild.channels.cache.get(config.securityChannelId);
        if (securityChannel) {
            const userHistory = trackedActions.get(guild.id)?.get(executor.id) || [];
            const actionList = userHistory.map(a => `• ${a.type}: ${a.target}`).join('\n') || 'Multiple administrative actions detected.';

            const panicEmbed = new EmbedBuilder()
                .setTitle('🚨 EMERGENCY: ANTI-NUKE TRIGGERED')
                .setDescription(`A rogue moderator has been detected and neutralized.`)
                .setColor('#ff0000')
                .addFields(
                    { name: 'Moderator', value: `${executor.tag} (${executor.id})`, inline: true },
                    { name: 'Actions Taken', value: 'User Timed Out (28d), Roles Stripped', inline: true },
                    { name: 'Recent Activity', value: actionList.length > 1024 ? actionList.substring(0, 1021) + '...' : actionList }
                )
                .setTimestamp()
                .setFooter({ text: 'Panic System active' });

            const buttons = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`nuke_restore_${executor.id}`)
                    .setLabel('RESTORE ATTEMPT')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId(`nuke_confirm_${executor.id}`)
                    .setLabel('CONFIRM DELETIONS')
                    .setStyle(ButtonStyle.Secondary)
            );

            await securityChannel.send({ embeds: [panicEmbed], components: [buttons] });
        }

        // Clear tracking for this user to avoid double triggers
        trackedActions.get(guild.id)?.delete(executor.id);
        actionCache.get(guild.id)?.delete(executor.id);

    } catch (error) {
        console.error('[Anti-Nuke] Error in triggerPanic:', error);
    }
}

/**
 * Handles high-level threats like server transfer or webhook creation.
 */
async function handleHighLevelThreat(guild, executor, reason) {
    const config = await GuildConfig.findOne({ guildId: guild.id });
    if (!config || !config.antiNukeEnabled) return;
    if (config.whitelistedUsers.includes(executor.id) || executor.id === guild.ownerId) return;

    try {
        const member = await guild.members.fetch(executor.id);
        if (member.bannable) {
            await member.ban({ reason: `Anti-Nuke: ${reason}` });
            
            const securityChannel = guild.channels.cache.get(config.securityChannelId);
            if (securityChannel) {
                const threatEmbed = new EmbedBuilder()
                    .setTitle('🛡️ HIGH-LEVEL THREAT NEUTRALIZED')
                    .setDescription(`An unauthorized critical action was attempted.`)
                    .setColor('#8b0000')
                    .addFields(
                        { name: 'User', value: `${executor.tag} (${executor.id})`, inline: true },
                        { name: 'Attempted Action', value: reason, inline: true },
                        { name: 'Status', value: 'User Banned Immediately', inline: true }
                    )
                    .setTimestamp();
                
                await securityChannel.send({ embeds: [threatEmbed] });
            }
        }
    } catch (error) {
        console.error('[Anti-Nuke] Error in handleHighLevelThreat:', error);
    }
}

module.exports = { trackAction, handleHighLevelThreat };
