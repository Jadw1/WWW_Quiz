let isActive = false;
function onClick() {
    const button = document.getElementById('navButton');
    const menu = document.getElementById('navMenu');

    if (isActive) {
        button.classList.remove('is-active');
        menu.classList.remove('is-active');
    }
    else {
        button.classList.add('is-active');
        menu.classList.add('is-active');
    }

    isActive = !isActive;
}

function openLoginPanel() {
    const panel = document.getElementById('loginPanel');

    panel.classList.add('is-active');
}

function closeLoginPanel() {
    const panel = document.getElementById('loginPanel');

    panel.classList.remove('is-active');
}

function login() {
    const username = document.getElementById('username') as HTMLInputElement;
    const password = document.getElementById('password') as HTMLInputElement;

    const xhr = new XMLHttpRequest();
    const url = '/api/login';

    xhr.open("POST", url);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");


    xhr.onload = (e) => {
        console.log(xhr.responseText);
        closeLoginPanel();
    }
    xhr.send(JSON.stringify({
        username: username.value,
        password: password.value
    }));
}

export function initNavbar() {
    document.getElementById('navButton').addEventListener('click', onClick);
    document.getElementById('loginButton').addEventListener('click', openLoginPanel);
    document.getElementById('panelBg').addEventListener('click', closeLoginPanel);
    document.getElementById('panelClose').addEventListener('click', closeLoginPanel);
    document.getElementById('sendLogin').addEventListener('click', login);
}