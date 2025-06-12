export class Time {
    #tickTime; #currentTime;

    constructor(tickTime) {
        this.#tickTime = tickTime
        this.#currentTime = 0
    }

    tick() {
        this.#currentTime += this.#tickTime
    }

    get currentMs() {
        return this.#currentTime
    }

    set tickTime(value) {
        this.#currentTime = value
    }
}

