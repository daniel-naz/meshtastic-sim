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

    const modeltext = `<circle cx="0" cy="0" r="${node.maxRangeKm() * global.GRID.SIZE}" fill="url(#grad1)"/>`
    const element = utils.svg.createSvgFromText(modeltext)
    element.setAttribute('transform', `translate(${node.position.x * 100}, ${node.position.y * 100})`)
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
    constructor(network, txDbm = 20, TTL = 600_000, position = { x: 0, y: 0 }) {
        this.id = generateNodeId()

        this.seenMessages = new Map()
        this.ttl = TTL

        this.network = network
        this.position = {
            x: position.x * global.GRID.SIZE,
            y: position.y * global.GRID.SIZE,
        }

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

    distanceTo(node) {
        const dx = this.position.x - node.position.x;
        const dy = this.position.y - node.position.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    maxRangeKm() {
        const PL_d0 = 32.44 + 20 * Math.log10(915); // FSPL at 1 m
        const linkBudget = 20 + 0 + 0 - 2 - -130;
        const A_env = 30

        const exponent = (linkBudget - PL_d0 - A_env) / (20 * 1);

        const d = Math.pow(10, exponent);

        return d; // in km
    }

    canReach(node) {
        const dist = this.distanceTo(node);
        return dist <= this.maxRangeKm();
    }

    send(receiverId) {
        const msg = {
            id: this.network.nextMessageId(),
            from: this.id,
            to: receiverId,
            hops: 3,
            payload: "hello",
            timestamp: 100,
        };

        this.network.broadcast(this, msg)
    }

    removeExpiredMessages(currentTime) {
        for (const [id, time] of this.seenMessages) {
            if (currentTime - time > this.ttl) {
                this.seenMessages.delete(id)
            }
        }
    }

    hasSeen(msg) {
        this.removeExpiredMessages(1000)
        return this.seenMessages.has(msg.id)
    }

    markSeen(msg) {
        this.seenMessages.set(msg.id, 0)
    }

    receive(msg) {
        if (this.hasSeen(msg)) return;
        this.markSeen(msg)

        if (msg.to == this.id) {
            this.network.successes++
            return true
        }
        else if (msg.to != this.id && msg.hops > 1) {
            msg = { ...msg, hops: msg.hops - 1 }
            return this.network.broadcast(this, msg)
        }
    }

    dispose() {
        this.network = undefined
        this.model.parentElement.removeChild(this.model)
    }
}