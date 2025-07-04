import { global } from "./globals.js"
import utils from "./utils.js"

function createNodeModel() {
    const modeltext = `<line x1="-16" y1="48" x2="0" y2="0" stroke="black" stroke-width="2" fill="none"/>
        <line x1="0" y1="0" x2="16" y2="48" stroke="black" stroke-width="2" fill="none"/>
        <circle cx="0" cy="0" r="16" stroke="black" stroke-width="2" fill="none"/>
        <circle cx="0" cy="0" r="24" stroke="black" stroke-width="2" fill="none"/>
        <circle cx="0" cy="0" r="32" stroke="black" stroke-width="2" fill="none"/>
        <circle cx="0" cy="0" r="40" fill="transparent"/>
        <line x1="-16" y1="48" x2="16" y2="48" stroke="black" stroke-width="2" fill="none"/>`

    const element = utils.svg.createSvgFromText(modeltext)
    return element
}

/**
 * @returns {SVGElement}
 */
function cloneModel() {
    return model.cloneNode(true)
}

export function calculateTimeToSend(payloadBytes, sf = 7, bw = 250, cr = 1, preamble = 8) {
    const bwHz = bw * 1000;
    const symbolTime = Math.pow(2, sf) / bwHz;
    const payloadSymbNb = 8 + Math.max(
        Math.ceil((8 * payloadBytes - 4 * sf + 28 + 16 - 20) / (4 * (sf - 2))) * (cr + 4), 0
    );
    const preambleTime = (preamble + 4.25) * symbolTime;
    return (preambleTime + payloadSymbNb * symbolTime) * 1000; // ms
}

function generateNodeId() {
    // Base64 6 random bytes, prefixed with "!"
    const array = new Uint8Array(6);
    crypto.getRandomValues(array);
    const base64 = btoa(String.fromCharCode(...array)).replace(/=+$/, '');
    return '!' + base64;
}

function onModelEnter(node) {
    for (const e of nodeRangeModels) {
        e.parentElement.removeChild(e)
    }
    nodeRangeModels.length = 0

    const modeltext = `<circle cx="${node.position.x * 100}" cy="${node.position.y * 100}" r="${node.maxRangeKm() * global.GRID.SIZE}" fill="url(#grad1)"/>`
    const element = utils.svg.createSvgFromText(modeltext)
    nodeRangeModels.push(element)

    const svg = node.model.parentElement
    svg.insertBefore(element, svg.firstChild);
}

function onModelLeave() {
    for (const e of nodeRangeModels) {
        e.parentElement.removeChild(e)
    }
    nodeRangeModels.length = 0
}

const model = createNodeModel()

const nodeRangeModels = []

export class Node {
    constructor(network, txDbm = 20, hops = 3, ignoretiming = true, position = { x: 0, y: 0 }) {
        this.id = generateNodeId()

        this.seenMessages = new Map()
        this.ttl = 600_000
        this.hops = hops

        this.network = network
        this.position = {
            x: position.x * global.GRID.SIZE,
            y: position.y * global.GRID.SIZE,
        }

        // not ignoring time (endless pain and suffering)
        this.ignoretiming = ignoretiming
        this.busy = false
        this.busyuntil = 0

        this.model = cloneModel()
        this.model.setAttribute('transform', `scale(1) translate(${position.x * global.GRID.SIZE * 100}, ${position.y * global.GRID.SIZE * 100})`)

        const node = this
        this.model.addEventListener('mouseenter', (e) => {
            onModelEnter(node)
        })
        this.model.addEventListener('mouseleave', (e) => {
            onModelLeave()
        })
        this.txDbm = txDbm
    }

    reset() {
        this.busy = false;
        this.busyuntil = 0
        this.seenMessages.clear()
    }

    distanceTo(node) {
        const dx = this.position.x * 100 - node.position.x * 100;
        const dy = this.position.y * 100 - node.position.y * 100;
        return Math.sqrt(dx * dx + dy * dy);
    }

