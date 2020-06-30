import * as db from 'sqlite3';
import * as bcrypt from 'bcrypt';
import { exit } from 'process';
import './database_types'
import { User, SessionInfo, IDBAnswer } from './database_types';
import { IQuestion, IQuiz, IStat, IQuizStat, IQuestionStat } from './common/types';
import { exec } from 'child_process';

const databaseFilename = 'database.sqlite';

class DatabaseExecutor {
    private _db: db.Database;

    constructor(filename: string) {
        this._db = new db.Database(filename, (error: Error) => {
            if(error) {
                console.error('Connection to database not established.');
                exit(1);
            }
        });
    }

    async execRun(sql: string, args?: any[]): Promise<void> {
        return new Promise((resolve, reject) => {
            this._db.run(sql, args, (error: Error) => {
                if(error) {
                    reject(error);
                    return;
                }
                resolve();
            });
        });
    }

    async execAll(sql: string, args?: any[]): Promise<any[]> {
        return new Promise((resolve, reject) => {
            this._db.all(sql, args, (error: Error, data: any[]) => {
                if(error) {
                    reject(error);
                    return;
                }
                resolve(data);
            });
        });
    }

    async execGet(sql: string, args?: any[]): Promise<any> {
        return new Promise((resolve, reject) => {
            this._db.get(sql, args, (error: Error, data: any) => {
                if(error) {
                    reject(error);
                    return;
                }
                resolve(data);
            });
        });
    }

    async execExec(sql: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this._db.exec(sql, (error: Error) => {
                if(error) {
                    reject(error);
                    return;
                }
                resolve();
            });
        });
    }
}

export class Database {
    private _exec: DatabaseExecutor;
    private statID: number;

    constructor() {
        this._exec = new DatabaseExecutor(databaseFilename);
        (async () => {
            this.statID = (await this._exec.execGet('SELECT ifnull(MAX(id), -1) as id FROM stat;')).id + 1;
        })();
    }

    async addUser(username: string, password: string): Promise<void> {
        const sql = `
            INSERT INTO user (username, pass_hash)
            VALUES (?, ?);
        `;

        return this.genSalt()
            .then(salt => this.hashPassword(password, salt))
            .then(hash => this._exec.execRun(sql, [username, hash]));
    }

    async authUser(username: string, password: string): Promise<boolean> {
        const sql = `
            SELECT username, pass_hash as passwordHash
            FROM user
            WHERE username = ?;
        `;

        const compareUser = async (user: User): Promise<string> => {
            return new Promise((resolve, reject) => {
                if(user === undefined) {
                    reject(new Error('User not found.'));
                }
                resolve(user.passwordHash);
            });
        }

        const compareHash = async (hash: string): Promise<boolean> => {
            return new Promise((resolve, reject) => {
                bcrypt.compare(password, hash, (err: Error, result: boolean) => {
                    if(err) {
                        reject(err);
                        return;
                    }
                    resolve(result);
                });
            });
        }

        return this._exec.execGet(sql, [username])
            .then(compareUser)
            .then(compareHash);
    }

    async changePassword(username: string, password: string): Promise<void> {
        const sql = `
            UPDATE user
            SET pass_hash = ?
            WHERE username = ?;
        `;

        return this.genSalt()
            .then(salt => this.hashPassword(password, salt))
            .then(hash => this._exec.execRun(sql, [hash, username]));
    }

    private async genSalt(): Promise<string> {
        const saltRounds = 10;
        return new Promise((resolve, reject) => {
            bcrypt.genSalt(saltRounds, (err: Error, salt: string) => {
                if(err) {
                    reject(err);
                    return;
                }
                resolve(salt);
            });
        });
    }

    private async hashPassword(pass: string, salt: string): Promise<string> {
        return new Promise((resolve, reject) => {
            bcrypt.hash(pass, salt, (err: Error, hash: string) => {
                if(err) {
                    reject(err);
                    return;
                }
                resolve(hash);
            });
        });
    }

    async addQuestion(question: IQuestion): Promise<void> {
        const sql = `
            INSERT INTO question (id, question, answer, penalty)
            VALUES (?, ?, ?, ?);
        `;

        return this._exec.execRun(sql, [question.id, question.question, question.answer, question.penalty]);
    }

