var buttonList = document.getElementById('questionList');
var buttonSelector = function (i) { return '#questionList > button:nth-child(' + i + ')'; };
var question = document.getElementById('question');
var penalty = document.getElementById('penalty');
var activeQuestion = 0;
var quiz = null;
var quizStats = null;
function loadQuiz() {
    var quizString = "{\n        \"quiz\": [\n            {\n                \"question\":\"2 * 2\",\n                \"answer\": 4,\n                \"penalty\": 0.5\n            },\n            {\n                \"question\":\"6 / 2\",\n                \"answer\": 3,\n                \"penalty\": 1\n            },\n            {\n                \"question\":\"2 - (-24 : 4)\",\n                \"answer\": 8,\n                \"penalty\": 1\n            },\n            {\n                \"question\":\"2 - (-24 : 4) + 2 * 2\",\n                \"answer\": 12,\n                \"penalty\": 1\n            },\n            {\n                \"question\":\"2 - (-24 : 4) + 2 * 2\",\n                \"answer\": 8,\n                \"penalty\": 1\n            }\n        ]\n    }";
    var createStats = function () {
        return {
            answered: false,
            answer: null,
            isCorrect: null,
            time: 0
        };
    };
    var quizJSON = JSON.parse(quizString);
    quiz = quizJSON.quiz;
    quizStats = {
        stats: new Array(quiz.length),
        totalAnswered: 0,
        totalTime: 0
    };
    quizStats.stats.fill(createStats());
}
function loadPage() {
    var buttonTemplate = document.getElementById('questionButtonTemplate');
    for (var i = 1; i <= quiz.length; i++) {
        var button = buttonTemplate.content.cloneNode(true);
        buttonList.appendChild(button);
    }
    for (var i = 1; i <= quiz.length; i++) {
        var button = document.querySelector(buttonSelector(i));
        button.innerText = i.toString();
    }
}
function setActiveQuestion(i) {
    if (i <= 0 || i > quiz.length) {
        return;
    }
    activeQuestion = i;
    question.innerText = quiz[activeQuestion - 1].question;
    penalty.innerText = quiz[activeQuestion - 1].penalty.toString();
}
function pad(number, size) {
    var str = "000" + number;
    return str.substr(str.length - size);
}
function runStopwatch() {
    var refreshTime = 1;
    var stopwatch = document.getElementById('stopwatch');
    var buildString = function (milis) {
        var sec = Math.floor(milis / 1000);
        var milisec = milis - (sec * 1000);
        var min = Math.floor(sec / 60);
        sec = sec - (min * 60);
        var hours = Math.floor(min / 60);
        min = min - (hours * 60);
        return pad(hours, 2) + ':' + pad(min, 2) + ':' + pad(sec, 2) + '.' + pad(milisec, 3);
    };
    var startTime = Date.now();
    var update = function () {
        stopwatch.innerText = buildString(Date.now() - startTime);
    };
    setInterval(update, refreshTime);
}
function setButtonStatus() {
    var input = document.getElementById('answer');
    var button = document.getElementById('submitButton');
    if (input.value.trim().length > 0) {
        button.removeAttribute('disabled');
        return false;
    }
    else {
        button.setAttribute('disabled', '');
        return true;
    }
}
function submitQuestion(event) {
    if (setButtonStatus()) {
        console.log('test');
    }
    event.preventDefault();
}
var form = document.getElementById('quizForm');
form.addEventListener('input', setButtonStatus);
form.addEventListener('submit', submitQuestion);
loadQuiz();
loadPage();
setActiveQuestion(1);
runStopwatch();
setButtonStatus();
