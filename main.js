import canvas from "./canvas.js";
import { global } from "./globals.js";
import { Network } from "./network.js";
import { calculateTimeToSend, Node } from "./node.js";
import { Time } from "./time.js";
import utils from "./utils.js";

const svg = document.getElementById("canvas");
let simRunning = false;

svg.addEventListener("mousedown", (e) => {
    canvas.startPanning(e)
});

svg.addEventListener("contextmenu", (e) => {
    e.preventDefault();
});

svg.addEventListener("mousemove", (e) => {
    canvas.updatePanning(e)
});

svg.addEventListener("mouseup", (e) => {
    canvas.stopPanning(e)
});

svg.addEventListener("mouseleave", (e) => {
    canvas.stopPanning(e)
});

svg.addEventListener("wheel", (e) => {
    e.preventDefault();
    canvas.updateZoom(e);
});

window.addEventListener("resize", () => {
    canvas.resizeCanvas()
});

canvas.initializeViewBox()

function onNumberInpChange(e) {
    if (this.value > this.max) this.value = this.max
    if (this.value < this.min) this.value = this.min
}

const hopinput = document.getElementById('hopCount')
const packetsinput = document.getElementById('packetCount')
const seedinput = document.getElementById('currentSeed')
const dialogue = document.getElementById('simEditorModal')
const powerinput = document.getElementById('powerRange');
const powerdisplay = document.getElementById('transmitPower');

hopinput.addEventListener('change', onNumberInpChange)
packetsinput.addEventListener('change', onNumberInpChange)
seedinput.addEventListener('change', onNumberInpChange)
powerinput.addEventListener('input', () => {
    powerdisplay.textContent = powerinput.value;
});

const currentProps = {
    hops: 3,
    packets: 100,
    seed: 0,
    txdmb: 20,
}

function openSimulationEditor() {
    hopinput.value = currentProps.hops || 3;
    packetsinput.value = currentProps.packets || 100;
    seedinput.value = currentProps.seed || 0;
    powerinput.value = currentProps.txdmb || 20;
    powerdisplay.textContent = powerinput.value;
    dialogue.style.display = 'flex';
}

function closeSimulationEditor() {
    dialogue.style.display = 'none';
}

function submitSimulationChanges() {
    currentProps.hops = parseFloat(hopinput.value)
    currentProps.packets = parseFloat(packetsinput.value)
    currentProps.seed = parseFloat(seedinput.value)
    currentProps.txdmb = parseFloat(powerinput.value)
    closeSimulationEditor();
}

const submitBtn = document.getElementById('settingSubmitBtn')
const cancelBtn = document.getElementById('settingCancelBtn')
submitBtn.onclick = submitSimulationChanges
cancelBtn.onclick = closeSimulationEditor

const zoomLayer = document.getElementById('zoomLayer')
const network = new Network()

utils.menu.createMenuDropdownButton('Simulation', 'Generate nodes', () => {
    if (currentProps.seed == 0) {
        alert("Set a seed in the settings.")
        return
    }

    const rnd = utils.random.createSeeded(currentProps.seed)

    network.clear()

    for (let i = 0; i < 100; i++) {
        const n = new Node(network, currentProps.txdmb, currentProps.hops, {
            x: (rnd.next() - 0.5),
            y: (rnd.next() - 0.5),
        })

        network.addNode(n)

        zoomLayer.appendChild(n.model)
    }
},)

utils.menu.createMenuDropdownButton('Simulation', 'Track packet', () => {
    console.log('todo');
})

utils.menu.createMenuDropdownButton('Simulation', 'Create link', () => {
    console.log('todo');
})

utils.menu.createMenuDropdownButton('Simulation', 'Clear seed', () => {
    network.clear()
    currentProps.seed = 0
})

utils.menu.createMenuDropdownButton('Simulation', 'Settings', () => {
    openSimulationEditor()
})


utils.menu.createMenuButton('Run', () => {
    const elem = document.getElementById('Run')

    const time = new Time(10) // 10 ms tick time

    if (!simRunning) {
        const arr = [...network.nodes]

        if (arr.length < 2) return;

        elem.innerText = 'Running...'
        simRunning = true

        const rnd = utils.random.createSeeded(currentProps.seed)
        let count = 0

        network.resetStats()

        const intervalId = setInterval(() => {
            if (count == 100) {
                clearInterval(intervalId)
                simRunning = false;
                elem.innerText = 'Run'

                alert(`Successes : ${network.successes}, Fails : ${count - network.successes}`)
            }
            const sender = arr[Math.floor(rnd.next() * 100)]
            const receiver = arr[Math.floor(rnd.next() * 100)]

            if (sender == receiver) return;

            sender.send(receiver.id)
            count++
            time.tick()
        }, 10);
    }
})