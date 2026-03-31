const mongoose = require('mongoose');

const pendingWorkSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    payout: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PendingWork', pendingWorkSchema);
