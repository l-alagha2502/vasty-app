# Vasty Bot - The Ultimate All-in-One Discord Bot

Welcome to **Vasty Bot**, a comprehensive, scalable, and highly modular Discord bot designed to replace up to 21 premium bots. Built with Node.js, Discord.js (v14+), and MongoDB, this bot handles everything from advanced anti-nuke security and moderation to complex economy, leveling, scheduling, and analytics.

## 🚀 Ultimate Vision

- **Security & Anti-Nuke:** Unparalleled server protection, auto-banning malicious actors, and protecting channels/roles.
- **Moderation:** Advanced logging, warning systems, timeouts, and automod integrations.
- **Economy:** Global or server-based economy, shops, trading, and daily rewards.
- **Utility & Tickets:** Powerful ticket system, reaction roles, scheduling, and server analytics.
- **Fun & Engagement:** Leveling, XP, giveaways, and interactive mini-games.

## 📁 Infrastructure & Modularity

The bot is designed with a **Smart Command & Event Handler** that dynamically loads commands from subfolders. It also features a toggleable module system, allowing server owners to disable entire categories if they don't need them.

## 📜 Full Command List

### 🛡️ Security & Moderation
- `/setup` - Interactive Setup Wizard to configure logging, anti-nuke, and modules.
- `/mod ban [user] [reason]` - Ban a member.
- `/mod kick [user] [reason]` - Kick a member.
- `/mod warn [user] [reason]` - Warn a member.
- `/mod timeout [user] [duration] [reason]` - Timeout a member.
- `/mod clear [amount]` - Mass-delete messages (up to 100).
- `/role add [user] [role]` - Assign a role.
- `/role remove [user] [role]` - Remove a role.
- `/logs projects` - Retrieve recent project submissions.

### 💰 Economy & Engagement
- `/work` - Perform a job to earn Sparks (4h cooldown).
- `/invest prices` - Check the current share prices of Vast companies.
- `/invest buy [company] [amount]` - Buy shares in a company.
- `/invest sell [company] [amount]` - Sell your shares.
- `/store list` - Browse the global store.
- `/store buy [item]` - Purchase perks, badges, or the Vast Card.
- `/vastcard` - View your global profile card (XP, level, sparks, investments).
- `/level [user]` - View current level and XP.

### 📈 Growth & Tracking
- `/invites [user]` - Show total, fake, and left invites.
- `/vote` - Get the link to vote for Vasty on Top.gg and earn rewards.

### 📅 Productivity & Events
- `/event` - Schedule a server event with RSVPs and local timezone help.
- `/study` - Start a 25-minute Pomodoro focus session.
- `/survey [title] [q1] [q2] [q3]` - Create a multi-question survey for members.

### 🎉 Social & Fun
- `/trivia` - Answer a random question to earn 10 Sparks.
- `/giveaway [prize] [duration] [winners]` - Create a button-based giveaway.
- `/quote [message_id]` - Turn any message into a beautiful Chroma quote embed.
- `/vent [message]` - Send an anonymous message to the vent channel.

### 🧠 Intelligence & Information
- `/ask [query]` - Chat with Vast AI (Leo) for advice or help.
- `/news add [url] [channel]` - Configure an RSS news feed.
- `/news list` - Show active news feeds.

### 🛠️ Utility
- `/ping` - Check bot latency and API status.
- `/ticket create [reason]` - Open a support ticket.
- `/ticket close` - Close an existing ticket channel.
- `/voice` - Create a temporary voice channel.
- `/build-embed` - Open the interactive custom embed builder.

## 🛠️ Setup & Installation

Follow these steps to set up the development environment:

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: A local MongoDB instance or a free cluster on MongoDB Atlas
- **Git**: For version control

### 2. Install Dependencies
Clone the repository and install the required packages:
```bash
npm install discord.js mongoose dotenv colors
```

### 3. Environment Variables
Create a `.env` file in the root directory and configure the following variables:
```env
# Bot Configuration
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_bot_client_id_here
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/vastybot
```

### 4. Start the Bot
Run the bot using Node:
```bash
node src/index.js
```
*(For development, it is recommended to use `nodemon`)*

## 📂 Folder Structure
- `src/index.js` - Main entry point
- `src/config.js` - Global configurations and module toggles
- `src/handlers/` - Dynamic command and event loaders
- `src/database/` - MongoDB connection logic
- `src/commands/` - Bot commands split by category
- `src/events/` - Discord event listeners
- `src/utils/` - Shared utilities (Chroma embeds, AI, Anti-Nuke)
