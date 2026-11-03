const bcrypt = require('bcryptjs');
const db = require('../db');

const PUBLIC_FIELDS = ['id', 'first_name', 'last_name', 'email', 'role', 'created_at'];

const list = () => db('users').select(PUBLIC_FIELDS).orderBy('id');

const find = (id) => db('users').select(PUBLIC_FIELDS).where({ id }).first();

const findByEmail = (email) => db('users').where({ email: email.toLowerCase() }).first();

const create = async ({ firstName, lastName, email, password, role = 'user' }) => {
  const [user] = await db('users')
    .insert({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim().toLowerCase(),
      password_digest: await bcrypt.hash(password, 10),
      role,
    })
    .returning(PUBLIC_FIELDS);
  return user;
};

const update = async (id, { firstName, lastName, email, password }) => {
  const data = {
    first_name: firstName.trim(),
    last_name: lastName.trim(),
    email: email.trim().toLowerCase(),
    updated_at: db.fn.now(),
  };
  if (password) data.password_digest = await bcrypt.hash(password, 10);
  await db('users').where({ id }).update(data);
};

const remove = (id) => db('users').where({ id }).del();

const hasTasks = async (id) => {
  const row = await db('tasks').where('creator_id', id).orWhere('executor_id', id).first('id');
  return Boolean(row);
};

const authenticate = async (email, password) => {
  const user = await findByEmail(email || '');
  if (!user) return null;
  const ok = await bcrypt.compare(password || '', user.password_digest);
  return ok ? find(user.id) : null;
};

const fullName = (u) => (u ? `${u.first_name} ${u.last_name}` : '—');

module.exports = {
  list, find, findByEmail, create, update, remove, hasTasks, authenticate, fullName,
};
