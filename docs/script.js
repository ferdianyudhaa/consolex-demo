// ==========================================
// 1. INISIALISASI ELEMEN HTML (DOM)
// ==========================================
const energySlider = document.getElementById('energy-slider');
const energyVal = document.getElementById('energy-val');
const rhoSlider = document.getElementById('rho-slider');
const rhoVal = document.getElementById('rho-val');
const btnCalculate = document.getElementById('btn-calculate');

// Mengambil elemen Canvas
const canvasSetup = document.getElementById('canvas-setup');
const ctxSetup = canvasSetup.getContext('2d');
const canvasBatho = document.getElementById('canvas-batho');
const ctxBatho = canvasBatho.getContext('2d');
const canvasEtar = document.getElementById('canvas-etar');
const ctxEtar = canvasEtar.getContext('2d');

const CANVAS_SIZE = 400;
canvasSetup.width = CANVAS_SIZE; canvasSetup.height = CANVAS_SIZE;
canvasBatho.width = CANVAS_SIZE; canvasBatho.height = CANVAS_SIZE;
canvasEtar.width = CANVAS_SIZE; canvasEtar.height = CANVAS_SIZE;

// ==========================================
// 2. STATE & VARIABEL OBJEK (PHANTOM)
// ==========================================
let inhomoBlock = { x: 100, y: 150, width: 200, height: 100, isDragging: false };
let startMouseX, startMouseY;

function drawSetupCanvas() {
    ctxSetup.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctxSetup.fillStyle = "#e0f7fa";
    ctxSetup.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    ctxSetup.fillStyle = inhomoBlock.isDragging ? "#7f8c8d" : "#95a5a6";
    ctxSetup.fillRect(inhomoBlock.x, inhomoBlock.y, inhomoBlock.width, inhomoBlock.height);

    ctxSetup.beginPath();
    ctxSetup.setLineDash([5, 5]);
    ctxSetup.moveTo(CANVAS_SIZE / 2, 0);
    ctxSetup.lineTo(CANVAS_SIZE / 2, CANVAS_SIZE);
    ctxSetup.strokeStyle = "#e74c3c";
    ctxSetup.lineWidth = 2;
    ctxSetup.stroke();
    ctxSetup.setLineDash([]);
}

// Logika Drag and Drop Phantom
function isMouseInBlock(mx, my) {
    return (mx >= inhomoBlock.x && mx <= inhomoBlock.x + inhomoBlock.width &&
            my >= inhomoBlock.y && my <= inhomoBlock.y + inhomoBlock.height);
}

canvasSetup.addEventListener('mousedown', function(e) {
    const rect = canvasSetup.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) * (CANVAS_SIZE / rect.width);
    const mouseY = (e.clientY - rect.top) * (CANVAS_SIZE / rect.height);
    if (isMouseInBlock(mouseX, mouseY)) {
        inhomoBlock.isDragging = true;
        startMouseX = mouseX - inhomoBlock.x;
        startMouseY = mouseY - inhomoBlock.y;
    }
});

canvasSetup.addEventListener('mousemove', function(e) {
    const rect = canvasSetup.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) * (CANVAS_SIZE / rect.width);
    const mouseY = (e.clientY - rect.top) * (CANVAS_SIZE / rect.height);
    canvasSetup.style.cursor = isMouseInBlock(mouseX, mouseY) ? 'grab' : 'default';

    if (inhomoBlock.isDragging) {
        canvasSetup.style.cursor = 'grabbing';
        inhomoBlock.x = Math.max(0, Math.min(mouseX - startMouseX, CANVAS_SIZE - inhomoBlock.width));
        inhomoBlock.y = Math.max(0, Math.min(mouseY - startMouseY, CANVAS_SIZE - inhomoBlock.height));
        drawSetupCanvas();
    }
});

canvasSetup.addEventListener('mouseup', () => { inhomoBlock.isDragging = false; drawSetupCanvas(); });
canvasSetup.addEventListener('mouseleave', () => { inhomoBlock.isDragging = false; drawSetupCanvas(); });

energySlider.addEventListener('input', () => energyVal.innerText = energySlider.value);
rhoSlider.addEventListener('input', () => rhoVal.innerText = rhoSlider.value);


// ==========================================
// 3. INISIALISASI GRAFIK (CHART.JS)
// ==========================================
const ctxPdd = document.getElementById('chart-pdd').getContext('2d');
const ctxProfile = document.getElementById('chart-profile').getContext('2d');
const depthLabels = Array.from({length: CANVAS_SIZE}, (_, i) => i);
const profileLabels = Array.from({length: CANVAS_SIZE}, (_, i) => i - CANVAS_SIZE/2);

let pddChart = new Chart(ctxPdd, {
    type: 'line',
    data: {
        labels: depthLabels,
        datasets: [
            { label: 'Batho PDD', data: [], borderColor: '#e74c3c', borderWidth: 2, pointRadius: 0, tension: 0.1 },
            { label: 'ETAR PDD', data: [], borderColor: '#2ecc71', borderWidth: 2, pointRadius: 0, tension: 0.1 }
        ]
    },
    options: { responsive: true, maintainAspectRatio: false, scales: { y: { max: 1.0 }, x: { title: { display: true, text: 'Depth (px)' } } } }
});

