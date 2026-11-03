const express = require('express');
const users = require('../services/users');
const { validateUser, hasErrors } = require('../services/validation');
const { flash } = require('../middleware/auth');

const router = express.Router();

router.get('/session/new', (req, res) => res.render('login', { email: '', error: null }));

router.post('/session', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await users.authenticate(email, password);
    if (!user) {
      return res.status(422).render('login', { email, error: 'Неверный email или пароль' });
    }
    return req.session.regenerate((err) => {
      if (err) return next(err);
      req.session.userId = user.id;
      flash(req, 'success', `Добро пожаловать, ${user.first_name}!`);
      return res.redirect('/tasks');
    });
  } catch (e) {
    return next(e);
  }
});

router.delete('/session', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

router.get('/users/new', (req, res) => res.render('register', { values: {}, errors: {} }));

router.post('/users', async (req, res, next) => {
  try {
    const values = req.body;
    const errors = validateUser(values);
    if (!errors.email && await users.findByEmail(values.email)) errors.email = 'Этот email уже занят';
    if (hasErrors(errors)) return res.status(422).render('register', { values, errors });
    await users.create(values);
    flash(req, 'success', 'Регистрация прошла успешно, теперь войдите');
    return res.redirect('/session/new');
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
