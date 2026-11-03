const db = require('../db');

// Общий модуль для справочников (статусы и метки): одинаковые операции CRUD
const makeDictionary = (table, usageCheck) => ({
  list: () => db(table).orderBy('id'),
  find: (id) => db(table).where({ id }).first(),
  create: async ({ name }) => {
    const [row] = await db(table).insert({ name: name.trim() }).returning('*');
    return row;
  },
  update: (id, { name }) => db(table).where({ id }).update({ name: name.trim(), updated_at: db.fn.now() }),
  remove: (id) => db(table).where({ id }).del(),
  isUsed: async (id) => Boolean(await usageCheck(id)),
});

const statuses = makeDictionary('statuses', (id) => db('tasks').where('status_id', id).first('id'));
const labels = makeDictionary('labels', (id) => db('task_labels').where('label_id', id).first('task_id'));

module.exports = { statuses, labels };
