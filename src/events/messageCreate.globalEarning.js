module.exports = {
    name: 'messageCreate',
    async execute(client, message) {
        // Kept intentionally as a no-op. The production XP and sparks flow now lives in
        // src/events/messageCreate.js to avoid double-crediting users.
    }
};
