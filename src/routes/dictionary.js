const express = require('express');
const { validateName, hasErrors } = require('../services/validation');
const { requireAuth, requireAdmin, flash } = require('../middleware/auth');

// Один роутер для двух справочников: /statuses и /labels
module.exports = (path, service, title) => {
  const router = express.Router();

  router.get(`/${path}`, requireAuth, async (req, res) => {
    res.render('dictionary', {
      path, title, items: await service.list(), values: {}, errors: {}, editing: null,
    });
  });

  router.post(`/${path}`, requireAdmin, async (req, res) => {
    const errors = validateName(req.body);
    if (hasErrors(errors)) {
      return res.status(422).render('dictionary', {
        path, title, items: await service.list(), values: req.body, errors, editing: null,
      });
    }
    try {
      await service.create(req.body);
      flash(req, 'success', 'Запись создана');
    } catch (e) {
      if (e.code !== '23505') throw e; // нарушение уникальности
      flash(req, 'error', 'Запись с таким названием уже есть');
    }
    return res.redirect(`/${path}`);
  });

  router.patch(`/${path}/:id`, requireAdmin, async (req, res) => {
    const errors = validateName(req.body);
    if (!hasErrors(errors)) {
      await service.update(Number(req.params.id), req.body);
      flash(req, 'success', 'Запись обновлена');
    } else {
      flash(req, 'error', errors.name);
    }
    res.redirect(`/${path}`);
  });

  router.delete(`/${path}/:id`, requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (await service.isUsed(id)) {
      flash(req, 'error', 'Нельзя удалить: запись используется в задачах');
    } else {
      await service.remove(id);
      flash(req, 'success', 'Запись удалена');
    }
    res.redirect(`/${path}`);
  });

  return router;
};