    async addQuiz(quizID: number, questionsIDs: number[]): Promise<void> {
        const placeholder = questionsIDs.map(id => '(?, ?, ?)').join(', ');
        const sql = `
            INSERT INTO quiz (id, q_num, q_id)
            VALUES ` + placeholder;

        let i = 0;
        const args2D = questionsIDs.map(id => [quizID, i++, id]);
        const args = [].concat(...args2D);
        return this._exec.execRun(sql, args);
    }

    async getAllQuizes(): Promise<IQuiz[]> {
        const sql = `
            SELECT id, qu_id, question, answer, penalty
            FROM quiz
            LEFT JOIN (
                SELECT id as qu_id, question, answer, penalty
                FROM question
            )
            ON q_id = qu_id
            ORDER BY id, q_num;
        `;

        return this._exec.execAll(sql).then(rows => {
            const quizDict = rows.reduce((dict, row) => {
                if(dict[row.id] === undefined) {
                    dict[row.id] = [];
                }

                dict[row.id].push({
                    id: row.qu_id,
                    question: row.question,
                    answer: row.answer,
                    penalty: row.penalty
                });
                return dict;
            }, {});

            const result = [];
            for(const key of Object.keys(quizDict)) {
                const q = {
                    id: Number(key),
                    questions: quizDict[key]
                };
                result.push(q);
            }

            return result;
        });
    }

    async getQuiz(id: number): Promise<IQuiz> {
        const sql = `
            SELECT id, qu_id, question, answer, penalty
            FROM quiz
            LEFT JOIN (
                SELECT id as qu_id, question, answer, penalty
                FROM question
            )
            ON q_id = qu_id
            WHERE id = ?
            ORDER BY q_num;
        `;

        return this._exec.execAll(sql, [id]).then(rows => {
            const questions: IQuestion[] = [];
            rows.forEach(row => {
                questions.push({
                    id: row.qu_id,
                    question: row.question,
                    answer: row.answer,
                    penalty: row.penalty
                });
            });

            return {
                id,
                questions
            };
        });
    }

    async startQuiz(quizID: number, user: string): Promise<number> {
        const insertID = this.statID++;
        const sql = `
            INSERT INTO stat(id, quiz_id, username, start_time)
            VALUES (?, ?, ?, ?);
        `;

        return this._exec.execRun(sql, [insertID, quizID, user, Date.now()]).then(() => insertID);
    }

    async saveResults(id: number, endtime: number, quizID: number, user: string, penalty: number, answers: IDBAnswer[]): Promise<void> {
        const endQuizSql = `
            UPDATE OR ROLLBACK stat
            SET end_time = ${endtime}, penalty = ${penalty}
            WHERE id = ${id} AND quiz_id = ${quizID} AND username = '${user}';
        `;
        const placeholder = answers.map(a => `(${id}, ${a.qNum}, ${a.correct}, ${a.answer}, ${a.time})`).join(', ');
        const answersSql = `
            INSERT OR ROLLBACK INTO answer (stat_id, q_num, correct, answer, time)
            VALUES ` + placeholder + `;`;
        const sql = `
            begin;
            ${endQuizSql}
            ${answersSql}
            commit;
        `;

        return this._exec.execExec(sql);
    }

    async getSolved(user: string): Promise<number[]> {
        const sql = `
            SELECT quiz_id
            FROM stat
            WHERE username = ? AND end_time IS NOT NULL;
        `;

        return this._exec.execAll(sql, [user]).then(rows => rows.map(r => r.quiz_id));
    }

    async isSolved(user: string, quizID: number): Promise<boolean> {
        const sql = `
            SELECT id
            FROM stat
            WHERE quiz_id = ? AND username = ? AND end_time IS NOT NULL;
        `;

        return this._exec.execGet(sql, [quizID, user]).then(row => row !== undefined);
    }

    async getStatTime(statID: number): Promise<number> {
        const sql = `
            SELECT (end_time - start_time) as time
            FROM stat
            WHERE end_time IS NOT NULL AND id = ?;
        `;

        return this._exec.execGet(sql, [statID]).then(row => row.time);
    }

    async getStatistics(): Promise<IStat[]> {
        const sql = `
            SELECT quiz_id, username, (end_time - start_time) + (penalty * 1000)  as time
            FROM stat
            WHERE end_time IS NOT NULL
            ORDER BY quiz_id, time DESC;
        `;

        return this._exec.execAll(sql).then(rows => {
            const tops: IStat[] = rows.map(r => {
                return {
                    quizID: r.quiz_id,
                    user: r.username,
                    time: r.time
                };
            });

            let q = -1;
            let n = 0;
            const top5 = tops.filter(s => {
                if(q !== s.quizID) {
                    q = s.quizID;
                    n = 0;
                }

                return n++ < 5;
            });

            return top5;
        });
    }

