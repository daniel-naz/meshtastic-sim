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
    if (this.value > Number(this.max)) this.value = this.max
    if (this.value < Number(this.min)) this.value = this.min
}

const hopinput = document.getElementById('hopCount')
const packetsinput = document.getElementById('packetCount')
const seedinput = document.getElementById('currentSeed')
const dialogue = document.getElementById('simEditorModal')
const powerinput = document.getElementById('powerRange');
const powerdisplay = document.getElementById('transmitPower');
const timinginput = document.getElementById('ignoreTiming');

const nodeinput = document.getElementById('nodeCount')
const bwselect = document.getElementById('bwselect')
const sfselect = document.getElementById('sfselect')
const crselect = document.getElementById('crselect')


hopinput.addEventListener('change', onNumberInpChange)
packetsinput.addEventListener('change', onNumberInpChange)
seedinput.addEventListener('change', onNumberInpChange)
nodeinput.addEventListener('change', onNumberInpChange)
powerinput.addEventListener('input', () => {
    powerdisplay.textContent = powerinput.value;
});

document.getElementById('randomSeedBtn').addEventListener('click', () => {
    currentProps.seed = Math.floor(Math.random() * 100000) + 1
    seedinput.value = currentProps.seed
})

const currentProps = {
    nodes: 100,
    bw: '500',
    sf: 'sf7',
    cr: '0.8',

    hops: 3,
    packets: 100,
    seed: 0,
    txdmb: 20,
    ignoreTiming: true,
}

function openSimulationEditor() {
    hopinput.value = currentProps.hops;
    packetsinput.value = currentProps.packets;
    seedinput.value = currentProps.seed;
    powerinput.value = currentProps.txdmb;
    powerdisplay.textContent = powerinput.value;
    timinginput.checked = currentProps.ignoreTiming

    nodeinput.value = currentProps.nodes
    bwselect.value = currentProps.bw
    sfselect.value = currentProps.sf
    crselect.value = currentProps.cr

    dialogue.style.display = 'flex';
}

function closeSimulationEditor() {
    dialogue.style.display = 'none';
}

function submitSimulationChanges() {
    currentProps.hops = parseInt(hopinput.value)
    currentProps.packets = parseInt(packetsinput.value)
    currentProps.seed = parseInt(seedinput.value)
    currentProps.txdmb = parseInt(powerinput.value)
    currentProps.ignoreTiming = timinginput.checked

    currentProps.nodes = nodeinput.value
    currentProps.bw = bwselect.value
    currentProps.sf = sfselect.value
    currentProps.cr = crselect.value

    closeSimulationEditor();

    if (currentProps.seed == 0) {
        alert("Set a valid seed.")
        return
    }

    network.clear()
    network = new Network(
        Number(currentProps.bw),
        currentProps.sf,
        Number(currentProps.cr),
        915
    )

    network.generate(currentProps)

    for (const n of network.nodes) {
        zoomLayer.appendChild(n.model)
    }
}

const submitBtn = document.getElementById('settingSubmitBtn')
const cancelBtn = document.getElementById('settingCancelBtn')
submitBtn.onclick = submitSimulationChanges
cancelBtn.onclick = closeSimulationEditor

const zoomLayer = document.getElementById('zoomLayer')
var network = new Network(
    Number(currentProps.bw),
    currentProps.sf,
    Number(currentProps.cr),
    915
)

utils.menu.createMenuDropdownButton('Simulation', 'Track packet', () => {
    const result = prompt("Enter packet id : ", 0)

    if (!Number(result)) {
        alert("Enter a packet id (number).")
        return
    }
    
    const value = Number(result)
    
    if (0 >= value || value >= 100) {
        alert("Packet id out of range.")
        return
    }


    /// tarce packet here
})

utils.menu.createMenuDropdownButton('Simulation', 'Create link', () => {
    const encoded = utils.encode.encodePropsToBase64(currentProps)
    const baseUrl = `${window.location.origin}${window.location.pathname}`;
    const fullUrl = `${baseUrl}?config=${encoded}`;

    navigator.clipboard.writeText(fullUrl)
        .then(() => {
            console.log("Copied to clipboard:", fullUrl);

            alert(`Link created and ready to share!`)
        })
        .catch(err => {
            console.error("Failed to copy:", err);
        });
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

    if (!simRunning) {
        const arr = [...network.nodes]

        if (arr.length < 2) return;

        elem.innerText = 'Running...'
        simRunning = true

        const rnd = utils.random.createSeeded(currentProps.seed)
        rnd.next()

        const time = new Time(100)
        network.reset()

        let count = 0

        async function doWork() {
            for (let i = 0; i < 20 && count < currentProps.packets; i++) {
                const sender = arr[Math.floor(rnd.next() * 100)]
                const receiver = arr[Math.floor(rnd.next() * 100)]

                if (sender == receiver) continue;

                const payload = utils.random.randomString(rnd, 5, 1000)
                const couldsend = sender.send(receiver, payload, time.currentMs)
                time.tick()

                if (!couldsend) continue;
                count++
            }

            if (count >= currentProps.packets) {
                clearInterval(intervalId)
                simRunning = false;
                elem.innerText = 'Run'
                alert(`Successes : ${network.successes}, Fails : ${count - network.successes}`)
            }
        }

        let isRunning = false
        const intervalId = setInterval(() => {
            if (isRunning) return
            isRunning = true

            doWork().finally(() => {
                isRunning = false
            })
        }, 5);
    }
})

const urlParams = new URLSearchParams(window.location.search);
const encodedConfig = urlParams.get("config");

if (encodedConfig) {
    const decodedProps = utils.encode.decodePropsFromBase64(encodedConfig);

    try {
        currentProps.nodes = Number(decodedProps.nodes)
        currentProps.bw = Number(decodedProps.bw)
        currentProps.sf = decodedProps.sf
        currentProps.cr = Number(decodedProps.cr)
        currentProps.hops = Number(decodedProps.hops)
        currentProps.packets = Number(decodedProps.packets)
        currentProps.seed = Number(decodedProps.seed)
        currentProps.txdmb = Number(decodedProps.txdmb)
        currentProps.ignoreTiming = decodedProps.ignoreTiming
        console.log("Loaded config from URL:", currentProps);

        network.clear()
        network = new Network(
            Number(currentProps.bw),
            currentProps.sf,
            Number(currentProps.cr),
            915
        )

        network.generate(currentProps)

        for (const n of network.nodes) {
            zoomLayer.appendChild(n.model)
        }
    }catch {
        alert("Invalid config data.")
    }
}