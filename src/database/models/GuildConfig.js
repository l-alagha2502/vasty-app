const mongoose = require('mongoose');

const guildConfigSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    securityChannelId: { type: String, default: null },
    loggingChannelId: { type: String, default: null },
    defaultRoleId: { type: String, default: null },
    economyEnabled: { type: Boolean, default: true },
    funEnabled: { type: Boolean, default: true },
    utilitiesEnabled: { type: Boolean, default: true },
    growthEnabled: { type: Boolean, default: true },
    productivityEnabled: { type: Boolean, default: true },
    socialEnabled: { type: Boolean, default: true },
    intelligenceEnabled: { type: Boolean, default: true },
    antiNukeEnabled: { type: Boolean, default: true },
    whitelistedUsers: { type: [String], default: [] },
    joinToCreateChannelId: { type: String, default: null },
    tempVoiceCategoryId: { type: String, default: null },
    proofChannelId: { type: String, default: null },
    mediaChannelId: { type: String, default: null },
    countingChannelId: { type: String, default: null },
    lastCount: { type: Number, default: 0 },
    lastCounterId: { type: String, default: null },
    welcomeMessage: { type: String, default: 'Welcome {user} to Vast!' },
    welcomeChannelId: { type: String, default: null },
    memberRoleId: { type: String, default: null },
    botRoleId: { type: String, default: null },
    statsMemberChannelId: { type: String, default: null },
    statsMessageChannelId: { type: String, default: null },
    eventPostChannelId: { type: String, default: null },
    supportChannelId: { type: String, default: null },
    modRoleId: { type: String, default: null },
    ventChannelId: { type: String, default: null },
    staffOrdersChannelId: { type: String, default: null },
    designerRoleId: { type: String, default: null },
    founderRoleId: { type: String, default: null },
    ticketCategoryId: { type: String, default: null },
    ticketTranscriptChannelId: { type: String, default: null },
    ticketCounter: { type: Number, default: 0 },
    supportPanelMessageId: { type: String, default: null },
    totalMessages: { type: Number, default: 0 },
    newsFeedUrls: [{
        url: { type: String },
        channelId: { type: String },
        lastCheck: { type: Date, default: Date.now }
    }]
});

module.exports = mongoose.model('GuildConfig', guildConfigSchema);
