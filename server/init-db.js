import { DB_PATH, getDatabaseInfo, initializeDatabase } from './db.js';

initializeDatabase();

const info = getDatabaseInfo();

console.log('SQLite database is ready.');
console.log(`DB Path: ${DB_PATH}`);
console.log(`Users: ${info.users}`);
console.log(`Sessions: ${info.sessions}`);
console.log(`Themes: ${info.themes}`);
