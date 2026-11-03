exports.up = async (knex) => {
  await knex.schema.createTable('users', (t) => {
    t.increments('id').primary();
    t.string('first_name', 100).notNullable();
    t.string('last_name', 100).notNullable();
    t.string('email', 255).notNullable().unique();
    t.string('password_digest', 255).notNullable();
    t.string('role', 20).notNullable().defaultTo('user');
    t.timestamps(true, true);
  });
  await knex.raw("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'user'))");

  await knex.schema.createTable('statuses', (t) => {
    t.increments('id').primary();
    t.string('name', 100).notNullable().unique();
    t.timestamps(true, true);
  });

  await knex.schema.createTable('labels', (t) => {
    t.increments('id').primary();
    t.string('name', 100).notNullable().unique();
    t.timestamps(true, true);
  });

  await knex.schema.createTable('tasks', (t) => {
    t.increments('id').primary();
    t.string('name', 255).notNullable();
    t.text('description');
    t.integer('status_id').notNullable().references('id').inTable('statuses').onDelete('RESTRICT');
    t.integer('creator_id').notNullable().references('id').inTable('users').onDelete('RESTRICT');
    t.integer('executor_id').references('id').inTable('users').onDelete('SET NULL');
    t.date('due_date');
    t.timestamps(true, true);
    t.index('status_id');
    t.index('executor_id');
    t.index('creator_id');
  });

  await knex.schema.createTable('task_labels', (t) => {
    t.integer('task_id').notNullable().references('id').inTable('tasks').onDelete('CASCADE');
    t.integer('label_id').notNullable().references('id').inTable('labels').onDelete('RESTRICT');
    t.primary(['task_id', 'label_id']);
    t.index('label_id');
  });

  await knex.schema.createTable('session', (t) => {
    t.string('sid').primary();
    t.json('sess').notNullable();
    t.timestamp('expire', { precision: 6 }).notNullable();
    t.index('expire', 'IDX_session_expire');
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('session');
  await knex.schema.dropTableIfExists('task_labels');
  await knex.schema.dropTableIfExists('tasks');
  await knex.schema.dropTableIfExists('labels');
  await knex.schema.dropTableIfExists('statuses');
  await knex.schema.dropTableIfExists('users');
};
