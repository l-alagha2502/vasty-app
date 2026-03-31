const mongoose = require('mongoose');

const marketSchema = new mongoose.Schema({
    companyId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    currentPrice: { type: Number, required: true },
    priceHistory: { type: [Number], default: [] }
});

module.exports = mongoose.model('Market', marketSchema);
