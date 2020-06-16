import express from 'express';
import path from 'path';
import csurf from 'csurf';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { Database } from './database';

const SECRET = 'SEKRET ZALICZAJACY ZADANIE';

const db = new Database();
const SqliteStore = require('connect-sqlite3')(session);
const csrfProtection = csurf({cookie: true});
const app = express();

app.use(cookieParser(SECRET));
app.use(session({
    secret: SECRET,
    cookie: {maxAge: 15*60*1000},
    resave: false,
    saveUninitialized: true,
    store: new SqliteStore()
}));
app.use(express.urlencoded({
    extended: true
}));
app.use(express.json());

app.use(express.static('dist/front'));
app.use(express.static('views'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../views', 'quiz.html'));
});

app.get('/api/username', (req, res) => {
    res.write("test");
    res.end();
});

app.post('/api/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    db.authUser(username, password).then(result => {
        if(result) {
            
        }
    })
})

const server = app.listen(1500,() => {
    console.log(`App is running at http://localhost:1500/ in ${app.get('env')} mode`);
    console.log('Press Ctrl+C to stop.');
})