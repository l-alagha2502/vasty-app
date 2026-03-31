const { EmbedBuilder } = require('discord.js');

const CHROMA_COLORS = {
    GREEN: '#00FF00',
    CYAN: '#00FFFF',
    MAGENTA: '#FF00FF',
    YELLOW: '#FFFF00',
    WHITE: '#FFFFFF'
};

/**
 * Creates a Chroma Playful Brutalist style embed.
 * @param {Object} options - Embed options
 * @param {string} options.title - Embed title
 * @param {string} [options.description] - Embed description
 * @param {string} [options.color] - Hex color code (defaults to NEON GREEN)
 * @param {Array} [options.fields] - Array of field objects
 * @param {Object} [options.footer] - Footer object
 * @param {string} [options.thumbnail] - Thumbnail URL
 * @param {string} [options.image] - Image URL
 * @returns {EmbedBuilder}
 */
function createChromaEmbed({ title, description, color = CHROMA_COLORS.GREEN, fields = [], footer, thumbnail, image }) {
    const embed = new EmbedBuilder()
        .setTitle(title.toUpperCase()) // Brutalist style often uses caps
        .setColor(color)
        .setTimestamp();

    if (description) embed.setDescription(description);
    if (fields.length > 0) embed.addFields(fields);
    if (thumbnail) embed.setThumbnail(thumbnail);
    if (image) embed.setImage(image);
    
    if (footer) {
        embed.setFooter(footer);
    } else {
        embed.setFooter({ text: 'VAST™ GLOBAL ECONOMY' });
    }

    return embed;
}

module.exports = { createChromaEmbed, CHROMA_COLORS };
