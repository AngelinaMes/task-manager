# Менеджер задач

[![CI](https://github.com/AngelinaMes/task-manager/actions/workflows/ci.yml/badge.svg)](https://github.com/AngelinaMes/task-manager/actions/workflows/ci.yml)
<!-- Сюда вставить бейдж Code Climate / Qlty после подключения репозитория -->

Веб-приложение для управления задачами небольшой команды. Пользователи регистрируются, создают задачи,
назначают исполнителей, ставят сроки, присваивают статусы и метки, фильтруют список задач.
Есть две роли: администратор управляет справочниками (статусы, метки), обычный пользователь работает с задачами.
Помимо веб-интерфейса есть JSON REST API.

**Деплой:** https://task-manager-XXXX.onrender.com <!-- заменить на свою ссылку -->

## Стек

| Слой | Технологии |
|---|---|
| Frontend | EJS (серверный рендеринг), HTML5, CSS3 (адаптивная вёрстка, без фреймворков) |
| Backend | Node.js 22, Express 5, express-session, bcryptjs, helmet, method-override |
| База данных | PostgreSQL 16, Knex (миграции, сиды, query builder), connect-pg-simple (сессии) |
| Тесты и качество | Jest, Supertest, ESLint, GitHub Actions |
| Деплой | Render (web service + PostgreSQL) |

## Тестовые доступы

| Роль | Логин | Пароль |
|---|---|---|
| Администратор | admin@example.com | admin123 |
| Пользователь | user@example.com | user123 |

## Запуск локально

```bash
git clone https://github.com/AngelinaMes/task-manager.git
cd task-manager
npm install
cp .env.example .env          # указать DATABASE_URL своей PostgreSQL
npm run migrate               # создать таблицы
npm run seed                  # демо-данные и тестовые пользователи
npm start                     # http://localhost:3000
```

Тесты (нужна база `taskman_test`, адрес — в `TEST_DATABASE_URL`):

```bash
npm test
npm run lint
```

## Структура

```
src/
  app.js                 — сборка приложения: middleware, сессии, маршруты
  db.js                  — подключение к PostgreSQL (Knex + пул для сессий)
  middleware/auth.js     — загрузка пользователя, проверка входа и роли
  services/              — работа с данными: users, tasks, dictionary, validation
  routes/                — маршруты: auth, users, tasks, dictionary, api
migrations/              — схема БД
seeds/                   — демо-данные
views/                   — шаблоны EJS
public/style.css         — стили, адаптив под мобильные
db/roles.sql             — роли и права доступа PostgreSQL
scripts/backup.sh        — резервное копирование (pg_dump), restore.sh — восстановление
__tests__/               — модульные и интеграционные тесты
```

## REST API

Все запросы требуют авторизации (cookie сессии).

| Метод | URL | Назначение |
|---|---|---|
| GET | `/api/tasks?status=&executor=&label=` | Список задач с фильтрами |
| GET | `/api/tasks/:id` | Одна задача |
| POST | `/api/tasks` | Создать задачу (`{ "name", "statusId", "executorId", "dueDate", "labelIds" }`) |
| GET | `/api/statuses` | Список статусов |

Пример ответа `GET /api/tasks/1`:

```json
{
  "id": 1,
  "name": "Настроить CI",
  "status": { "id": 2, "name": "В работе" },
  "creator": "Админ Демо",
  "executor": "Иван Петров",
  "dueDate": "2026-11-15",
  "labels": [{ "id": 2, "name": "feature" }]
}
```

## Безопасность базы данных

- пароли хранятся только в виде bcrypt-хешей;
- все запросы параметризованы через Knex (защита от SQL-инъекций);
- целостность: внешние ключи, `UNIQUE`, `CHECK (role IN ('admin','user'))`, транзакции при сохранении задачи с метками;
- раздельные роли PostgreSQL (`db/roles.sql`): приложение — только чтение/запись данных, роль отчётов — только чтение без хешей паролей;
- в продакшене подключение к БД по SSL, cookie сессии `httpOnly` + `secure`, заголовки безопасности через helmet;
- резервные копии: `scripts/backup.sh` (pg_dump, проверка архива, хранение 7 последних копий), восстановление — `scripts/restore.sh`.
