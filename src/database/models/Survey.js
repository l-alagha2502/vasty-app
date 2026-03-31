const mongoose = require('mongoose');

const surveyResponseSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    answers: [{ 
        question: { type: String },
        answer: { type: String }
    }],
    at: { type: Date, default: Date.now }
});

const surveySchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    title: { type: String, required: true },
    questions: [{ type: String }],
    responses: [surveyResponseSchema]
});

module.exports = mongoose.model('Survey', surveySchema);
