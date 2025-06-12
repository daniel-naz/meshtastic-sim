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
        return this.state / 0x100000000;
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

function randomString(random, min = 5, max = 1000) {
    const length = Math.floor(random.next() * (max - min + 1)) + min;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(random.next() * chars.length));
    }
    return result;
}

export default {
    createSeeded,
    generateNodeId,
    randomString
}