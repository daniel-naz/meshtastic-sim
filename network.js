import { Node } from "./node.js";
import utils from "./utils.js";

export class Network {
    constructor(bw, sf, cr, freq = 915) {
        /**
         * @type {Set<Node>}
         */
        this.nodes = new Set()
        this.successes = 0

        // based on https://meshtastic.org/docs/software/site-planner/
        const ranges = {
            500: {
                'sf7': {
                    0.8: -117
                }
            },
            250: {
                'sf7': {
                    0.8: -121
                },
                'sf8': {
                    0.8: -124
                },
                'sf9': {
                    0.8: -127
                },
                'sf10': {
                    0.8: -130
                }
            },
            125: {
                'sf11': {
                    0.8: -133,
                    0.5: -136
                },
                'sf12': {
                    0.5: -137
                }
            }
        }

        this.frequency = freq
        this.bw = bw
        this.sf = sf
        this.cr = cr
        this.sensitivity = -130

        if (
            ranges.hasOwnProperty(this.bw) &&
            ranges[this.bw].hasOwnProperty(this.sf) &&
            ranges[this.bw][this.sf].hasOwnProperty(this.cr)
        ) {
            this.sensitivity = ranges[this.bw][this.sf][this.cr];
        }
        else {
            alert('Invalid network properties - defaulting to (bw, sf, cr) = (500, sf7, 0.8).')
        }

        this.messageId = 1
    }

    reset() {
        this.successes = 0
        this.messageId = 1

        for (const n of this.nodes) {
            n.reset()
        }
    }

    generate(props) {
        const rnd = utils.random.createSeeded(props.seed)
        this.clear()

        for (let i = 0; i < props.nodes; i++) {
            const n = new Node(this,
                props.txdmb,
                props.hops,
                props.ignoreTiming, {
                x: (rnd.next() - 0.5),
                y: (rnd.next() - 0.5),
            })

            this.addNode(n)
        }
    }

    nextMessageId() {
        return this.messageId++
    }

    addNode(node) {
        this.nodes.add(node)
    }

    broadcast(src, msg, now) {
        for (const n of this.nodes) {
            if (!src.canReach(n)) continue;
            n.receive(msg, now)
        }
    }

    clear() {
        for (const n of this.nodes) {
            n.dispose();
        }
        this.nodes.clear()
    }
}