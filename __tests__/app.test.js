const {
  app, db, request, prepareDb, login,
} = require('../test/helpers');

beforeEach(prepareDb);
afterAll(() => db.closeAll());

describe('авторизация', () => {
  test('главная страница открывается', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Менеджер задач');
  });

  test('регистрация нового пользователя', async () => {
    const res = await request(app).post('/users').type('form').send({
      firstName: 'Анна', lastName: 'Смирнова', email: 'Anna@Example.com', password: 'qwerty1',
    });
    expect(res.status).toBe(302);
    const user = await db('users').where({ email: 'anna@example.com' }).first();
    expect(user).toBeDefined();
    expect(user.password_digest).not.toBe('qwerty1'); // пароль хранится в виде хеша
  });

  test('повторная регистрация с тем же email запрещена', async () => {
    const res = await request(app).post('/users').type('form').send({
      firstName: 'А', lastName: 'Б', email: 'user@example.com', password: 'qwerty1',
    });
    expect(res.status).toBe(422);
    expect(res.text).toContain('Этот email уже занят');
  });

  test('вход с неверным паролем не проходит', async () => {
    const res = await request(app).post('/session').type('form').send({ email: 'user@example.com', password: 'wrong' });
    expect(res.status).toBe(422);
  });

  test('без входа список задач недоступен', async () => {
    const res = await request(app).get('/tasks');
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/session/new');
  });
});

describe('задачи', () => {
  test('список задач и фильтр по статусу', async () => {
    const agent = await login();
    const status = await db('statuses').where({ name: 'Завершена' }).first();
    const res = await agent.get(`/tasks?status=${status.id}`);
    expect(res.status).toBe(200);
    expect(res.text).toContain('Описать API');
    expect(res.text).not.toContain('Настроить CI');
  });

  test('создание задачи с метками', async () => {
    const agent = await login();
    const status = await db('statuses').first();
    const labels = await db('labels').limit(2);
    const res = await agent.post('/tasks').type('form').send({
      name: 'Новая задача', statusId: status.id, labelIds: labels.map((l) => l.id),
    });
    expect(res.status).toBe(302);
    const task = await db('tasks').where({ name: 'Новая задача' }).first();
    const links = await db('task_labels').where({ task_id: task.id });
    expect(links).toHaveLength(2);
  });

  test('невалидная задача не сохраняется', async () => {
    const agent = await login();
    const res = await agent.post('/tasks').type('form').send({ name: '' });
    expect(res.status).toBe(422);
    expect(await db('tasks').count('id as c').first()).toEqual({ c: '3' });
  });

  test('редактирование задачи', async () => {
    const agent = await login();
    const task = await db('tasks').where({ name: 'Исправить вход' }).first();
    await agent.post(`/tasks/${task.id}?_method=PATCH`).type('form')
      .send({ name: 'Исправить вход (готово)', statusId: task.status_id })
      .expect(302);
    const updated = await db('tasks').where({ id: task.id }).first();
    expect(updated.name).toBe('Исправить вход (готово)');
  });

  test('чужую задачу удалить нельзя', async () => {
    const agent = await login();
    const task = await db('tasks').where({ name: 'Настроить CI' }).first(); // автор — админ
    await agent.post(`/tasks/${task.id}?_method=DELETE`).expect(302);
    expect(await db('tasks').where({ id: task.id }).first()).toBeDefined();
  });
});

describe('справочники и роли', () => {
  test('обычный пользователь не может создать статус', async () => {
    const agent = await login();
    await agent.post('/statuses').type('form').send({ name: 'Отменена' }).expect(302);
    expect(await db('statuses').where({ name: 'Отменена' }).first()).toBeUndefined();
  });

  test('администратор создаёт статус', async () => {
    const agent = await login('admin@example.com', 'admin123');
    await agent.post('/statuses').type('form').send({ name: 'Отменена' }).expect(302);
    expect(await db('statuses').where({ name: 'Отменена' }).first()).toBeDefined();
  });

  test('используемый статус удалить нельзя', async () => {
    const agent = await login('admin@example.com', 'admin123');
    const status = await db('statuses').where({ name: 'Новая' }).first();
    await agent.post(`/statuses/${status.id}?_method=DELETE`).expect(302);
    expect(await db('statuses').where({ id: status.id }).first()).toBeDefined();
  });
});

describe('REST API', () => {
  test('без авторизации — 401', async () => {
    await request(app).get('/api/tasks').expect(401);
  });

  test('GET /api/tasks возвращает JSON', async () => {
    const agent = await login();
    const res = await agent.get('/api/tasks').expect(200);
    expect(res.body).toHaveLength(3);
    expect(res.body[0]).toHaveProperty('status.name');
  });

  test('POST /api/tasks создаёт задачу', async () => {
    const agent = await login();
    const status = await db('statuses').first();
    const res = await agent.post('/api/tasks').send({ name: 'Из API', statusId: status.id }).expect(201);
    expect(res.body.name).toBe('Из API');
  });

  test('срок задачи не сдвигается из-за часового пояса', async () => {
    const agent = await login();
    const task = await db('tasks').where({ name: 'Настроить CI' }).first();
    const res = await agent.get(`/api/tasks/${task.id}`).expect(200);
    expect(res.body.dueDate).toBe('2026-11-15');
  });

  test('POST /api/tasks с ошибкой — 422', async () => {
    const agent = await login();
    const res = await agent.post('/api/tasks').send({}).expect(422);
    expect(res.body.errors).toHaveProperty('name');
  });
});
