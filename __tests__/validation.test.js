const { validateUser, validateTask, hasErrors } = require('../src/services/validation');

describe('validateUser', () => {
  test('корректные данные проходят проверку', () => {
    const errors = validateUser({
      firstName: 'Анна', lastName: 'Иванова', email: 'anna@mail.ru', password: 'secret1',
    });
    expect(hasErrors(errors)).toBe(false);
  });

  test('пустые поля и короткий пароль дают ошибки', () => {
    const errors = validateUser({
      firstName: '', lastName: ' ', email: 'bad', password: '123',
    });
    expect(Object.keys(errors).sort()).toEqual(['email', 'firstName', 'lastName', 'password']);
  });

  test('при редактировании пароль можно не указывать', () => {
    const errors = validateUser({ firstName: 'А', lastName: 'Б', email: 'a@b.ru' }, { passwordRequired: false });
    expect(errors).toEqual({});
  });
});

describe('validateTask', () => {
  test('без названия и статуса — ошибка', () => {
    expect(validateTask({ name: '', statusId: '' })).toEqual({
      name: 'Укажите название задачи', statusId: 'Выберите статус',
    });
  });

  test('некорректная дата — ошибка', () => {
    expect(validateTask({ name: 'X', statusId: '1', dueDate: 'завтра' })).toHaveProperty('dueDate');
  });
});
