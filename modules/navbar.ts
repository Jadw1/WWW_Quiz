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

export function initNavbar() {
    document.getElementById('navButton').addEventListener('click', onClick);
}