import { initNavbar } from './modules/navbar.js';
import { IQuestion, loadQuiz } from './modules/quiz.js';
import { getStatistics } from './modules/statistics.js'
import { buildTimerString } from './modules/timer.js'

function loadQuestions() {
    const quiz = loadQuiz();
    const table = document.getElementById('questionTable');

    for (let q of quiz) {
        const tr = `<tr><td>${q.question}</td><td>${q.answer}</td><td>${q.penalty}s</td></tr>`;
        table.innerHTML += tr;
    }
}

function loadRanking() {
    const ranking = getStatistics().sort((s1, s2) => {
        if (s1.time < s2.time) {
            return -1;
        }
        else if (s1.time > s2.time) {
            return 1;
        }
        else {
            return ((s1.correct / s1.total) > (s2.correct / s2.total)) ? -1 : 1;
        }
    });
    const table = document.getElementById('rankingTable');

    for (let s of ranking) {
        const tr = `<tr><td>${s.nick}</td><td>${s.correct}/${s.total}</td><td>${buildTimerString(s.time)}</td></tr>`;

        table.innerHTML += tr;
    }
}

initNavbar();
loadQuestions();
loadRanking();