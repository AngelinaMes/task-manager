const path = require('path');
const express = require('express');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const helmet = require('helmet');
const methodOverride = require('method-override');
const db = require('./db');
const { loadUser } = require('./middleware/auth');
const { statuses, labels } = require('./services/dictionary');
const makeDictionaryRouter = require('./routes/dictionary');

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

app.set('view engine', 'ejs');
app.locals.currentUser = null;
app.locals.flash = null;
app.set('views', path.join(__dirname, '..', 'views'));
if (isProduction) app.set('trust proxy', 1);

app.use(helmet());
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(methodOverride('_method'));

app.use(session({
  store: new PgSession({
    pool: db.sessionPool,
    tableName: 'session',
    pruneSessionInterval: process.env.NODE_ENV === 'test' ? false : 60 * 15,
  }),
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true, sameSite: 'lax', secure: isProduction, maxAge: 7 * 24 * 3600 * 1000,
  },
}));
app.use(loadUser);

app.get('/', (req, res) => res.render('index'));
app.use(require('./routes/auth'));
app.use(require('./routes/users'));
app.use(require('./routes/tasks'));
app.use(makeDictionaryRouter('statuses', statuses, 'Статусы'));
app.use(makeDictionaryRouter('labels', labels, 'Метки'));
app.use('/api', require('./routes/api'));

app.use((req, res) => res.status(404).render('404'));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (process.env.NODE_ENV !== 'test') console.error(err);
  res.status(500).render('500');
});

module.exports = app;
