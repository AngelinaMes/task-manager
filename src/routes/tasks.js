const express = require('express');
const tasks = require('../services/tasks');
const users = require('../services/users');
const { statuses, labels } = require('../services/dictionary');
const { validateTask, hasErrors } = require('../services/validation');
const { requireAuth, flash } = require('../middleware/auth');

const router = express.Router();
router.use('/tasks', requireAuth);

const formData = async () => ({
  statuses: await statuses.list(),
  users: await users.list(),
  labels: await labels.list(),
});

const toValues = (task) => ({
  name: task.name,
  description: task.description || '',
  statusId: task.status_id,
  executorId: task.executor_id || '',
  dueDate: task.due_date || '',
  labelIds: task.labels.map((l) => l.id),
});

router.get('/tasks', async (req, res) => {
  const filter = {
    statusId: req.query.status || '',
    executorId: req.query.executor || '',
    labelId: req.query.label || '',
    onlyMine: req.query.isCreatorUser === 'on',
  };
  const list = await tasks.list({ ...filter, userId: res.locals.currentUser.id });
  res.render('tasks/index', { tasks: list, filter, ...(await formData()) });
});

router.get('/tasks/new', async (req, res) => {
  res.render('tasks/form', {
    task: null, values: { labelIds: [] }, errors: {}, ...(await formData()),
  });
});

router.post('/tasks', async (req, res) => {
  const values = req.body;
  const errors = validateTask(values);
  if (hasErrors(errors)) {
    return res.status(422).render('tasks/form', {
      task: null, values: { ...values, labelIds: [].concat(values.labelIds || []).map(Number) }, errors, ...(await formData()),
    });
  }
  const task = await tasks.create(values, res.locals.currentUser.id);
  flash(req, 'success', 'Задача создана');
  return res.redirect(`/tasks/${task.id}`);
});

router.get('/tasks/:id', async (req, res) => {
  const task = await tasks.find(Number(req.params.id));
  if (!task) return res.status(404).render('404');
  return res.render('tasks/show', { task });
});

router.get('/tasks/:id/edit', async (req, res) => {
  const task = await tasks.find(Number(req.params.id));
  if (!task) return res.status(404).render('404');
  return res.render('tasks/form', {
    task, values: toValues(task), errors: {}, ...(await formData()),
  });
});

router.patch('/tasks/:id', async (req, res) => {
  const id = Number(req.params.id);
  const task = await tasks.find(id);
  if (!task) return res.status(404).render('404');
  const values = req.body;
  const errors = validateTask(values);
  if (hasErrors(errors)) {
    return res.status(422).render('tasks/form', {
      task, values: { ...values, labelIds: [].concat(values.labelIds || []).map(Number) }, errors, ...(await formData()),
    });
  }
  await tasks.update(id, values);
  flash(req, 'success', 'Задача обновлена');
  return res.redirect(`/tasks/${id}`);
});

router.delete('/tasks/:id', async (req, res) => {
  const id = Number(req.params.id);
  const task = await tasks.find(id);
  const user = res.locals.currentUser;
  if (task && (task.creator_id === user.id || user.role === 'admin')) {
    await tasks.remove(id);
    flash(req, 'success', 'Задача удалена');
  } else {
    flash(req, 'error', 'Удалить задачу может только её автор');
  }
  res.redirect('/tasks');
});

module.exports = router;
