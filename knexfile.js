require('dotenv').config({ quiet: true });

const ssl = process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false;

const base = {
  client: 'pg',
  migrations: { directory: './migrations' },
  seeds: { directory: './seeds' },
  pool: { min: 0, max: 10 },
};

module.exports = {
  development: {
    ...base,
    connection: process.env.DATABASE_URL || 'postgres://taskman_owner:devpass@localhost:5432/taskman',
  },
  test: {
    ...base,
    connection: process.env.TEST_DATABASE_URL || 'postgres://taskman_owner:devpass@localhost:5432/taskman_test',
  },
  production: {
    ...base,
    connection: { connectionString: process.env.DATABASE_URL, ssl },
  },
};
