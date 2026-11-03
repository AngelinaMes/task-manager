const express = require('express');
const users = require('../services/users');
const { validateUser, hasErrors } = require('../services/validation');
const { requireAuth, flash } = require('../middleware/auth');

const router = express.Router();

const canManage = (current, id) => current.role === 'admin' || current.id === id;

router.get('/users', requireAuth, async (req, res) => {
  res.render('users', { users: await users.list() });
});

router.get('/users/:id/edit', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!canManage(res.locals.currentUser, id)) {
    flash(req, 'error', 'Можно редактировать только свой профиль');
    return res.redirect('/users');
  }
  const user = await users.find(id);
  if (!user) return res.status(404).render('404');
  return res.render('user-edit', {
    user,
    values: { firstName: user.first_name, lastName: user.last_name, email: user.email },
    errors: {},
  });
});

router.patch('/users/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!canManage(res.locals.currentUser, id)) return res.redirect('/users');
  const values = req.body;
  const errors = validateUser(values, { passwordRequired: false });
  const owner = await users.findByEmail(values.email || '');
  if (!errors.email && owner && owner.id !== id) errors.email = 'Этот email уже занят';
  if (hasErrors(errors)) {
    return res.status(422).render('user-edit', { user: await users.find(id), values, errors });
  }
  await users.update(id, values);
  flash(req, 'success', 'Профиль обновлён');
  return res.redirect('/users');
});

router.delete('/users/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!canManage(res.locals.currentUser, id)) return res.redirect('/users');
  if (await users.hasTasks(id)) {
    flash(req, 'error', 'Нельзя удалить пользователя, связанного с задачами');
    return res.redirect('/users');
  }
  await users.remove(id);
  if (id === req.session.userId) return req.session.destroy(() => res.redirect('/'));
  flash(req, 'success', 'Пользователь удалён');
  return res.redirect('/users');
});

module.exports = router;
