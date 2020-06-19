export interface Question {
    id: number,
    question: string,
    answer: number,
    penalty: number
};

export interface Quiz {
    id: number,
    questions: Question[]
};