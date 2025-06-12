import { global } from "./globals.js";

const gridSize = global.GRID.SIZE;

// Svg camera setup
const svg = document.getElementById("canvas");
const gridLayer = document.getElementById("grid-layer");

let isPanning = false;
let start = { x: 0, y: 0 };
let viewBox = { x: 0, y: 0, w: 1000, h: 1000 };
const canvasSize = 4000 
const cameraBounds = { xMin: -canvasSize, xMax: canvasSize, yMin: -canvasSize, yMax: canvasSize };

let gridNeedsRedraw = false;
let gridRedrawScheduled = false;
function scheduleGridRedraw() {
    if (gridRedrawScheduled) return;
    gridRedrawScheduled = true;
    requestAnimationFrame(() => {
        if (gridNeedsRedraw) {
            drawGrid();
            gridNeedsRedraw = false;
        }
        gridRedrawScheduled = false;
    });
}

function initializeViewBox() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    viewBox = { x: -width / 2, y: -height / 2 + 40, w: width, h: height };
    updateViewBox();
}

function updateViewBox() {
    viewBox.x = Math.max(cameraBounds.xMin, Math.min(viewBox.x, cameraBounds.xMax - viewBox.w));
    viewBox.y = Math.max(cameraBounds.yMin, Math.min(viewBox.y, cameraBounds.yMax - viewBox.h));
    svg.setAttribute("viewBox", `${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`);
    gridNeedsRedraw = true;
    scheduleGridRedraw();
}

function drawGrid(e) {

    gridLayer.innerHTML = "";
    const startX = Math.floor(viewBox.x / gridSize) * gridSize;
    const endX = Math.ceil((viewBox.x + viewBox.w) / gridSize) * gridSize;
    const startY = Math.floor(viewBox.y / gridSize) * gridSize;
    const endY = Math.ceil((viewBox.y + viewBox.h) / gridSize) * gridSize;

    for (let x = startX; x <= endX; x += gridSize) {
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", x);
        line.setAttribute("y1", startY);
        line.setAttribute("x2", x);
        line.setAttribute("y2", endY);
        line.setAttribute("class", "grid-line");
        gridLayer.appendChild(line);
    }

    for (let y = startY; y <= endY; y += gridSize) {
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", startX);
        line.setAttribute("y1", y);
        line.setAttribute("x2", endX);
        line.setAttribute("y2", y);
        line.setAttribute("class", "grid-line");
        gridLayer.appendChild(line);
    }
}

function updateZoom(e) {
    const zoomFactor = 1.1;
    const scale = e.deltaY < 0 ? 1 / zoomFactor : zoomFactor;
    const rect = svg.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / rect.width;
    const my = (e.clientY - rect.top) / rect.height;
    const newW = viewBox.w * scale;
    const newH = viewBox.h * scale;
    const minZoom = 200;
    const maxZoom = 8000;
    if (newW < minZoom || newW > maxZoom) return;
    viewBox.x += (viewBox.w - newW) * mx;
    viewBox.y += (viewBox.h - newH) * my;
    viewBox.w = newW;
    viewBox.h = newH;
    updateViewBox();
}

function startPanning(e) {
    isPanning = true;
    start = { x: e.clientX, y: e.clientY };
}

function updatePanning(e) {
    if (!isPanning) return;
    svg.classList.add("panning"); 
    const dx = (e.clientX - start.x) * (viewBox.w / svg.clientWidth);
    const dy = (e.clientY - start.y) * (viewBox.h / svg.clientHeight);
    viewBox.x -= dx;
    viewBox.y -= dy;
    start = { x: e.clientX, y: e.clientY };
    updateViewBox();
}

function stopPanning(e) {
    isPanning = false;
    svg.classList.remove("panning"); 
}

function resizeCanvas() {
    const cx = viewBox.x + viewBox.w / 2;
    const cy = viewBox.y + viewBox.h / 2;
    const width = window.innerWidth;
    const height = window.innerHeight;
    viewBox.w = width;
    viewBox.h = height;
    viewBox.x = cx - width / 2;
    viewBox.y = cy - height / 2;
    updateViewBox();
}

function getCurrentZoom() {
    const baseWidth = 1000; 
    return baseWidth / viewBox.w;
}

function getGlobalMouse(e) {
    const rect = svg.getBoundingClientRect();
    const x = viewBox.x + (e.clientX - rect.left) * (viewBox.w / rect.width);
    const y = viewBox.y + (e.clientY - rect.top) * (viewBox.h / rect.height);
    return [x, y];
}

export default {
    initializeViewBox,
    updateViewBox,
    drawGrid,
    updateZoom,
    startPanning,
    updatePanning,
    stopPanning,
    resizeCanvas,
    getCurrentZoom,
    getGlobalMouse
}