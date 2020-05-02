import { teeest } from ""

interface IQuestion {
    question: string;
    answer: number;
    penalty: number;
}

interface IStats {
    answered: boolean;
    answer: number;
    isCorrect: boolean;
    time: number;
}

interface IQuizStats {
    stats: IStats[];
    totalAnswered: number;
    totalTime: number;
}

const buttonList = document.getElementById('questionList');
const buttonSelector = i => '#questionList > button:nth-child(' + i + ')';
const question = document.getElementById('question');
const penalty = document.getElementById('penalty');

let activeQuestion: number = 0;
let quiz: IQuestion[] = null;
let quizStats: IQuizStats = null;

function loadQuiz() {
    const quizString = `{
        "quiz": [
            {
                "question":"2 * 2",
                "answer": 4,
                "penalty": 0.5
            },
            {
                "question":"6 / 2",
                "answer": 3,
                "penalty": 1
            },
            {
                "question":"2 - (-24 : 4)",
                "answer": 8,
                "penalty": 1
            },
            {
                "question":"2 - (-24 : 4) + 2 * 2",
                "answer": 12,
                "penalty": 1
            },
            {
                "question":"2 - (-24 : 4) + 2 * 2",
                "answer": 8,
                "penalty": 1
            }
        ]
    }`;
    const createStats = () => {
        return {
            answered: false,
            answer: null,
            isCorrect: null,
            time: 0
        } as IStats;
    };

    const quizJSON = JSON.parse(quizString);
    quiz = quizJSON.quiz;

    quizStats = {
        stats: new Array<IStats>(quiz.length),
        totalAnswered: 0,
        totalTime: 0
    }
    quizStats.stats.fill(createStats());
}

function loadPage() {
    const buttonTemplate = document.getElementById('questionButtonTemplate') as HTMLTemplateElement;

    for(let i = 1; i <= quiz.length; i++) {
        let button = buttonTemplate.content.cloneNode(true) as HTMLElement;
        buttonList.appendChild(button);
    }
    for(let i = 1; i <= quiz.length; i++) {
        const button = document.querySelector(buttonSelector(i)) as HTMLElement;
        button.innerText = i.toString();
    }
}

function setActiveQuestion(i: number) {
    if(i <= 0 || i > quiz.length) {
        return;
    }

    activeQuestion = i;
    question.innerText = quiz[activeQuestion - 1].question;
    penalty.innerText = quiz[activeQuestion - 1].penalty.toString();
}

function pad(number: number, size: number): string {
    const str = "000" + number;
    return str.substr(str.length - size);
}

function runStopwatch() {
    const refreshTime = 1;
    const stopwatch = document.getElementById('stopwatch');
    const buildString = milis => {
        let sec = Math.floor(milis/1000);
        let milisec = milis - (sec * 1000);
        let min = Math.floor(sec/60);
        sec = sec - (min*60);
        let hours = Math.floor(min/60);
        min = min - (hours *60);

        return pad(hours, 2) + ':' + pad(min, 2) + ':' + pad(sec, 2) + '.' + pad(milisec, 3);
    }

    const startTime = Date.now();
    const update = () => {
        stopwatch.innerText = buildString(Date.now() - startTime);
    }

    setInterval(update, refreshTime);
}

function setButtonStatus(): boolean{
    const input = document.getElementById('answer') as HTMLInputElement;
    const button = document.getElementById('submitButton');
    if(input.value.trim().length > 0) {
        button.removeAttribute('disabled');
        return false;
    }
    else {
        button.setAttribute('disabled', '');
        return true;
    }
}

function submitQuestion(event: Event) {
    if(setButtonStatus()) {
        console.log('test'); 
    }
    event.preventDefault();
}

const form = document.getElementById('quizForm');
form.addEventListener('input', setButtonStatus);
form.addEventListener('submit', submitQuestion);

loadQuiz();
loadPage();
setActiveQuestion(1);
runStopwatch();
setButtonStatus();