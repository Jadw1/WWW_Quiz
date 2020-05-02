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

        this.stats = Array.from({ length: length }, () => (
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

    constructor(questions: IQuestion[]) {
        this.questions = questions;
        this.stats = new Stats(this.questions.length);
        this.activeQuestion = 0;
    }

    loadToPage() {
        const buttonList = document.getElementById('questionList');
        const buttonTemplate = document.getElementById('questionButtonTemplate') as HTMLTemplateElement;
        const buttonSelector = i => '#questionList > button:nth-child(' + i + ')';

        for (let i = 1; i <= this.questions.length; i++) {
            let button = buttonTemplate.content.cloneNode(true) as HTMLElement;
            buttonList.appendChild(button);
        }
        for (let i = 1; i <= this.questions.length; i++) {
            const button = document.querySelector(buttonSelector(i)) as HTMLElement;
            button.innerText = i.toString();
        }
    }
}