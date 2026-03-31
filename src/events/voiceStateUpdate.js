const { ChannelType, PermissionFlagsBits } = require('discord.js');
const GuildConfig = require('../database/models/GuildConfig');

// In-memory cache for temporary voice channels
const tempVoiceChannels = new Set();

module.exports = {
    name: 'voiceStateUpdate',
    async execute(client, oldState, newState) {
        const { guild, member } = newState;
        if (member.user.bot) return;

        try {
            const config = await GuildConfig.findOne({ guildId: guild.id });
            if (!config || !config.joinToCreateChannelId) return;

            // 1. Join to Create logic
            if (newState.channelId === config.joinToCreateChannelId) {
                const category = config.tempVoiceCategoryId ? guild.channels.cache.get(config.tempVoiceCategoryId) : null;
                
                const tempChannel = await guild.channels.create({
                    name: `🔊 ${member.user.username}'s VC`,
                    type: ChannelType.GuildVoice,
                    parent: category?.id || null,
                    permissionOverwrites: [
                        {
                            id: member.id,
                            allow: [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.MoveMembers, PermissionFlagsBits.Connect]
                        },
                        {
                            id: guild.id, // @everyone
                            allow: [PermissionFlagsBits.Connect]
                        }
                    ]
                });

                tempVoiceChannels.add(tempChannel.id);
                await member.voice.setChannel(tempChannel);
            }

            // 2. Auto-Cleanup logic
            if (oldState.channelId && tempVoiceChannels.has(oldState.channelId)) {
                const oldChannel = oldState.channel;
                if (oldChannel && oldChannel.members.size === 0) {
                    await oldChannel.delete('Temporary VC Cleanup');
                    tempVoiceChannels.delete(oldState.channelId);
                }
            }
        } catch (error) {
            console.error('[Event: voiceStateUpdate] Error:', error);
        }
    },
};
