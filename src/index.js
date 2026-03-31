require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const { connectDatabase } = require('./database/connect');
const config = require('./config');
const path = require('path');
const fs = require('fs');

// Initialize Discord Client with necessary intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildScheduledEvents
    ],
    partials: [Partials.User, Partials.Message, Partials.GuildMember, Partials.ThreadMember],
});

// Attach global variables to client for easy access
client.commands = new Collection();
client.config = config;

// Connect to Database
connectDatabase();

// Load Commands modularly
const commandsPath = path.join(__dirname, 'commands');
let commandCount = 0;

if (fs.existsSync(commandsPath)) {
    const commandFolders = fs.readdirSync(commandsPath);

    for (const folder of commandFolders) {
        // Obey module config toggle
        if (client.config.modules[folder] === false) {
            console.log(`[Module Config] Skipping module: ${folder}`);
            continue;
        }

        const folderPath = path.join(commandsPath, folder);
        if (!fs.lstatSync(folderPath).isDirectory()) continue;

        const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const command = require(path.join(folderPath, file));
            if ('data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command);
                commandCount++;
            }
        }
    }
    console.log(`[Command Handler] Successfully loaded ${commandCount} commands.`);
}

// Load Events modularly (e.g. from src/events/)
const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
    let eventCount = 0;

    for (const file of eventFiles) {
        const event = require(path.join(eventsPath, file));
        if (event.name && event.execute) {
            if (event.once) {
                client.once(event.name, (...args) => event.execute(client, ...args));
            } else {
                client.on(event.name, (...args) => event.execute(client, ...args));
            }
            eventCount++;
        }
    }
    console.log(`[Event Handler] Successfully loaded ${eventCount} events.`);
}

// Interaction Handler for Chat Commands
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) return;

    // Per-guild module toggle check
    try {
        const GuildConfig = require('./database/models/GuildConfig');
        const config = await GuildConfig.findOne({ guildId: interaction.guild.id });
        
        // This is a simplified check. In production, mapping commands to modules is recommended.
        if (config) {
            // Logic to check config[moduleEnabled] based on command
        }
    } catch (e) { console.error('Error checking guild config:', e); }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was an error executing this command!', ephemeral: true });
        } else {
            await interaction.reply({ content: 'There was an error executing this command!', ephemeral: true });
        }
    }
});

// Login to Discord
client.login(process.env.DISCORD_TOKEN).then(() => {
    console.log(`[Client] Logged in successfully.`);
}).catch(err => {
    console.error(`[Client] Failed to login. Please check your DISCORD_TOKEN.`, err);
});

// --- GLOBAL ERROR HANDLERS (Production Stability) ---
process.on('unhandledRejection', (reason, promise) => {
    console.error('[Anti-Crash] Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err, origin) => {
    console.error('[Anti-Crash] Uncaught Exception:', err, 'origin:', origin);
});

process.on('uncaughtExceptionMonitor', (err, origin) => {
    console.error('[Anti-Crash] Uncaught Exception Monitor:', err, 'origin:', origin);
});

process.on('warning', warning => {
    console.warn('[Process Warning]', warning);
});
