import { initNavbar } from './modules/navbar.js';
import { getStatistics } from './modules/statistics.js'
import { buildTimerString } from './modules/timer.js'
import { QuizTMP, QuestionTMP} from './common/types'

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

    for (const s of ranking) {
        const tr = `<tr><td>${s.nick}</td><td>${s.correct}/${s.total}</td><td>${buildTimerString(s.time)}</td></tr>`;

        table.innerHTML += tr;
    }
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

        res.json().then((quizes: QuizTMP[]) => {
            for(const q of quizes) {
                menu.innerHTML += `<a class="dropdown-item" href="/play/${q.id}">Quiz ${q.id}</a>`;

                table.innerHTML += `<tr><td colspan="3" class="quiz-name">Quiz ${q.id}</td></tr>`;
                for(const qu of q.questions) {
                    table.innerHTML += `<tr><td>${qu.question}</td><td>${qu.answer}</td><td>${qu.penalty}s</td></tr>`;
                }
            }
        });
    });
}

document.getElementById('startButton').addEventListener('click', toggleDropdown);
initNavbar();
loadRanking();
loadQuizes();
