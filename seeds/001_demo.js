const bcrypt = require('bcryptjs');

exports.seed = async (knex) => {
  await knex('task_labels').del();
  await knex('tasks').del();
  await knex('labels').del();
  await knex('statuses').del();
  await knex('users').del();

  const digest = (p) => bcrypt.hashSync(p, 10);
  const [admin, user] = await knex('users').insert([
    { first_name: 'Админ', last_name: 'Демо', email: 'admin@example.com', password_digest: digest('admin123'), role: 'admin' },
    { first_name: 'Иван', last_name: 'Петров', email: 'user@example.com', password_digest: digest('user123'), role: 'user' },
  ]).returning('id');

  const statuses = await knex('statuses')
    .insert(['Новая', 'В работе', 'На проверке', 'Завершена'].map((name) => ({ name })))
    .returning('id');
  const labels = await knex('labels')
    .insert(['bug', 'feature', 'срочно', 'документация'].map((name) => ({ name })))
    .returning('id');

  const tasks = await knex('tasks').insert([
    { name: 'Настроить CI', description: 'Запуск тестов и линтера в GitHub Actions', status_id: statuses[1].id, creator_id: admin.id, executor_id: user.id, due_date: '2026-11-15' },
    { name: 'Исправить вход', description: 'Ошибка при пустом пароле', status_id: statuses[0].id, creator_id: user.id, executor_id: admin.id, due_date: '2026-11-10' },
    { name: 'Описать API', description: 'Добавить примеры запросов в README', status_id: statuses[3].id, creator_id: admin.id, executor_id: admin.id },
  ]).returning('id');

  await knex('task_labels').insert([
    { task_id: tasks[0].id, label_id: labels[1].id },
    { task_id: tasks[1].id, label_id: labels[0].id },
    { task_id: tasks[1].id, label_id: labels[2].id },
    { task_id: tasks[2].id, label_id: labels[3].id },
  ]);
};
