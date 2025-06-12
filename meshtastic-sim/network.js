import { Node } from "./node.js";

export class Network {
    static {
        this.messageId = 1
    }
    
    constructor() {
        /**
         * @type {Set<Node>}
         */
        this.nodes = new Set()
        this.successes = 0
        this.frequency = 915
    }

    resetStats() {
        this.successes = 0
    }

    nextMessageId() {
        return Network.messageId++
    }

    addNode(node) {
        this.nodes.add(node)
    }

    broadcast(src, msg) {
        for (const n of this.nodes) {
            if(!src.canReach(n)) continue;
            n.receive(msg)
        }
    }

    clear() {
        for (const n of this.nodes) {
            n.dispose();
        }
        this.nodes.clear()
    }
}