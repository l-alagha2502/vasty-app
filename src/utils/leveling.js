const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

const milestones = {
    5: { name: 'Overseer', perms: [PermissionFlagsBits.CreatePublicThreads, PermissionFlagsBits.AddReactions, PermissionFlagsBits.UseApplicationCommands] },
    25: { name: 'Notable', perms: [PermissionFlagsBits.CreatePrivateThreads, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.UseSoundboard, PermissionFlagsBits.UseExternalEmojis] },
    50: { name: 'Ally', perms: [PermissionFlagsBits.AttachFiles, PermissionFlagsBits.BypassSlowmode, PermissionFlagsBits.MoveMembers] },
    75: { name: 'Devoted', perms: [PermissionFlagsBits.ViewAuditLog, PermissionFlagsBits.CreateGuildExpressions, PermissionFlagsBits.SendTTSMessages, PermissionFlagsBits.UseExternalSounds, PermissionFlagsBits.CreatePolls] },
    100: { name: 'Absolute', perms: [PermissionFlagsBits.ModerateMembers, PermissionFlagsBits.MuteMembers, PermissionFlagsBits.MentionEveryone, PermissionFlagsBits.ViewGuildInsights] }
};

async function handleLevelUp(member, newLevel) {
    if (!milestones[newLevel]) return;

    const milestone = milestones[newLevel];
    const guild = member.guild;

    try {
        // Find or create the milestone role
        let role = guild.roles.cache.find(r => r.name === milestone.name);
        if (!role) {
            role = await guild.roles.create({
                name: milestone.name,
                color: '#00FFFF',
                permissions: milestone.perms,
                reason: `Vast™ Legacy Milestone: Level ${newLevel}`
            });
        }

        await member.roles.add(role);

        // Announcement
        const { createChromaEmbed, CHROMA_COLORS } = require('./chroma');
        const levelEmbed = createChromaEmbed({
            title: '⭐ VAST™ LEGACY MILESTONE',
            description: `Congratulations ${member}! You have reached **Level ${newLevel}** and earned the **${milestone.name}** rank.\n\n**NEW PERMISSIONS UNLOCKED:**\n${milestone.perms.map(p => `• ${Object.keys(PermissionFlagsBits).find(key => PermissionFlagsBits[key] === p)}`).join('\n')}`,
            color: CHROMA_COLORS.GREEN
        });

        // Find a system channel or first text channel
        const channel = guild.systemChannel || guild.channels.cache.find(c => c.isTextBased());
        if (channel) await channel.send({ content: `${member}`, embeds: [levelEmbed] });

    } catch (error) {
        console.error(`[Leveling] Error granting milestone Level ${newLevel} to ${member.user.tag}:`, error);
    }
}

async function handleMilestones(member, oldLevel, newLevel) {
    const milestoneLevels = Object.keys(milestones)
        .map(Number)
        .filter(level => level > oldLevel && level <= newLevel)
        .sort((a, b) => a - b);

    for (const level of milestoneLevels) {
        await handleLevelUp(member, level);
    }
}

module.exports = { handleLevelUp, handleMilestones, milestones };
