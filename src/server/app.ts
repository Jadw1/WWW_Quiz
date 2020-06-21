import express from 'express';
import csurf from 'csurf';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { Database, SessionDatabase } from './database';
import { IStartQuiz, IEndQuiz, IResult, IQuizResult } from './common/types';
import { IDBAnswer } from './database_types';

const SECRET = 'SEKRET ZALICZAJACY ZADANIE';

const db = new Database();
const sessionDb = new SessionDatabase();
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

app.get('/api/quizes', (req, res) => {
    db.getAllQuizes().then(async (quizes) => {
        if(req?.session?.username) {
            const solved = await db.getSolved(req?.session?.username);

            quizes.forEach(q => q.solved = solved.includes(q.id));
        }
        else {
            quizes.forEach(q => q.solved = false);
        }

        res.json(quizes);
    });
});

app.get('/play/:quizID(\\d+)', csrfProtection, (req, res) => {
    if(!req?.session?.username) {
        res.statusCode = 401;
        res.send('User not logged in.');
        return;
    }

    res.render('play', { user: req?.session?.username, csrfToken: req.csrfToken() });
});

app.get('/api/quiz/:quizID(\\d+)', csrfProtection, (req, res) => {
    if(!req?.session?.username) {
        res.statusCode = 401;
        res.send('User not logged in.');
        return;
    }

    const id = parseInt(req.params.quizID, 10);
    if(Object.is(id, NaN)) {
        res.statusCode = 400;
        res.send('Invalid quizID');
        return;
    }

    const q: IStartQuiz = {};
    db.isSolved(req?.session?.username, id).then(solved => {
        if(solved) {
            res.statusCode = 405;
            res.send('Quiz already solved.');
            return;
        }

        db.getQuiz(id).then(quiz => {
            if(quiz.questions.length === 0) {
                return -1;
            }

            q.quiz = quiz;
            return db.startQuiz(id, req?.session?.username)
        }).then(statID => {
            if(statID >= 0) {
                q.statID = statID;
            }

            res.json(q);
        });
    });
});

app.post('/api/end/:quizID(\\d+)', csrfProtection, (req, res) => {
    if(!req?.session?.username) {
        res.statusCode = 401;
        res.send('User not logged in.');
        return;
    }

    const id = parseInt(req.params.quizID, 10);
    if(Object.is(id, NaN)) {
        res.statusCode = 400;
        res.send('Invalid quizID');
        return;
    }

    const end: IEndQuiz = req.body;

    db.isSolved(req?.session?.username, id).then(solved => {
        if(solved) {
            res.statusCode = 405;
            res.send('Quiz already solved.');
            return;
        }

        db.endQuiz(end.statID, id, req?.session?.username)
        .then(async (time) => {
            const quiz = await db.getQuiz(id);

            const ans: IDBAnswer[] = [];
            let totalPenalty = 0;
            end.answers.forEach((a, i) => {
                const dbAns: IDBAnswer = {
                    qNum: i,
                    answer: a.answer,
                    correct: (a.answer === quiz.questions[i].answer),
                    time: time * a.timeFraction
                };

                if(!dbAns.correct) {
                    totalPenalty += quiz.questions[i].penalty;
                }
                ans.push(dbAns);
            });
            await db.setPenalty(end.statID, totalPenalty);

            return db.addAnswers(end.statID, ans).then(() => {
                const results: IResult[] = ans.map((a, i) => {
                    return {
                        isCorrect: a.correct,
                        correctAnswer: quiz.questions[i].answer,
                        time: a.time
                    }
                });

                const quizResult: IQuizResult = {
                    results,
                    penalty: totalPenalty,
                    time
                };

                res.json(quizResult);
            });
        });
    });
});

app.get('/api/stats', (req, res) => {
    db.getStatistics().then(stats => {
        res.json(stats);
    });
});

app.get('/api/my_stats', (req, res) => {
    if(!req?.session?.username) {
        res.statusCode = 401;
        res.send('User not logged in.');
        return;
    }

    db.getUserStat(req?.session?.username).then(stats => {
        res.json(stats);
    });
});

export { app };