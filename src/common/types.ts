export interface IQuestion {
    id: number,
    question: string,
    answer?: number,
    penalty: number
};

export interface IQuiz {
    id: number,
    questions: IQuestion[],
    solved?: boolean
};

export interface IAnswer {
    answer: number;
    timeFraction: number;
};

export interface IStartQuiz {
    quiz?: IQuiz,
    statID?: number
};

export interface IEndQuiz {
    answers: IAnswer[],
    statID: number
};

export interface IResult {
    isCorrect: boolean,
    correctAnswer: number,
    time: number
};

export interface IQuizResult {
    results: IResult[],
    time: number,
    penalty: number
};

export interface IStat {
    quizID: number,
    user: string,
    time: number
};

export interface IQuestionStat {
    answer: number;
    correctAns?: number;
    time: number;
    penalty?: number;
};

export interface IQuizStat {
    quizID: number,
    questions: IQuestionStat[];
    totalTime: number;
    totalPenalty: number;
};