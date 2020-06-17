export interface User {
    username: string;
    passwordHash: string;
}

export interface SessionInfo {
    sid: string;
    username?: string;
}