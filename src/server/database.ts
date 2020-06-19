import * as db from 'sqlite3';
import * as bcrypt from 'bcrypt';
import { exit } from 'process';
import './database_types'
import { User, SessionInfo } from './database_types';
import { QuestionTMP, QuizTMP } from './common/types';

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

    constructor() {
        this._exec = new DatabaseExecutor(databaseFilename);
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

    async addQuestion(question: QuestionTMP): Promise<void> {
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

    async getAllQuizes(): Promise<QuizTMP[]> {
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

    async getQuiz(id: number): Promise<QuizTMP> {
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
            const questions: QuestionTMP[] = [];
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