const express = require('express');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const path = require('path');

const { restoreUser } = require('./auth');
const { sessionSecret } = require('./config');
// const indexRoutes = require('./routes/index');
const userRoutes = require('./routes/user');
const app = express();

app.set('view engine', 'pug');
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use(cookieParser(sessionSecret));
app.use(session({
    name: 'cryptodock.sid',
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
}));

app.use(express.urlencoded({ extended: false }));
app.use(restoreUser);
app.use('/user', userRoutes)
app.use(express.static(path.join(__dirname)));
app.use("/styles", express.static(__dirname + '/styles'));

app.use((req, res, next) => {
    const err = new Error('The requested page couldn\'t be found.');
    err.status = 404;
    next(err);
});

// Custom error handlers. 

// Error handler to log errors.
app.use((err, req, res, next) => {
    if (process.env.NODE_ENV === 'production') {
        // TODO Log the error to the database.
    } else {
        console.error(err);
    }
    next(err);
});

// Error handler for 404 errors.
app.use((err, req, res, next) => {
    if (err.status === 404) {
        res.status(404);
        res.render('page-not-found', {
            title: 'Page Not Found',
        });
    } else {
        next(err);
    }
});

// Generic error handler.
app.use((err, req, res, next) => {
    res.status(err.status || 500);
    const isProduction = process.env.NODE_ENV === 'production';
    res.render('error', {
        title: 'Server Error',
        message: isProduction ? null : err.message,
        stack: isProduction ? null : err.stack,
    });
});

module.exports = app;