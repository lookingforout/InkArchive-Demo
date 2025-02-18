const canvas = document.getElementById("drawingCanvas");
const ctx = canvas.getContext("2d");

let isDrawing = false;
let brushSize = 5;
let brushColor = "#000000";
let currentTool = "pencil";
let startX, startY;
let textMode = false;

const undoStack = [];
const redoStack = [];

const layerContainer = document.getElementById("layerContainer");
let layers = [];
let activeLayerIndex = 0;

function saveState() {
    redoStack.length = 0;
    const state = layers.map(layer => layer.canvas.toDataURL());
    undoStack.push(state);
    if (undoStack.length > 50) undoStack.shift();
}

function restoreState(stackFrom, stackTo) {
    if (stackFrom.length > 0) {
        stackTo.push(layers.map(layer => layer.canvas.toDataURL()));

        const previousState = stackFrom.pop();
        previousState.forEach((dataUrl, index) => {
            const img = new Image();
            img.src = dataUrl;
            img.onload = () => {
                layers[index].ctx.clearRect(0, 0, canvas.width, canvas.height);
                layers[index].ctx.drawImage(img, 0, 0);
                if (index === previousState.length - 1) {
                    drawLayers();
                }
            };
        });
    }
}

function undo() {
    restoreState(undoStack, redoStack);
}

function redo() {
    restoreState(redoStack, undoStack);
}


const tools = {
    pencil: () => { currentTool = "pencil"; },
    brush: () => { currentTool = "brush"; },
    eraser: () => { currentTool = "eraser"; },
    bucket: () => { currentTool = "bucket"; },
    colorPicker: () => { currentTool = "colorPicker"; },
    select: () => { currentTool = "select"; },
    transform: () => { currentTool = "transform"; },
    hand: () => { currentTool = "hand"; },
    text: () => { currentTool = "text"; textMode = true; }
};

document.querySelectorAll(".tool-button").forEach(button => {
    button.addEventListener("click", () => {
        tools[button.id]();
    });
});

canvas.addEventListener("mousedown", (e) => {
    isDrawing = true;
    startX = e.offsetX;
    startY = e.offsetY;

    if (currentTool === "bucket") {
        saveState();
        layers[activeLayerIndex].ctx.fillStyle = brushColor;
        layers[activeLayerIndex].ctx.fillRect(0, 0, canvas.width, canvas.height);
        isDrawing = false;
        drawLayers();
    } else if (currentTool === "colorPicker") {
        const imgData = ctx.getImageData(e.offsetX, e.offsetY, 1, 1).data;
        brushColor = `rgb(${imgData[0]}, ${imgData[1]}, ${imgData[2]})`;
        document.getElementById("colorPicker").value = rgbToHex(imgData[0], imgData[1], imgData[2]);
        isDrawing = false;
    } else if (currentTool === "text" && textMode) {
        saveState();
        const text = prompt("Enter text:");
        if (text) {
            layers[activeLayerIndex].ctx.fillStyle = brushColor;
            layers[activeLayerIndex].ctx.font = `${brushSize * 2}px Arial`;
            layers[activeLayerIndex].ctx.fillText(text, e.offsetX, e.offsetY);
        }
        textMode = false;
        drawLayers();
    } else {
        saveState();
        layers[activeLayerIndex].ctx.beginPath();
        layers[activeLayerIndex].ctx.moveTo(e.offsetX, e.offsetY);
    }
});

canvas.addEventListener("mousemove", (e) => {
    if (!isDrawing) return;

    const ctx = layers[activeLayerIndex].ctx;

    if (currentTool === "pencil" || currentTool === "brush") {
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = currentTool === "brush" ? brushSize : 1;
        ctx.lineCap = "round";
        ctx.stroke();
    } else if (currentTool === "eraser") {
        ctx.clearRect(e.offsetX, e.offsetY, brushSize, brushSize);
    }

    drawLayers();
});

canvas.addEventListener("mouseup", () => {
    isDrawing = false;
});

document.getElementById("colorPicker").addEventListener("input", (e) => {
    brushColor = e.target.value;
});

function addLayer() {
    const layer = {
        id: `Layer ${layers.length + 1}`,
        canvas: document.createElement("canvas"),
        ctx: null
    };

    layer.canvas.width = canvas.width;
    layer.canvas.height = canvas.height;
    layer.ctx = layer.canvas.getContext("2d");

    layers.push(layer);
    activeLayerIndex = layers.length - 1;
    updateLayerUI();
    drawLayers();
}

function deleteLayer() {
    if (layers.length > 1) {
        layers.splice(activeLayerIndex, 1);
        activeLayerIndex = Math.max(0, activeLayerIndex - 1);
        updateLayerUI();
        drawLayers();
    }
}

function moveLayerUp(index) {
    if (index > 0) {
        [layers[index], layers[index - 1]] = [layers[index - 1], layers[index]];
        activeLayerIndex = index - 1;
        updateLayerUI();
        drawLayers();
    }
}

function moveLayerDown(index) {
    if (index < layers.length - 1) {
        [layers[index], layers[index + 1]] = [layers[index + 1], layers[index]];
        activeLayerIndex = index + 1;
        updateLayerUI();
        drawLayers();
    }
}

function selectLayer(index) {
    activeLayerIndex = index;
    updateLayerUI();
}

function updateLayerUI() {
    layerContainer.innerHTML = "";
    layers.forEach((layer, index) => {
        const layerDiv = document.createElement("div");
        layerDiv.classList.add("layer");
        if (index === activeLayerIndex) layerDiv.classList.add("selected");

        layerDiv.innerHTML = `
            <span>${layer.id}</span>
            <div class="layer-controls">
                <button onclick="moveLayerUp(${index})">⬆️</button>
                <button onclick="moveLayerDown(${index})">⬇️</button>
            </div>
        `;

        layerDiv.addEventListener("click", () => selectLayer(index));
        layerContainer.appendChild(layerDiv);
    });
}

function drawLayers() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    layers.forEach(layer => {
        ctx.drawImage(layer.canvas, 0, 0);
    });
}

function rgbToHex(r, g, b) {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "z") {
        e.preventDefault();
        undo();
    }
    if (e.ctrlKey && e.key === "r") {
        e.preventDefault();
        redo();
    }
});

addLayer();

document.addEventListener('DOMContentLoaded', () => {
    const colorPicker = new iro.ColorPicker("#colorPicker", {
        width: 180,
        color: "#000000",
        borderWidth: 2
    });

    const colorIndicator = document.getElementById('color-indicator');
    const hexCodeText = document.getElementById('hex-code');

    function updateColor(color) {
        brushColor = color.hexString;  // Update the brush color
        colorIndicator.style.backgroundColor = color.hexString;
        hexCodeText.textContent = color.hexString;
    }

    colorPicker.on('color:change', (color) => {
        updateColor(color);
    });
});
