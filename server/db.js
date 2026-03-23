import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const defaultDataDir = path.join(__dirname, 'data');
export const dataDir = process.env.DATA_DIR || process.env.APP_DATA_DIR || defaultDataDir;
export const DB_PATH = process.env.DB_PATH || path.join(dataDir, 'ventoy.db');

const usersFile = path.join(dataDir, 'users.json');
const themesFile = path.join(dataDir, 'themes.json');
const sessionsFile = path.join(dataDir, 'sessions.json');
const settingsFile = path.join(dataDir, 'settings.json');

export const DEFAULT_SETTINGS = {
  siteTitle: 'Ventoy Pro',
  siteSubtitle: 'Advanced Theme Generator',
  logoUrl: '',
  logoText: 'VP',
};

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

function readJsonFile(filePath, fallbackValue) {
  try {
    if (!fs.existsSync(filePath)) {
      return fallbackValue;
    }

    const raw = fs.readFileSync(filePath, 'utf8');
    return raw ? JSON.parse(raw) : fallbackValue;
  } catch (error) {
    console.error(`Failed to read ${filePath}:`, error);
    return fallbackValue;
  }
}

function safeParseJson(value, fallbackValue) {
  try {
    return value ? JSON.parse(value) : fallbackValue;
  } catch (error) {
    return fallbackValue;
  }
}

function ensureSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS themes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      preview_image TEXT NOT NULL,
      config_json TEXT NOT NULL,
      custom_icon_types_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      owner_id TEXT NOT NULL,
      owner_name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_themes_owner_id ON themes(owner_id);
    CREATE INDEX IF NOT EXISTS idx_themes_created_at ON themes(created_at);
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
  `);
}

function migrateJsonIfNeeded() {
  const userCount = db.prepare('SELECT COUNT(*) AS count FROM users').get().count;
  if (userCount === 0) {
    const users = readJsonFile(usersFile, []);
    const insertUser = db.prepare(`
      INSERT OR REPLACE INTO users (id, username, role, password_salt, password_hash, created_at)
      VALUES (@id, @username, @role, @passwordSalt, @passwordHash, @createdAt)
    `);

    for (const user of users) {
      if (!user?.id || !user?.username) {
        continue;
      }

      insertUser.run({
        id: user.id,
        username: user.username,
        role: user.role || 'user',
        passwordSalt: user.passwordSalt || '',
        passwordHash: user.passwordHash || '',
        createdAt: user.createdAt || new Date().toISOString(),
      });
    }
  }

  const sessionCount = db.prepare('SELECT COUNT(*) AS count FROM sessions').get().count;
  if (sessionCount === 0) {
    const sessions = readJsonFile(sessionsFile, []);
    const insertSession = db.prepare(`
      INSERT OR REPLACE INTO sessions (token, user_id, created_at)
      VALUES (@token, @userId, @createdAt)
    `);

    for (const session of sessions) {
      if (!session?.token || !session?.userId) {
        continue;
      }

      insertSession.run({
        token: session.token,
        userId: session.userId,
        createdAt: session.createdAt || new Date().toISOString(),
      });
    }
  }

  const themeCount = db.prepare('SELECT COUNT(*) AS count FROM themes').get().count;
  if (themeCount === 0) {
    const themes = readJsonFile(themesFile, []);
    const insertTheme = db.prepare(`
      INSERT OR REPLACE INTO themes (
        id, name, preview_image, config_json, custom_icon_types_json, created_at, owner_id, owner_name
      ) VALUES (
        @id, @name, @previewImage, @configJson, @customIconTypesJson, @createdAt, @ownerId, @ownerName
      )
    `);

    for (const theme of themes) {
      if (!theme?.id || !theme?.name) {
        continue;
      }

      insertTheme.run({
        id: theme.id,
        name: theme.name,
        previewImage: theme.previewImage || '',
        configJson: JSON.stringify(theme.config || {}),
        customIconTypesJson: JSON.stringify(theme.customIconTypes || []),
        createdAt: theme.createdAt || new Date().toISOString(),
        ownerId: theme.ownerId || '',
        ownerName: theme.ownerName || 'unknown',
      });
    }
  }

  const settingCount = db.prepare('SELECT COUNT(*) AS count FROM settings').get().count;
  if (settingCount === 0) {
    const settings = {
      ...DEFAULT_SETTINGS,
      ...readJsonFile(settingsFile, DEFAULT_SETTINGS),
    };

    const insertSetting = db.prepare(`
      INSERT OR REPLACE INTO settings (key, value)
      VALUES (?, ?)
    `);

    for (const [key, value] of Object.entries(settings)) {
      insertSetting.run(key, JSON.stringify(value));
    }
  }
}

export function initializeDatabase() {
  ensureSchema();
  migrateJsonIfNeeded();

  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)').run(key, JSON.stringify(value));
  }

  return DB_PATH;
}

initializeDatabase();

export function getUsers() {
  return db.prepare(`
    SELECT
      id,
      username,
      role,
      password_salt AS passwordSalt,
      password_hash AS passwordHash,
      created_at AS createdAt
    FROM users
    ORDER BY created_at ASC
  `).all();
}

export function saveUsers(users) {
  const replaceUsers = db.transaction((nextUsers) => {
    db.prepare('DELETE FROM users').run();

    const insertUser = db.prepare(`
      INSERT INTO users (id, username, role, password_salt, password_hash, created_at)
      VALUES (@id, @username, @role, @passwordSalt, @passwordHash, @createdAt)
    `);

    for (const user of nextUsers) {
      insertUser.run({
        id: user.id,
        username: user.username,
        role: user.role,
        passwordSalt: user.passwordSalt,
        passwordHash: user.passwordHash,
        createdAt: user.createdAt,
      });
    }
  });

  replaceUsers(users);
}

export function getSessions() {
  return db.prepare(`
    SELECT
      token,
      user_id AS userId,
      created_at AS createdAt
    FROM sessions
    ORDER BY created_at ASC
  `).all();
}

export function saveSessions(sessions) {
  const replaceSessions = db.transaction((nextSessions) => {
    db.prepare('DELETE FROM sessions').run();

    const insertSession = db.prepare(`
      INSERT INTO sessions (token, user_id, created_at)
      VALUES (@token, @userId, @createdAt)
    `);

    for (const session of nextSessions) {
      insertSession.run({
        token: session.token,
        userId: session.userId,
        createdAt: session.createdAt,
      });
    }
  });

  replaceSessions(sessions);
}

export function getThemes() {
  return db.prepare(`
    SELECT
      id,
      name,
      preview_image AS previewImage,
      config_json AS configJson,
      custom_icon_types_json AS customIconTypesJson,
      created_at AS createdAt,
      owner_id AS ownerId,
      owner_name AS ownerName
    FROM themes
    ORDER BY created_at DESC
  `).all().map((theme) => ({
    id: theme.id,
    name: theme.name,
    previewImage: theme.previewImage,
    config: safeParseJson(theme.configJson, {}),
    customIconTypes: safeParseJson(theme.customIconTypesJson, []),
    createdAt: theme.createdAt,
    ownerId: theme.ownerId,
    ownerName: theme.ownerName,
  }));
}

export function saveThemes(themes) {
  const replaceThemes = db.transaction((nextThemes) => {
    db.prepare('DELETE FROM themes').run();

    const insertTheme = db.prepare(`
      INSERT INTO themes (
        id, name, preview_image, config_json, custom_icon_types_json, created_at, owner_id, owner_name
      ) VALUES (
        @id, @name, @previewImage, @configJson, @customIconTypesJson, @createdAt, @ownerId, @ownerName
      )
    `);

    for (const theme of nextThemes) {
      insertTheme.run({
        id: theme.id,
        name: theme.name,
        previewImage: theme.previewImage,
        configJson: JSON.stringify(theme.config || {}),
        customIconTypesJson: JSON.stringify(theme.customIconTypes || []),
        createdAt: theme.createdAt,
        ownerId: theme.ownerId,
        ownerName: theme.ownerName,
      });
    }
  });

  replaceThemes(themes);
}

export function getSettings() {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const settings = { ...DEFAULT_SETTINGS };

  for (const row of rows) {
    settings[row.key] = safeParseJson(row.value, row.value);
  }

  return settings;
}

export function saveSettings(settings) {
  const replaceSettings = db.transaction((nextSettings) => {
    const insertSetting = db.prepare(`
      INSERT INTO settings (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);

    for (const [key, value] of Object.entries(nextSettings)) {
      insertSetting.run(key, JSON.stringify(value));
    }
  });

  replaceSettings(settings);
}

export function getDatabaseInfo() {
  return {
    path: DB_PATH,
    users: db.prepare('SELECT COUNT(*) AS count FROM users').get().count,
    sessions: db.prepare('SELECT COUNT(*) AS count FROM sessions').get().count,
    themes: db.prepare('SELECT COUNT(*) AS count FROM themes').get().count,
  };
}

export { db };
