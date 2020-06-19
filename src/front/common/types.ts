export interface QuestionTMP {
    id: number,
    question: string,
    answer: number,
    penalty: number
};

export interface QuizTMP {
    id: number,
    questions: QuestionTMP[]
};