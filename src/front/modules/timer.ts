function pad(num: number, size: number): string {
    const str = "000" + num;
    return str.substr(str.length - size);
}

export function buildTimerString(time: number): string {
    let sec = Math.floor(time / 1000);
    const milisec = time - (sec * 1000);
    let min = Math.floor(sec / 60);
    sec = sec - (min * 60);
    const hours = Math.floor(min / 60);
    min = min - (hours * 60);

    return pad(hours, 2) + ':' + pad(min, 2) + ':' + pad(sec, 2) + '.' + pad(milisec, 3);
}


function updateTimer(timer: Timer) {
    timer.update();
}

export class Timer {
    lastUpdate: number;
    time: number;
    display: HTMLElement;
    paused: boolean;

    constructor(display: HTMLElement) {
        this.display = display;
    }

    run() {
        this.lastUpdate = Date.now();
        this.time = 0;
        this.paused = false;

        setInterval(updateTimer, 1, this);
    }

    getTime(): number {
        return this.time;
    }

    pause() {
        this.paused = true;
    }

    resume() {
        this.paused = false;
        this.lastUpdate = Date.now();
    }

    update() {
        if (this.paused) {
            return;
        }

        const now = Date.now();
        this.time += now - this.lastUpdate;
        this.lastUpdate = now;
        this.display.innerText = buildTimerString(this.time);
    }
}