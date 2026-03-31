const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    channelId: { type: String, required: true },
    userId: { type: String, required: true },
    ticketNumber: { type: Number, default: 0 },
    type: { type: String, enum: ['SUPPORT', 'REPORT'], required: true },
    claimedBy: { type: String, default: null },
    addedUserIds: { type: [String], default: [] },
    status: { type: String, enum: ['OPEN', 'CLAIMED', 'CLOSED'], default: 'OPEN' },
    transcript: { type: String, default: null },
    closedBy: { type: String, default: null },
    closedAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Ticket', ticketSchema);
