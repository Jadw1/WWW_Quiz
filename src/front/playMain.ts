import { Quiz, IStat, Stats } from './modules/quiz.js';
import { Timer, buildTimerString } from './modules/timer.js'
import { IQuestionStat, IStatistic, saveToLocalStorage } from './modules/statistics.js';
import { initNavbar } from './modules/navbar.js'
import { IQuiz ,IStartQuiz, IEndQuiz, IResult } from './common/types.js';
import { log } from 'console';
import { IQuizResult } from './common/types.js';

const buttonSelector = i => '#questionList > button:nth-child(' + i + ')';

let quiz: Quiz;
const timer: Timer = new Timer(document.getElementById('stopwatch'));
let selectedButton: number = null;

function displayError(message: string) {
    const body = document.getElementById('error-body');
    body.innerText = message;

    const modal = document.getElementById('errorPanel');
    modal.classList.add('is-active');
}

function displayOverlay(result: IQuizResult) {
    const correctCounter = document.getElementById('correctCounter');
    const totalTime = document.getElementById('totalTime');
    const totalPenalty = document.getElementById('totalPenalty');
    const resultTable = document.getElementById('resultTable');

    let correct = 0;

    let i = 0;
    for(const r of result.results) {
        const stat = quiz.stats.stats[i];

        let ans = '';
        if(r.isCorrect) {
            ans = `<span class="correct">${stat.answer}</span>`;
            correct++;
        }
        else {
            ans = `<span class="wrong">${stat.answer}</span>&nbsp;<span class="answer-info">${r.correctAnswer}</span>`;
        }
        ans = `<td>${ans}</td>`;
        const time = `<td>${buildTimerString(r.time)}</td>`;

        let penalty = '';
        if(!r.isCorrect) {
            penalty = `<td>+ ${quiz.questions[i].penalty}s</td>`;
        }

        const row = `<tr><td>${i + 1}</td>${ans}${time}${penalty}</tr>`;
        resultTable.innerHTML += row;

        i++;
    }

    correctCounter.innerText = `${correct}/${quiz.questions.length}`
    totalTime.innerText = `${buildTimerString(result.time)}`;
    totalPenalty.innerText = `+ ${result.penalty}s`;

    const overlay = document.getElementById('overlay');
    overlay.style.display = 'block';
}

function endQuiz() {
    const answers = quiz.getAnswers();
    const path = window.location.href.split('/');
    const id = parseInt(path[path.length - 1], 10);
    const token = document.querySelector('meta[name=csrf-token]').getAttribute('content');

    const endQ: IEndQuiz = {
        answers,
        statID: quiz.statID
    };

    fetch(`/api/end/${id}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'CSRF-Token': token
        },
        body: JSON.stringify(endQ)
    }).then(res => {
        if(!res.ok) {
            res.text().then(msg => {
                displayError(`Failed to send results.\n${msg}`);
            });
            return;
        }

        res.json().then((q: IQuizResult) => {
            displayOverlay(q);
        });
    });
}

function setButtonStatus(): boolean {
    const input = document.getElementById('answer') as HTMLInputElement;
    const button = document.getElementById('submitButton');

    if (quiz.remainingCount() <= 1) {
        button.classList.remove('is-success');
        button.classList.add('is-danger');
        (button as HTMLInputElement).value = 'Zakończ';
    }

    if (input.value.trim().length > 0 && !quiz.isAnswered(selectedButton)) {
        button.removeAttribute('disabled');
        return true;
    }
    else {
        button.setAttribute('disabled', '');
        return false;
    }
}

function selectQuestion(this: HTMLElement) {
    setActiveQuestion(Number(this.innerText));
}

function setActiveQuestion(i: number) {
    const question = quiz.setActiveQuestion(i, timer.getTime());

    document.getElementById('question').innerText = question.question;
    document.getElementById('penalty').innerText = question.penalty.toString();

    const answer = document.getElementById('answer') as HTMLInputElement;
    if (quiz.isAnswered(i)) {
        timer.pause();
        answer.value = quiz.stats.stats[i - 1].answer.toString();
        answer.setAttribute('disabled', '');
    }
    else {
        timer.resume();
        answer.value = '';
        answer.removeAttribute('disabled');
    }

    if (selectedButton !== null) {
        document.querySelector(buttonSelector(selectedButton)).classList.add('is-outlined');
    }

    selectedButton = i;
    document.querySelector(buttonSelector(selectedButton)).classList.remove('is-outlined');

    setButtonStatus();
}

function submitQuestion(event: Event) {
    event.preventDefault();
    if (setButtonStatus()) {
        const answer = (document.getElementById('answer') as HTMLInputElement).valueAsNumber;
        quiz.answerQuestion(answer, timer.getTime());

        const questionButton = document.querySelector(buttonSelector(quiz.activeQuestion));
        questionButton.classList.remove('is-info');

        const next = quiz.nextQuestion();
        if (next > 0) {
            setActiveQuestion(next);
        }
        else {
            timer.pause();
            endQuiz();
        }
    }
}

function skip() {
    const next = quiz.nextQuestion()
    if (next > 0) {
        setActiveQuestion(next);
    }
}

function createButtons() {
    const buttonList = document.getElementById('questionList');
    const buttonTemplate = document.getElementById('questionButtonTemplate') as HTMLTemplateElement;

    const questionCount = quiz.questions.length;

    for (let i = 1; i <= questionCount; i++) {
        const button = buttonTemplate.content.cloneNode(true) as HTMLElement;
        buttonList.appendChild(button);
    }
    for (let i = 1; i <= questionCount; i++) {
        const button = document.querySelector(buttonSelector(i)) as HTMLElement;
        button.innerText = i.toString();
        button.addEventListener('click', selectQuestion)
    }
}

function loadQuiz() {
    const path = window.location.href.split('/');
    const id = parseInt(path[path.length - 1], 10);

    if(Object.is(id, NaN)) {
        displayError(`Wrong quiz index.`);
        return;
    }

    fetch(`/api/quiz/${id}`).then(res => {
        if(!res.ok) {
            res.text().then(msg => {
                displayError(`Failed to download quiz.\n${msg}`);
            });
            return;
        }

        res.json().then((q: IStartQuiz) => {
            if(q.quiz === undefined || q.statID < 0) {
                displayError('Invalid quiz id.');
                return;
            }

            quiz = new Quiz(q);
            createButtons();
            setActiveQuestion(1);
            setButtonStatus();
        });
    });
}

function init() {
    const form = document.getElementById('quizForm');
    form.addEventListener('input', setButtonStatus);
    form.addEventListener('submit', submitQuestion);
    document.getElementById('skipButton').addEventListener('click', skip);

    initNavbar();
    timer.run();
}

init();
loadQuiz();