const knex = require('knex');
const { Pool } = require('pg');
const config = require('../knexfile');

const env = process.env.NODE_ENV || 'development';
const { connection } = config[env];

const db = knex(config[env]);

// Отдельный небольшой пул для хранилища сессий (connect-pg-simple)
db.sessionPool = new Pool(typeof connection === 'string' ? { connectionString: connection, max: 3 } : { ...connection, max: 3 });

db.closeAll = async () => {
  await db.sessionPool.end();
  await db.destroy();
};

module.exports = db;