let profileChart = new Chart(ctxProfile, {
    type: 'line',
    data: {
        labels: profileLabels,
        datasets: [
            { label: 'Batho Profile', data: [], borderColor: '#3498db', borderWidth: 2, pointRadius: 0, tension: 0.1 },
            { label: 'ETAR Profile', data: [], borderColor: '#9b59b6', borderWidth: 2, pointRadius: 0, tension: 0.1 }
        ]
    },
    options: { responsive: true, maintainAspectRatio: false, scales: { y: { max: 1.0 }, x: { title: { display: true, text: 'Off-Axis Distance' } } } }
});

function updateCharts(bathoMatrix, etarMatrix) {
    const centralAxisX = Math.floor(CANVAS_SIZE / 2);
    const depthY = 200; // Profil diambil di kedalaman ini

    pddChart.data.datasets[0].data = bathoMatrix[centralAxisX];
    pddChart.data.datasets[1].data = etarMatrix[centralAxisX];
    
    profileChart.data.datasets[0].data = bathoMatrix.map(col => col[depthY]);
    profileChart.data.datasets[1].data = etarMatrix.map(col => col[depthY]);

    pddChart.update();
    profileChart.update();
}
// ==========================================
// 4. LOGIKA FISIKA & RENDER
// ==========================================
function getHeatmapColor(value) {
    const h = (1.0 - value) * 240; 
    return `hsl(${h}, 100%, 50%)`;
}

function renderHeatmap(matrix, ctx) {
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    const pixelSize = 4; 
    for (let x = 0; x < CANVAS_SIZE; x += pixelSize) {
        for (let y = 0; y < CANVAS_SIZE; y += pixelSize) {
            ctx.fillStyle = getHeatmapColor(matrix[x][y]);
            ctx.fillRect(x, y, pixelSize, pixelSize);
        }
    }
}

function runBathoSimulation() {
    const rhoInhomo = parseFloat(rhoSlider.value);
    const muAir = 0.05; 
    const fieldStartX = CANVAS_SIZE / 2 - 50;
    const fieldEndX = CANVAS_SIZE / 2 + 50;
    let doseMatrix = [];

    for (let x = 0; x < CANVAS_SIZE; x++) {
        let doseCol = []; let d_eff = 0;
        for (let y = 0; y < CANVAS_SIZE; y++) {
            let isInField = (x >= fieldStartX && x <= fieldEndX);
            let isInsideInhomo = (x >= inhomoBlock.x && x <= inhomoBlock.x + inhomoBlock.width && y >= inhomoBlock.y && y <= inhomoBlock.y + inhomoBlock.height);
            d_eff += (isInsideInhomo ? rhoInhomo : 1.0) * 1; 
            doseCol.push(isInField ? Math.exp(-muAir * (d_eff / 10)) : 0.05);
        }
        doseMatrix.push(doseCol);
    }
    renderHeatmap(doseMatrix, ctxBatho);
    return doseMatrix; // Mengembalikan data untuk grafik
}

function runETARSimulation() {
    const rhoInhomo = parseFloat(rhoSlider.value);
    const muAir = 0.05; 
    const fieldStartX = CANVAS_SIZE / 2 - 50;
    const fieldEndX = CANVAS_SIZE / 2 + 50;
    const scatterRadius = 15; 
    let etarMatrix = [];

    for (let x = 0; x < CANVAS_SIZE; x++) {
        let doseCol = []; let d_eff = 0;
        for (let y = 0; y < CANVAS_SIZE; y++) {
            let isInField = (x >= fieldStartX && x <= fieldEndX);
            let lateralDensitySum = 0; let weightSum = 0;

            for (let dx = -scatterRadius; dx <= scatterRadius; dx++) {
                let checkX = x + dx;
                if (checkX >= 0 && checkX < CANVAS_SIZE) {
                    let isInsideInhomo = (checkX >= inhomoBlock.x && checkX <= inhomoBlock.x + inhomoBlock.width && y >= inhomoBlock.y && y <= inhomoBlock.y + inhomoBlock.height);
                    let weight = Math.exp(-(dx * dx) / (2 * 5 * 5)); 
                    lateralDensitySum += (isInsideInhomo ? rhoInhomo : 1.0) * weight;
                    weightSum += weight;
                }
            }
            d_eff += (lateralDensitySum / weightSum) * 1; 
            
            let dose = isInField ? Math.exp(-muAir * (d_eff / 10)) : 0.05;
            if (x > fieldStartX - 10 && x < fieldStartX + 10) dose *= 0.5;
            if (x > fieldEndX - 10 && x < fieldEndX + 10) dose *= 0.5;
            doseCol.push(dose);
        }
        etarMatrix.push(doseCol);
    }
    renderHeatmap(etarMatrix, ctxEtar);
    return etarMatrix; // Mengembalikan data untuk grafik
}

// ==========================================
// 5. TOMBOL EKSEKUSI & STARTUP
// ==========================================
btnCalculate.onclick = () => {
    const originalText = btnCalculate.innerText;
    btnCalculate.innerText = "Menghitung Matriks (Batho & ETAR)...";
    btnCalculate.style.backgroundColor = "#e67e22";

    setTimeout(() => {
        // Menjalankan kedua simulasi dan menangkap datanya
        let bathoData = runBathoSimulation(); 
        let etarData = runETARSimulation();
        
        // Memasukkan kedua data ke dalam grafik
        updateCharts(bathoData, etarData);
        
        btnCalculate.innerText = originalText;
        btnCalculate.style.backgroundColor = "#27ae60";
    }, 100);
};

window.onload = () => {
    drawSetupCanvas();
    btnCalculate.click();
};