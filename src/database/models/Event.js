const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    time: { type: Date, required: true },
    creatorId: { type: String, required: true },
    rsvps: [{ type: String }], // Array of user IDs
    messageId: { type: String }
});

module.exports = mongoose.model('Event', eventSchema);
