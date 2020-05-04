interface IQuestion {
    question: string;
    answer: number;
    penalty: number;
}

interface IStat {
    answered: boolean;
    answer: number;
    isCorrect: boolean;
    time: number;
}

class Stats {
    stats: IStat[];
    answeredCount: number;
    totalTime: number;

    constructor(length: number) {
        this.answeredCount = 0;
        this.totalTime = 0;

        this.stats = Array.from({ length }, () => (
            {
                answered: false,
                answer: null,
                isCorrect: null,
                time: 0
            } as IStat
        ));
    }
}

class Quiz {
    questions: IQuestion[];
    stats: Stats
    activeQuestion: number;
    questionStartTime: number;

    constructor(questions: IQuestion[]) {
        this.questions = questions;
        this.stats = new Stats(this.questions.length);
        this.activeQuestion = null;
        this.questionStartTime = null;
    }

    setActiveQuestion(i: number, time: number): IQuestion {
        if (i <= 0 || i > this.questions.length) {
            return null;
        }

        if (this.activeQuestion !== null && !this.stats.stats[this.activeQuestion - 1].answered) {
            this.stats.stats[this.activeQuestion - 1].time += (time - this.questionStartTime);
            this.stats.totalTime += (time - this.questionStartTime);
        }

        this.activeQuestion = i;
        this.questionStartTime = time;
        return this.questions[this.activeQuestion - 1];
    }

    answerQuestion(answer: number, time: number): boolean {
        const stat = this.stats.stats[this.activeQuestion - 1];
        if (stat.answered) {
            return null;
        }

        stat.answer = answer;
        stat.answered = true;
        stat.isCorrect = stat.answer === this.questions[this.activeQuestion - 1].answer;

        this.stats.answeredCount += 1;
        this.stats.stats[this.activeQuestion - 1].time += (time - this.questionStartTime);
        this.stats.totalTime += (time - this.questionStartTime);

        return stat.isCorrect;
    }

    nextQuestion(): number {
        let active = (this.activeQuestion - 1) + 1;
        if (active === this.questions.length) {
            active = 0;
        }
        for (let i = active; ; i++) {
            if (i === this.questions.length) {
                i = 0;
            }

            if (!this.stats.stats[i].answered) {
                return i + 1;
            }
            else if (i === active) {
                return -1;
            }

        }
    }

    remainingCount(): number {
        return this.questions.length - this.stats.answeredCount;
    }

    isAnswered(i: number) {
        return this.stats.stats[i - 1].answered;
    }
}

const quizString = `{
    "quiz": [
        {
            "question": "2 + 2",
            "answer": 4,
            "penalty": 0.5
        },
        {
            "question": "6 / 2",
            "answer": 3,
            "penalty": 1
        },
        {
            "question": "42 / 2",
            "answer": 21,
            "penalty": 3
        },
        {
            "question": "(2 + 2) / 4 + 1",
            "answer": 2,
            "penalty": 2.25
        },
        {
            "question": "35 * 24",
            "answer": 840,
            "penalty": 2.25
        },
        {
            "question": "2 - (-24 : 4)",
            "answer": 8,
            "penalty": 3
        },
        {
            "question": "(3^2 + 8) -  10 / 5",
            "answer": 15,
            "penalty": 4.5
        },
        {
            "question": "12 * 12 -  (10 / 5)^3",
            "answer": 136,
            "penalty": 4.25
        },
        {
            "question": "2 + 2 * 2",
            "answer": 6,
            "penalty": 2
        },
        {
            "question": "(2^3 * 3^2 + 5) / 7",
            "answer": 11,
            "penalty": 4.2
        }
    ]
}`;

function loadQuiz(): IQuestion[] {
    return JSON.parse(quizString).quiz as IQuestion[];
}

export { IQuestion, Quiz, IStat, Stats, loadQuiz }