    async getUserStat(user: string): Promise<IQuizStat[]> {
        const sql = `
            SELECT id, quiz_id, username, (end_time - start_time) as time, penalty
            FROM stat
            WHERE end_time IS NOT NULL AND username = ?
            ORDER BY quiz_id;
        `;

        const questionSql = (ids: number[]) => {
            const argsList = ids.map(_ => '?').join(', ');
            return `
                SELECT stat_id, q_num, correct, answer, time
                FROM answer
                WHERE stat_id IN (${argsList})
                ORDER BY stat_id, q_num;
            `;
        }

        return this._exec.execAll(sql, [user]).then(async (rows) => {
            if(rows.length === 0) {
                return [];
            }

            const statsID = rows.map(r => r.id);
            const answers = await this._exec.execAll(questionSql(statsID), statsID);

            const quizsID = rows.map(r => r.quiz_id);
            const quizes = (await this.getAllQuizes()).filter(q => quizsID.includes(q.id));

            const result: IQuizStat[] = [];
            const statToQuiz = [];
            for(const st of rows) {
                const stat: IQuizStat = {
                    quizID: st.quiz_id,
                    questions: [],
                    totalTime: st.time,
                    totalPenalty: st.penalty
                };
                statToQuiz[st.id] = st.quiz_id;
                result[stat.quizID] = stat;
            }

            for(const an of answers) {
                const quSt: IQuestionStat = {
                    answer: an.answer,
                    time: an.time,
                };

                result[statToQuiz[an.stat_id]].questions[an.q_num] = quSt;
            }

            for(const qu of quizes) {
                qu.questions.forEach((q, i) => {
                    result[qu.id].questions[i].correctAns = q.answer;
                    result[qu.id].questions[i].penalty = q.penalty;
                });
            }

            return result.filter(x => x);
        });
    }
}

export class DatabaseInitiator {
    private _exec: DatabaseExecutor;

    constructor() {
        this._exec = new DatabaseExecutor(databaseFilename);
    }

    async clear(): Promise<void> {
        const sql = `
            DROP TABLE IF EXISTS user;
            DROP TABLE IF EXISTS question;
            DROP TABLE IF EXISTS quiz;
            DROP TABLE IF EXISTS answer;
            DROP TABLE IF EXISTS stat;
        `;
        return this._exec.execExec(sql);
    }

    async createTables(): Promise<void> {
        const sql = `
            CREATE TABLE user (
                username    TEXT PRIMARY KEY,
                pass_hash   TEXT NOT NULL
            );

            CREATE TABLE question (
                id          INTEGER PRIMARY KEY,
                question    TEXT NOT NULL,
                answer      REAL NOT NULL,
                penalty     REAL NOT NULL
            );

            CREATE TABLE quiz (
                id          INTEGER NOT NULL,
                q_num       INTEGER NOT NULL,
                q_id        INTEGER NOT NULL,

                PRIMARY KEY(id, q_id)
                FOREIGN KEY(q_id) REFERENCES question(id)
            );

            CREATE TABLE stat (
                id          INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                quiz_id     INTEGER NOT NULL,
                username    TEXT NOT NULL,
                start_time  INTEGER NOT NULL,
                end_time    INTEGER,
                penalty     REAL,

                FOREIGN KEY(username) REFERENCES user(username)
            );

            CREATE TABLE answer (
                id		    INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                stat_id     INTEGER NOT NULL,
                q_num	    INTEGER NOT NULL,
                correct     INTEGER NOT NULL,
                answer 	    REAL NOT NULL,
                time        REAL NOT NULL,

                FOREIGN KEY(stat_id) REFERENCES stat(id)
            );
        `;
        return this._exec.execExec(sql);
    }
}

export class SessionDatabase {
    private _exec: DatabaseExecutor;

    constructor() {
        this._exec = new DatabaseExecutor('sessions');
    }

    async removeSessions(username: string) {
        const sql = `
            DELETE FROM sessions
            WHERE sess LIKE '%"username":"' || ? || '"%';
        `;

        return this._exec.execRun(sql, [username]);
    }
}