import * as db from 'sqlite3';
import * as bcrypt from 'bcrypt';
import { exit } from 'process';
import './database_types'
import { User } from './database_types';

const databaseFilename = 'database.sqlite';

class DatabaseExecutor {
    private _db: db.Database;

    constructor() {
        this._db = new db.Database(databaseFilename, (error: Error) => {
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
        this._exec = new DatabaseExecutor();
    }

    async addUser(username: string, password: string): Promise<void> {
        const saltRounds = 10;
        const sql = `
            INSERT INTO user (username, pass_hash)
            VALUES (?, ?);
        `;

        const genSalt = async (): Promise<string> => {
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

        const hashPassword = async (pass: string, salt: string): Promise<string> => {
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

        return genSalt()
            .then(salt => hashPassword(password, salt))
            .then(hash => this._exec.execRun(sql, [username, hash]));
    }

    async authUser(username: string, password: string): Promise<boolean> {
        const sql = `
            SELECT username, pass_hash as passwordHash
            FROM user
            WHERE name = ?
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

        return this._exec.execGet(sql, [username, password])
            .then(compareUser)
            .then(compareHash);
    }
}

export class DatabaseInitiator {
    private _exec: DatabaseExecutor;

    constructor() {
        this._exec = new DatabaseExecutor();
    }

    async clear(): Promise<void> {
        const sql = `
            DROP TABLE IF EXISTS user;
        `;
        return this._exec.execExec(sql);
    }

    async createTables(): Promise<void> {
        const sql = `
            CREATE TABLE user (
                username    TEXT PRIMARY KEY,
                pass_hash   TEXT NOT NULL
            );
        `;
        return this._exec.execExec(sql);
    }
}