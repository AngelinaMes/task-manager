const db = require('../db');

const baseQuery = () => db('tasks as t')
  .leftJoin('statuses as s', 's.id', 't.status_id')
  .leftJoin('users as c', 'c.id', 't.creator_id')
  .leftJoin('users as e', 'e.id', 't.executor_id')
  .select(
    't.*',
    's.name as status_name',
    db.raw("c.first_name || ' ' || c.last_name as creator_name"),
    db.raw("e.first_name || ' ' || e.last_name as executor_name"),
  );

const attachLabels = async (tasks) => {
  if (tasks.length === 0) return tasks;
  const rows = await db('task_labels as tl')
    .join('labels as l', 'l.id', 'tl.label_id')
    .whereIn('tl.task_id', tasks.map((t) => t.id))
    .select('tl.task_id', 'l.id', 'l.name');
  return tasks.map((task) => ({
    ...task,
    labels: rows.filter((r) => r.task_id === task.id).map(({ id, name }) => ({ id, name })),
  }));
};

const list = async ({
  statusId, executorId, labelId, onlyMine, userId,
} = {}) => {
  const query = baseQuery().orderBy('t.id', 'desc');
  if (statusId) query.where('t.status_id', statusId);
  if (executorId) query.where('t.executor_id', executorId);
  if (onlyMine && userId) query.where('t.creator_id', userId);
  if (labelId) {
    query.whereExists(
      db('task_labels').whereRaw('task_labels.task_id = t.id').where('label_id', labelId),
    );
  }
  return attachLabels(await query);
};

const find = async (id) => {
  const task = await baseQuery().where('t.id', id).first();
  if (!task) return null;
  const [withLabels] = await attachLabels([task]);
  return withLabels;
};

const normalize = ({
  name, description, statusId, executorId, dueDate,
}) => ({
  name: name.trim(),
  description: description ? description.trim() : null,
  status_id: Number(statusId),
  executor_id: executorId ? Number(executorId) : null,
  due_date: dueDate || null,
});

const toIds = (labelIds) => [].concat(labelIds || []).filter(Boolean).map(Number);

// Задача и её метки сохраняются в одной транзакции: либо всё, либо ничего
const create = (data, creatorId) => db.transaction(async (trx) => {
  const [task] = await trx('tasks').insert({ ...normalize(data), creator_id: creatorId }).returning('*');
  const ids = toIds(data.labelIds);
  if (ids.length) await trx('task_labels').insert(ids.map((labelId) => ({ task_id: task.id, label_id: labelId })));
  return task;
});

const update = (id, data) => db.transaction(async (trx) => {
  await trx('tasks').where({ id }).update({ ...normalize(data), updated_at: trx.fn.now() });
  await trx('task_labels').where({ task_id: id }).del();
  const ids = toIds(data.labelIds);
  if (ids.length) await trx('task_labels').insert(ids.map((labelId) => ({ task_id: id, label_id: labelId })));
});

const remove = (id) => db('tasks').where({ id }).del();

module.exports = {
  list, find, create, update, remove,
};
