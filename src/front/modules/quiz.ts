import { QuestionTMP, IAnswer, IStartQuiz } from './../common/types'

interface IStat {
    answered: boolean;
    answer: number;
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
    questions: QuestionTMP[];
    stats: Stats
    activeQuestion: number;
    questionStartTime: number;
    statID: number;

    constructor(quiz: IStartQuiz) {
        this.questions = quiz.quiz.questions;
        this.statID = quiz.statID;
        this.stats = new Stats(this.questions.length);
        this.activeQuestion = null;
        this.questionStartTime = null;
    }

    setActiveQuestion(i: number, time: number): QuestionTMP {
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

    answerQuestion(answer: number, time: number) {
        const stat = this.stats.stats[this.activeQuestion - 1];
        if (stat.answered) {
            return null;
        }

        stat.answer = answer;
        stat.answered = true;

        this.stats.answeredCount += 1;
        this.stats.stats[this.activeQuestion - 1].time += (time - this.questionStartTime);
        this.stats.totalTime += (time - this.questionStartTime);
    }

    nextQuestion(): number {
        let first: boolean = true;
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
            else if (i === active && !first) {
                return -1;
            }
            else {
                first = false;
            }

        }
    }

    remainingCount(): number {
        return this.questions.length - this.stats.answeredCount;
    }

    isAnswered(i: number) {
        return this.stats.stats[i - 1].answered;
    }

    getAnswers(): IAnswer[] {
        const totalTime = this.stats.totalTime;

        return this.stats.stats.map(s =>  {
            return {
                answer: s.answer,
                timeFraction: (s.time / totalTime)
            } as IAnswer
        });
    }
}

export { Quiz, IStat, Stats }