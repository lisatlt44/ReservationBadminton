var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

/**
 * Import des modules de routing
 */
var indexRouter = require('./routes/index');
var terrainsRouter = require('./routes/terrains');
var reservationsRouter = require('./routes/reservations');
var usersRouter = require('./routes/users');
var authentification = require('./routes/authentification');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.set('query parser', 'simple')

app.use(logger('dev'));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Enregistrement des routeurs
 */

app.use('/', indexRouter);
app.use('/', terrainsRouter);
app.use('/', reservationsRouter);
app.use('/', usersRouter);
app.use('/', authentification.router);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.send('Error');
});

module.exports = app;
