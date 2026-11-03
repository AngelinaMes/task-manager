const knex = require('knex');
const { Pool, types } = require('pg');

// Тип DATE (OID 1082) отдаём строкой YYYY-MM-DD: иначе pg создаёт Date в локальном
// часовом поясе сервера и при переводе в UTC срок «сдвигается» на день назад.
types.setTypeParser(1082, (value) => value);
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
