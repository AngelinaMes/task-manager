const request = require('supertest');
const app = require('../src/app');
const db = require('../src/db');

const prepareDb = async () => {
  await db.migrate.latest();
  await db.seed.run();
};

const login = async (email = 'user@example.com', password = 'user123') => {
  const agent = request.agent(app);
  await agent.post('/session').type('form').send({ email, password }).expect(302);
  return agent;
};

module.exports = {
  app, db, request, prepareDb, login,
};
