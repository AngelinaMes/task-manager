-- Разграничение прав доступа к базе данных taskman.
-- Запускается от имени владельца базы (taskman_owner) после применения миграций:
--   psql "$DATABASE_URL" -v app_password="'...'" -v report_password="'...'" -f db/roles.sql

-- 1. Роль приложения: только DML (чтение/запись данных), без права менять структуру
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'taskman_app') THEN
    CREATE ROLE taskman_app LOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'taskman_readonly') THEN
    CREATE ROLE taskman_readonly LOGIN;
  END IF;
END $$;

ALTER ROLE taskman_app PASSWORD :app_password CONNECTION LIMIT 20;
ALTER ROLE taskman_readonly PASSWORD :report_password CONNECTION LIMIT 5;

-- Закрываем доступ «для всех» и выдаём права явно
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO taskman_app, taskman_readonly;

GRANT SELECT, INSERT, UPDATE, DELETE ON users, statuses, labels, tasks, task_labels, session TO taskman_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO taskman_app;

-- 2. Роль для отчётов/аналитики: только чтение и без доступа к хешам паролей
GRANT SELECT ON statuses, labels, tasks, task_labels TO taskman_readonly;
GRANT SELECT (id, first_name, last_name, email, role, created_at, updated_at) ON users TO taskman_readonly;

-- Служебные таблицы миграций не доступны никому, кроме владельца
REVOKE ALL ON knex_migrations, knex_migrations_lock FROM taskman_app, taskman_readonly;
