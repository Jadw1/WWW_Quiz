import { IQuestion, Quiz, IStat, Stats, loadQuiz } from './modules/quiz.js';
import { Timer, buildTimerString } from './modules/timer.js'
import { IQuestionStat, IStatistic, saveToLocalStorage } from './modules/statistics.js';
import { initNavbar } from './modules/navbar.js'

const buttonSelector = i => '#questionList > button:nth-child(' + i + ')';

let quiz: Quiz;
let timer: Timer = new Timer(document.getElementById('stopwatch'));
let selectedButton: number = null;

function displayOverlay() {
    const correctCounter = document.getElementById('correctCounter');
    const totalTime = document.getElementById('totalTime');
    const totalPenalty = document.getElementById('totalPenalty');
    const resultTable = document.getElementById('resultTable');

    let correct = 0;
    let tT = 0;
    let tP = 0;

    let i = 1;
    for (let stat of quiz.stats.stats) {
        let ans = '';
        if (stat.isCorrect) {
            ans = `<span class="correct">${stat.answer}</span>`;
            correct++;
        }
        else {
            ans = `<span class="wrong">${stat.answer}</span>&nbsp;<span class="answer-info">${quiz.questions[i - 1].answer}</span>`;
        }
        ans = `<td>${ans}</td>`;

        let time = `<td>${buildTimerString(stat.time)}</td>`;
        tT += stat.time;

        let penalty = '';
        if (!stat.isCorrect) {
            penalty = `<td>+ ${quiz.questions[i - 1].penalty}s</td>`;
            tP += quiz.questions[i - 1].penalty;
        }

        let row = `<tr><td>${i}</td>${ans}${time}${penalty}</tr>`;
        resultTable.innerHTML += row;

        i++;
    }

    correctCounter.innerText = `${correct}/${quiz.questions.length}`
    totalTime.innerText = `${buildTimerString(tT)}`;
    totalPenalty.innerText = `+ ${tP}s`;

    const overlay = document.getElementById('overlay');
    overlay.style.display = 'block';
}

function setButtonStatus(): boolean {
    const input = document.getElementById('answer') as HTMLInputElement;
    const button = document.getElementById('submitButton');

    if (quiz.remainingCount() <= 1) {
        const button = document.getElementById('submitButton');
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
    let question = quiz.setActiveQuestion(i, timer.getTime());

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
        const result = quiz.answerQuestion(answer, timer.getTime());

        if (result === null) {
            return;
        }

        const questionButton = document.querySelector(buttonSelector(quiz.activeQuestion));
        questionButton.classList.remove('is-info');
        if (result) {
            questionButton.classList.add('is-success');
        }
        else {
            questionButton.classList.add('is-danger');
        }

        const next = quiz.nextQuestion();
        if (next > 0) {
            setActiveQuestion(next);
        }
        else {
            timer.pause();
            displayOverlay();
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
        let button = buttonTemplate.content.cloneNode(true) as HTMLElement;
        buttonList.appendChild(button);
    }
    for (let i = 1; i <= questionCount; i++) {
        const button = document.querySelector(buttonSelector(i)) as HTMLElement;
        button.innerText = i.toString();
        button.addEventListener('click', selectQuestion)
    }
}

function verifyNick() {
    const nick = (document.getElementById('nick') as HTMLInputElement).value;
    const saveButton = document.getElementById('save');

    if (nick.trim().length > 0) {
        saveButton.removeAttribute('disabled');
    }
    else {
        saveButton.setAttribute('disabled', '');
    }
}

function save(event: Event) {
    event.preventDefault();
    const save = (document.getElementById('saveStats') as HTMLInputElement).checked;
    const stats = quiz.stats;
    let questions: IQuestionStat[];
    if (save) {
        questions = [];
    }


    let correct = 0;
    let penalty = 0;
    let i = 0;
    for (let stat of stats.stats) {
        if (!stat.isCorrect) {
            penalty += quiz.questions[i].penalty;
        }
        else {
            correct++;
        }

        if (save) {
            const qStat: IQuestionStat = {
                correct: stat.isCorrect,
                time: stat.time,
                answer: stat.answer
            };
            questions.push(qStat);
        }
        i++;
    }

    const result: IStatistic = {
        nick: (document.getElementById('nick') as HTMLInputElement).value,
        time: stats.totalTime + 1000 * penalty,
        correct: correct,
        total: quiz.questions.length
    };
    if (save) {
        result.questions = questions;
    }
    saveToLocalStorage(result);

    window.location.href = './quiz.html';
}

function cancel() {
    window.location.href = './quiz.html';
}

function init() {
    const form = document.getElementById('quizForm');
    form.addEventListener('input', setButtonStatus);
    form.addEventListener('submit', submitQuestion);
    document.getElementById('skipButton').addEventListener('click', skip);

    const saveForm = document.getElementById('saveForm');
    saveForm.addEventListener('input', verifyNick);
    saveForm.addEventListener('submit', save);
    document.getElementById('cancel').addEventListener('click', cancel);

    quiz = new Quiz(loadQuiz());
    initNavbar();
    createButtons();
    timer.run();
    setActiveQuestion(1);
    setButtonStatus();
    verifyNick();
}

init();