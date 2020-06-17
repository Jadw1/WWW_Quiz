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

function openChangePanel() {
    const panel = document.getElementById('changePanel');

    panel.classList.add('is-active');
}

function closeChangePanel() {
    const panel = document.getElementById('changePanel');

    panel.classList.remove('is-active');
}

export function initNavbar() {
    document.getElementById('navButton').addEventListener('click', onClick);
    document.getElementById('loginButton').addEventListener('click', openLoginPanel);
    document.getElementById('panelBg').addEventListener('click', closeLoginPanel);
    document.getElementById('panelClose').addEventListener('click', closeLoginPanel);
    document.getElementById('changePassButton').addEventListener('click', openChangePanel);
    document.getElementById('changePassButton').addEventListener('click', closeChangePanel);
}