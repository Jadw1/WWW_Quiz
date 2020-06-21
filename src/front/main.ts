import { initNavbar } from './modules/navbar.js';
import { buildTimerString } from './modules/timer.js'
import { IQuiz, IQuestion, IStat, IQuizStat } from './common/types'

function loadRanking() {
    fetch('/api/stats').then((res) => {
        if(!res.ok) {
            console.error("Error from /api/stats. Failed to load stats.");
            return;
        }

        res.json().then((stats: IStat[]) => {
            const table = document.getElementById('rankingTable');

            let q = -1;
            let n = 1;
            for(const s of stats) {
                if(s.quizID !== q) {
                    q = s.quizID;
                    n = 1;
                    table.innerHTML += `<tr><td colspan="3" class="quiz-name">Quiz ${s.quizID}</td></tr>`;
                }

                table.innerHTML += `<tr><td>${n}</td><td>${s.user}</td><td>${buildTimerString(s.time)}</td></tr>`;
                n++;
            }
        });
    });
}

let dropdownOpened = false;
function toggleDropdown() {
    const dropdown = document.getElementById('quizDropdown');
    if(dropdownOpened)
        dropdown.classList.remove('is-active');
    else
        dropdown.classList.add('is-active');

    dropdownOpened = !dropdownOpened;
}

function loadQuizes() {
    const menu = document.getElementById('quizes');
    const table = document.getElementById('questionTable');

    fetch('/api/quizes').then((res) =>  {
        if(!res.ok) {
            console.error("Error from /api/quizes. Failed to load quizes.");
            return;
        }

        res.json().then((quizes: IQuiz[]) => {
            for(const q of quizes) {
                const link = (!q.solved) ? `href="/play/${q.id}"` : '';
                let name = `Quiz ${q.id}`
                if(q.solved) {
                    name += ' (solved)';
                }

                menu.innerHTML += `<a class="dropdown-item" ${link}>${name}</a>`;

                table.innerHTML += `<tr><td colspan="3" class="quiz-name">Quiz ${q.id}</td></tr>`;
                for(const qu of q.questions) {
                    table.innerHTML += `<tr><td>${qu.question}</td><td>${qu.answer}</td><td>${qu.penalty}s</td></tr>`;
                }
            }
        });
    });
}

function loadResults() {
    const table = document.getElementById('urResultsTable');
    if(table === null) {
        return;
    }

    fetch('/api/my_stats').then((res) => {
        if(!res.ok) {
            console.error("Error from /api/my_stats. Failed to load results.");
            return;
        }

        res.json().then((stats: IQuizStat[]) => {

            for(const quiz of stats) {
                // table.innerHTML += `<tr><td colspan="3" class="quiz-name">Quiz ${quiz.quizID}</td></tr>`;
                // table.innerHTML += `<tr><td colspan="3" class="text-center">Time: ${quiz.totalTime}</td></tr>`;
                // table.innerHTML += `<tr><td colspan="3" class="text-center">Penalty: ${quiz.totalPenalty}s</td></tr>`;

                table.innerHTML += `<tr><td colspan="3" class="quiz-name">Quiz ${quiz.quizID}</td></tr>`;
                table.innerHTML += `<tr><td colspan="3" class="text-center">Time: ${quiz.totalTime}     Penalty: ${quiz.totalPenalty}s</td></tr>`;

                let i = 1;
                for(const q of quiz.questions) {
                    let ans = '';
                    if(q.answer === q.correctAns) {
                        ans = `<span class="correct">${q.answer}</span>`;
                    }
                    else {
                        ans = `<span class="wrong">${q.answer}</span>&nbsp;<span class="answer-info">${q.correctAns}</span>`;
                    }
                    ans = `<td>${ans}</td>`;

                    const time = `<td>${buildTimerString(q.time)}</td>`;

                    let penalty = '';
                    if(q.answer === q.correctAns) {
                        penalty = `<td>+ ${q.penalty}s</td>`;
                    }


                    const row = `<tr><td>${i}</td>${ans}${time}${penalty}</tr>`;
                    table.innerHTML += row;
                    i++;
                }
            }
        });
    });
}

document.getElementById('startButton').addEventListener('click', toggleDropdown);
initNavbar();
loadRanking();
loadQuizes();
loadResults();
