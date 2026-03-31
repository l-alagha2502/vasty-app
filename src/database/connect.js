const mongoose = require('mongoose');

/**
 * Connects to MongoDB using Mongoose.
 */
async function connectDatabase() {
    const mongoURI = process.env.MONGO_URI;

    if (!mongoURI) {
        console.warn('[Database] MONGO_URI is not defined in .env!');
        return;
    }

    try {
        mongoose.set('strictQuery', false);
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('[Database] Successfully connected to MongoDB!');
    } catch (error) {
        console.error('[Database] Connection Error:', error);
        process.exit(1);
    }
}

module.exports = { connectDatabase };
