import express from 'express';
import path from 'path';
import csurf from 'csurf';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { Database, SessionDatabase } from './database';
import { STATUS_CODES } from 'http';

const SECRET = 'SEKRET ZALICZAJACY ZADANIE';

const db = new Database();
const sessionDb = new SessionDatabase();
const SqliteStore = require('connect-sqlite3')(session);
const csrfProtection = csurf({cookie: true});
const app = express();
const a = new SqliteStore();

app.use(cookieParser(SECRET));
app.use(session({
    secret: SECRET,
    cookie: {maxAge: 15*60*1000},
    resave: false,
    saveUninitialized: true,
    store: a
}));
app.use(express.urlencoded({
    extended: true
}));
app.use(express.json());
app.set('view engine', 'pug');

app.use(express.static('dist/front'));
app.use(express.static('views'));

app.get('/', csrfProtection, (req, res) => {
    res.render('quiz', { user: req?.session?.username, csrfToken: req.csrfToken() });
});

app.post('/login', csrfProtection, (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    db.authUser(username, password).then(result => {
        if(result) {
            req.session.regenerate(err => {
                if(err) {
                    res.render('quiz', { showPanel: true, passErr: err });
                    return;
                }

                req.session.username = username;
                res.redirect('/');
            });
        }
        else {
            res.render('quiz', { showPanel: true, passErr: 'Invalid password.', csrfToken: req.csrfToken() });
        }
    }).catch(err => {
        if(err === 'Error: User not found.') {
            res.render('quiz', { showPanel: true, userErr: 'User not found.', csrfToken: req.csrfToken() });
        }
        else {
            res.render('quiz', { showPanel: true, passErr: err, csrfToken: req.csrfToken() });
        }
    })
});

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if(err) {
            console.error(err);
        }
        res.redirect('/');
    });
});

app.post('/change', csrfProtection, (req, res) => {
    const pass1 = req.body.pass1;
    const pass2 = req.body.pass2;
    const user = req.session.username;
    if(!user) {
        res.render('quiz', { showChangePanel: true, changeErr: 'No logged user.', user: req?.session?.username, csrfToken: req.csrfToken() });
        return;
    }
    if(pass1 !== pass2) {
        res.render('quiz', { showChangePanel: true, changeErr: 'Passwords are not the same.', user: req?.session?.username, csrfToken: req.csrfToken() });
        return;
    }

    db.changePassword(user, pass1).then(() => sessionDb.removeSessions(user)).then(() => {
        res.redirect('/');
    }).catch(err => {
        res.render('quiz', { showChangePanel: true, changeErr: err, user: req?.session?.username, csrfToken: req.csrfToken() });
    });
});

const server = app.listen(1500,() => {
    console.log(`App is running at http://localhost:1500/ in ${app.get('env')} mode`);
    console.log('Press Ctrl+C to stop.');
});