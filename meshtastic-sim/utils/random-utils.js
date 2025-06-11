class Xorshift32 {
    constructor(seed) {
        this.state = seed >>> 0;
        if (this.state === 0) this.state = 1;
    }

    next() {
        let x = this.state;
        x ^= x << 13;
        x ^= x >>> 17;
        x ^= x << 5;
        this.state = x >>> 0;
        return this.state / 0xFFFFFFFF;
    }
}

function createSeeded(seed) {
    return new Xorshift32(seed)
}

function generateNodeId() {
    const array = new Uint8Array(6);
    crypto.getRandomValues(array);
    const base64 = btoa(String.fromCharCode(...array)).replace(/=+$/, '');
    return '!' + base64;
}


export default {
    createSeeded,
    generateNodeId
}