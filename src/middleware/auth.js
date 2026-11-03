const users = require('../services/users');

const loadUser = async (req, res, next) => {
  try {
    res.locals.currentUser = req.session.userId ? await users.find(req.session.userId) : null;
    res.locals.flash = req.session.flash || null;
    delete req.session.flash;
    next();
  } catch (e) {
    next(e);
  }
};

const requireAuth = (req, res, next) => {
  if (res.locals.currentUser) return next();
  if (req.originalUrl.startsWith('/api')) return res.status(401).json({ error: 'Требуется авторизация' });
  req.session.flash = { type: 'error', text: 'Сначала войдите в систему' };
  return res.redirect('/session/new');
};

const requireAdmin = (req, res, next) => {
  if (res.locals.currentUser && res.locals.currentUser.role === 'admin') return next();
  if (req.originalUrl.startsWith('/api')) return res.status(403).json({ error: 'Недостаточно прав' });
  req.session.flash = { type: 'error', text: 'Это действие доступно только администратору' };
  return res.redirect('/tasks');
};

const flash = (req, type, text) => {
  req.session.flash = { type, text };
};

module.exports = {
  loadUser, requireAuth, requireAdmin, flash,
};
