export interface User {
    username: string;
    passwordHash: string;
}

export interface SessionInfo {
    sid: string;
    username?: string;
}

export interface IDBAnswer {
    qNum: number;
    answer: number;
    correct: boolean;
    time: number;
};