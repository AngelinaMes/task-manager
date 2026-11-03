const express = require('express');
const tasks = require('../services/tasks');
const { statuses } = require('../services/dictionary');
const { validateTask, hasErrors } = require('../services/validation');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

const serialize = (t) => ({
  id: t.id,
  name: t.name,
  description: t.description,
  status: { id: t.status_id, name: t.status_name },
  creator: t.creator_name,
  executor: t.executor_name,
  dueDate: t.due_date,
  labels: t.labels,
  createdAt: t.created_at,
});

router.get('/tasks', async (req, res) => {
  const list = await tasks.list({
    statusId: req.query.status, executorId: req.query.executor, labelId: req.query.label,
  });
  res.json(list.map(serialize));
});

router.get('/tasks/:id', async (req, res) => {
  const task = await tasks.find(Number(req.params.id));
  if (!task) return res.status(404).json({ error: 'Задача не найдена' });
  return res.json(serialize(task));
});

router.post('/tasks', async (req, res) => {
  const errors = validateTask(req.body);
  if (hasErrors(errors)) return res.status(422).json({ errors });
  const created = await tasks.create(req.body, res.locals.currentUser.id);
  return res.status(201).json(serialize(await tasks.find(created.id)));
});

router.get('/statuses', async (req, res) => res.json(await statuses.list()));

module.exports = router;
