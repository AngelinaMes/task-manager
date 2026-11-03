const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const required = (value) => typeof value === 'string' && value.trim().length > 0;

const validateUser = ({ firstName, lastName, email, password }, { passwordRequired = true } = {}) => {
  const errors = {};
  if (!required(firstName)) errors.firstName = 'Укажите имя';
  if (!required(lastName)) errors.lastName = 'Укажите фамилию';
  if (!EMAIL_RE.test(email || '')) errors.email = 'Некорректный email';
  if (passwordRequired || password) {
    if (!password || password.length < 6) errors.password = 'Пароль должен быть не короче 6 символов';
  }
  return errors;
};

const validateName = ({ name }) => (required(name) ? {} : { name: 'Укажите название' });

const validateTask = ({ name, statusId, dueDate }) => {
  const errors = {};
  if (!required(name)) errors.name = 'Укажите название задачи';
  if (!Number.isInteger(Number(statusId)) || Number(statusId) <= 0) errors.statusId = 'Выберите статус';
  if (dueDate && Number.isNaN(Date.parse(dueDate))) errors.dueDate = 'Некорректная дата';
  return errors;
};

const hasErrors = (errors) => Object.keys(errors).length > 0;

module.exports = {
  validateUser, validateName, validateTask, hasErrors,
};
