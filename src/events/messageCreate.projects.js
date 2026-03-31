// Additional listener for project submissions detection
const config = require('../config');
const { getStore } = require('../utils/store');

module.exports = {
  name: 'messageCreate',
  async execute(client, message) {
    if (message.author.bot || !message.guild) return;
    const store = getStore();
    const data = store.read();
    // Very naive project detection: messages in a channel named 'projects'
    if (message.channel.name === 'projects') {
      data._projects = data._projects || [];
      data._projects.push({ userId: message.author.id, userTag: message.author.tag, at: Date.now(), content: message.content, link: message.attachments.first() ? message.attachments.first().url : null });
      store.write(data);
    }
  }
};
