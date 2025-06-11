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

const zoomLayer = document.getElementById('zoomLayer')
const network = new Network()

let currentseed = 100

utils.menu.createMenuDropdownButton('Edit simulation', 'Set seed', ()=>{
    const temp = Number(prompt("Enter simulation seed :")) ?? -1;

    if (!temp || temp <= 0 || temp > 100000) {
        alert(`Invalid seed value.`)
        return
    }

    currentseed = temp
    alert(`Current seed set to ${currentseed}.`)
})

utils.menu.createMenuDropdownButton('Edit simulation', 'Set random seed', ()=>{
    currentseed = 1 + Math.floor(Math.random() * 100000)
    alert(`Current seed set to ${currentseed}.`)
})


utils.menu.createMenuDropdownButton('Edit simulation', 'Generate from current seed', () => {
    const rnd = utils.random.createSeeded(currentseed)
    
    network.clear()

    for (let i = 0; i < 100; i++) {
        const n = new Node(network, 20, 600_000, {
            x: (rnd.next() - 0.5),
            y: (rnd.next() - 0.5),
        })

        network.addNode(n)

        zoomLayer.appendChild(n.model)
    }
},)

utils.menu.createMenuButton('Start simulation', () => {
    const elem = document.getElementById('Start simulation')

    const time = new Time(10) // 10 ms tick time

    if(!simRunning) {        
        const arr = [...network.nodes]
        
        if (arr.length < 2) return;
        
        elem.innerText = 'Stop simulation'
        simRunning = true
        
        const rnd = utils.random.createSeeded()
        let count = 0

        network.resetStats()

        const intervalId = setInterval(() => {
            if(count == 100) {
                clearInterval(intervalId)
                simRunning = false;
                elem.innerText = 'Start simulation'

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