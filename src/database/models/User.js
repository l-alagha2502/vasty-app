const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema({
    companyId: { type: String, required: true },
    shares: { type: Number, default: 0 }
});

const userSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    sparks: { type: Number, default: 0 },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    lastMessageAt: { type: Date, default: null },
    lastWorkAt: { type: Date, default: null },
    investments: { type: [investmentSchema], default: [] },
    badges: { type: [String], default: [] },
    unlockedPerks: { type: [String], default: [] },
    ownedItems: { type: [String], default: [] },
    vastCardCustomization: {
        type: Map,
        of: String,
        default: {}
    }
});

// Middleware to calculate level based on XP
userSchema.pre('save', function(next) {
    if (this.isModified('xp')) {
        // level = floor(0.1 * sqrt(xp)) + 1
        this.level = Math.floor(0.1 * Math.sqrt(this.xp)) + 1;
    }
    next();
});

module.exports = mongoose.model('User', userSchema);