    maxRangeKm() {
        const PL_d0 = 32.44 + 20 * Math.log10(this.network.frequency); // FSPL at 1 m

        const linkBudget = this.txDbm + 0 + 0 - 2 - this.network.sensitivity;
        const A_env = 30

        const exponent = (linkBudget - PL_d0 - A_env) / (20);
        const d = Math.pow(10, exponent);

        return d;
    }

    canReach(node) {
        const dist = this.distanceTo(node);
        return dist <= this.maxRangeKm() * global.GRID.SIZE;
    }

    decideIfBusy(ms) {
        if (ms < this.busyuntil) {
            this.busy = true;
        }
        else {
            this.busy = false;
        }
    }

    removeExpiredMessages(currentTime) {
        for (const [id, time] of this.seenMessages) {
            if (currentTime - time > this.ttl) {
                this.seenMessages.delete(id)
            }
        }
    }

    hasSeen(msg, ms) {
        this.removeExpiredMessages(ms)
        return this.seenMessages.has(msg.id)
    }

    markSeen(msg, ms) {
        this.seenMessages.set(msg.id, ms)
    }

    send(receiver, payload, ms) {
        const msg = {
            id: this.network.nextMessageId(),
            from: this.id,
            to: receiver.id,
            hops: this.hops,
            payload,
            timestamp: ms,
        };

        const sendtime = calculateTimeToSend(JSON.stringify(msg).length,
            Number(this.network.sf.slice(2)),
            this.network.bw,
            this.network.cr,
        )

        if (this.ignoretiming) {
            this.network.packectDest.set(msg.id, receiver)
            this.network.broadcast(this, msg, ms)
            return true
        }
        else {
            this.decideIfBusy(ms)
            if (!this.busy) {
                this.busyuntil = ms + sendtime
                this.network.packectDest.set(msg.id, receiver)
                this.network.broadcast(this, msg, ms + sendtime)
                return true
            }
        }

        console.log('not send');

        this.network.messageId--
        return false
    }

    receive(sender, msg, ms) {
        if (this.hasSeen(msg, ms)) return;
        this.markSeen(msg, ms)

        if (this.ignoretiming) {
            if (msg.to == this.id) {
                this.network.successes++
                this.network.packectPaths.get(msg.id).push({
                    x1: sender.position.x,
                    y1: sender.position.y,
                    x2: this.position.x,
                    y2: this.position.y,
                })
            }
            else if (msg.to != this.id && msg.hops > 0) {
                msg = { ...msg, hops: msg.hops - 1 }
                this.network.packectPaths.get(msg.id).push({
                    x1: sender.position.x,
                    y1: sender.position.y,
                    x2: this.position.x,
                    y2: this.position.y,
                })
                this.network.broadcast(this, msg, ms)
            }
            else {
                this.network.packectPaths.get(msg.id).push({
                    x1: sender.position.x,
                    y1: sender.position.y,
                    x2: this.position.x,
                    y2: this.position.y,
                })
            }
        }
        else {
            const sendtime = calculateTimeToSend(JSON.stringify(msg).length)

            this.decideIfBusy(ms)

            if (!this.busy) {
                this.busyuntil = ms + sendtime
                // fix busy to stack up + add random delays
                if (msg.to == this.id) {
                    this.network.successes++
                    this.network.packectPaths.get(msg.id).push({
                        x1: sender.position.x,
                        y1: sender.position.y,
                        x2: this.position.x,
                        y2: this.position.y,
                    })
                }
                else if (msg.to != this.id && msg.hops > 0) {
                    msg = { ...msg, hops: msg.hops - 1 }
                    this.network.packectPaths.get(msg.id).push({
                        x1: sender.position.x,
                        y1: sender.position.y,
                        x2: this.position.x,
                        y2: this.position.y,
                    })
                    this.network.broadcast(this, msg, this.busyuntil + sendtime)
                }
                else {
                    this.network.packectPaths.get(msg.id).push({
                        x1: sender.position.x,
                        y1: sender.position.y,
                        x2: this.position.x,
                        y2: this.position.y,
                    })
                }
            }
        }
    }

    dispose() {
        this.network = undefined
        this.model.parentElement.removeChild(this.model)
    }
}