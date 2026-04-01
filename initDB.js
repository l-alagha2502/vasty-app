const { Pool } = require('pg');
    2 require('dotenv').config();
    3
    4 const pool = new Pool({
    5     connectionString: process.env.DATABASE_URL,
    6     ssl: { rejectUnauthorized: false }
    7 });
    8
    9 const initializeDatabase = async () => {
   10     const tables = `
   11         -- Global User Profiles
   12         CREATE TABLE IF NOT EXISTS users (
   13             user_id TEXT PRIMARY KEY,
   14             sparks BIGINT DEFAULT 0,
   15             xp BIGINT DEFAULT 0,
   16             level INTEGER DEFAULT 1,
   17             last_message_at TIMESTAMP,
   18             last_work_at TIMESTAMP,
   19             badges TEXT[] DEFAULT '{}',
   20             unlocked_perks TEXT[] DEFAULT '{}',
   21             owned_items TEXT[] DEFAULT '{}',
   22             showcase_url TEXT,
   23             card_background TEXT,
   24             vast_card_customization JSONB DEFAULT '{}'
   25         );
   26
   27         -- Server-Specific Configuration
   28         CREATE TABLE IF NOT EXISTS guild_configs (
   29             guild_id TEXT PRIMARY KEY,
   30             leveling_channel_id TEXT,
   31             counting_channel_id TEXT,
   32             media_channel_id TEXT,
   33             hub_channel_id TEXT,
   34             category_id TEXT,
   35             archive_category_id TEXT,
   36             proof_channel_id TEXT,
   37             vent_channel_id TEXT,
   38             staff_orders_channel_id TEXT,
   39             mod_role_id TEXT,
   40             founder_role_id TEXT,
   41             milestone_goal BIGINT DEFAULT 100000,
   42             milestone_current BIGINT DEFAULT 0,
   43             milestone_end_date TIMESTAMP
   44         );
   45
   46         -- Economy & Work Escrow
   47         CREATE TABLE IF NOT EXISTS pending_work (
   48             user_id TEXT,
   49             guild_id TEXT,
   50             expires_at TIMESTAMP,
   51             payout INTEGER,
   52             PRIMARY KEY (user_id, guild_id)
   53         );
   54
   55         CREATE TABLE IF NOT EXISTS bounties (
   56             bounty_id SERIAL PRIMARY KEY,
   57             creator_id TEXT NOT NULL,
   58             task TEXT NOT NULL,
   59             reward INTEGER NOT NULL,
   60             status TEXT DEFAULT 'OPEN'
   61         );
   62
   63         -- Shop & Content
   64         CREATE TABLE IF NOT EXISTS shop_items (
   65             item_id TEXT PRIMARY KEY,
   66             name TEXT NOT NULL,
   67             price INTEGER NOT NULL,
   68             type TEXT NOT NULL
   69         );
   70
   71         -- Security & Moderation
   72         CREATE TABLE IF NOT EXISTS blacklist (
   73             guild_id TEXT,
   74             pattern TEXT,
   75             type TEXT,
   76             PRIMARY KEY (guild_id, pattern)
   77         );
   78
   79         CREATE TABLE IF NOT EXISTS aliases (
   80             guild_id TEXT,
   81             alias_name TEXT,
   82             target_command TEXT,
   83             PRIMARY KEY (guild_id, alias_name)
   84         );
   85     `;
   86
   87     try {
   88         await pool.query(tables);
   89         console.log('⊛ [SYSTEM] VASTY™ DATABASE INITIALIZED SUCCESSFULLY.');
   90     } catch (err) {
   91         console.error('⨯ [SYSTEM] DATABASE INITIALIZATION FAILED:', err);
   92         process.exit(1);
   93     }
   94 };
   95
   96 initializeDatabase();