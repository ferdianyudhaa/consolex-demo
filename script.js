// ==========================================
// 1. INISIALISASI ELEMEN UI
// ==========================================
const inputDensity = document.getElementById('input-density');
const inputThickness = document.getElementById('input-thickness');
const inputDepth = document.getElementById('input-depth');
const inputField = document.getElementById('input-field');
const inputDmax = document.getElementById('input-dmax');
const btnCalculate = document.getElementById('btn-calculate');

// Kanvas Setup (Panel 2)
const canvasSetup = document.getElementById('canvas-setup');
const ctxSetup = canvasSetup.getContext('2d');

// Kanvas Batho (Panel 3)
const canvasBatho = document.getElementById('canvas-batho');
const ctxBatho = canvasBatho.getContext('2d');
const offscreenBatho = document.createElement('canvas');
const ctxOffBatho = offscreenBatho.getContext('2d');

// Kanvas ETAR (Panel 4)
const canvasEtar = document.getElementById('canvas-etar');
const ctxEtar = canvasEtar.getContext('2d');
const offscreenEtar = document.createElement('canvas');
const ctxOffEtar = offscreenEtar.getContext('2d');

// Chart.js Instances (Panel 5 & 6)
let pddChart = null;
let profileChart = null;

// ==========================================
// 2. VARIABEL FISIKA & GEOMETRI
// ==========================================
const PPCM = 10; 
const CANVAS_SIZE = 400; 
const HEATMAP_WIDTH = 330; 

canvasSetup.width = CANVAS_SIZE; canvasSetup.height = CANVAS_SIZE;
canvasBatho.width = CANVAS_SIZE; canvasBatho.height = CANVAS_SIZE;
offscreenBatho.width = CANVAS_SIZE; offscreenBatho.height = CANVAS_SIZE;
canvasEtar.width = CANVAS_SIZE; canvasEtar.height = CANVAS_SIZE;
offscreenEtar.width = CANVAS_SIZE; offscreenEtar.height = CANVAS_SIZE;

const centerX = CANVAS_SIZE / 2;

let box = {
    x: centerX - 60,
    y: 50,
    width: 120,
    height: parseFloat(inputThickness.value) * PPCM
};

let isDragging = false;
let isResizing = false;
let startY;
const resizeMargin = 10;

// ==========================================
// 3. FUNGSI FISIKA CORE
// ==========================================
function getTAR(depthCm, fieldSizeCm) {
    if (depthCm <= 0) return 1.0;
    let mu = 0.05 - (fieldSizeCm * 0.0005); 
    return Math.exp(-mu * depthCm);
}

function getPhysicalDensityAt(x, y) {
    if (x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height) {
        return parseFloat(inputDensity.value);
    }
    return 1.0; 
}

function getEffectiveDensity(x, y, fsPx_half) {
    let sumRho = 0; let sumWeight = 0;
    let scatterRadius = Math.min(fsPx_half, 50); 
    
    for (let dx = -scatterRadius; dx <= scatterRadius; dx += 5) {
        let currX = x + dx;
        let weight = Math.exp(-(dx * dx) / (2 * 15 * 15)); 
        sumRho += getPhysicalDensityAt(currX, y) * weight;
        sumWeight += weight;
    }
    return sumRho / sumWeight;
}

function calculateDoseBathoAt(x, y) {
    let fs = parseInt(inputField.value); let fsPx_half = (fs * PPCM) / 2;
    let depth_cm = y / PPCM; let rho_e = parseFloat(inputDensity.value);
    let d1_cm = box.y / PPCM; let d2_cm = (box.y + box.height) / PPCM;

    if (x < centerX - fsPx_half || x > centerX + fsPx_half) return 0; 

    let tar_homogen = getTAR(depth_cm, fs);
    let isUnderBox = (x >= box.x && x <= box.x + box.width); 
    
    if (isUnderBox && depth_cm > d2_cm) {
        let tar1 = getTAR(depth_cm - d1_cm, fs); let tar2 = getTAR(depth_cm - d2_cm, fs);
        if (tar1 > 0 && tar2 > 0) return tar_homogen * Math.pow((tar2 / tar1), (rho_e - 1));
    } else if (isUnderBox && depth_cm > d1_cm && depth_cm <= d2_cm) {
        let tar1 = getTAR(depth_cm - d1_cm, fs); let tar2 = getTAR(0.1, fs);
        if (tar1 > 0) return tar_homogen * Math.pow((tar2 / tar1), (rho_e - 1));
    }
    return tar_homogen;
}

function calculateDoseEtarAt(x, y) {
    let fs = parseInt(inputField.value); let fsPx_half = (fs * PPCM) / 2;
    if (x < centerX - fsPx_half - 15 || x > centerX + fsPx_half + 15) return 0; 

    let depth_cm = y / PPCM; let rho_e = parseFloat(inputDensity.value);
    let d1_px = box.y; let d2_px = box.y + box.height;
    let waterEqDepth_cm = depth_cm;
    let isInXRange = (x >= box.x - 20 && x <= box.x + box.width + 20);

    if (isInXRange) {
        if (y > d1_px && y <= d2_px) waterEqDepth_cm = (d1_px + (y - d1_px) * rho_e) / PPCM;
        else if (y > d2_px) waterEqDepth_cm = (d1_px + (d2_px - d1_px) * rho_e + (y - d2_px)) / PPCM;
    }

    let rho_tilde = getEffectiveDensity(x, y, fsPx_half);
    let tar_scaled = getTAR(waterEqDepth_cm, fs * rho_tilde);
    
    let lateralDistance = Math.abs(x - centerX);
    let penumbraFactor = 1.0;
    if (lateralDistance > fsPx_half - 10) {
        penumbraFactor = Math.max(0, 1 - (lateralDistance - (fsPx_half - 10)) / 20); 
    }

    return tar_scaled * penumbraFactor;
}

function getColorForDose(val) {
    if (val <= 0.01) return "#000033"; 
    val = Math.max(0, Math.min(1, val)); 
    return `hsl(${(1 - val) * 240}, 100%, 50%)`;
}

// ==========================================
// 4. FUNGSI RENDER KANVAS
// ==========================================
function drawColorbar(ctx) {
    ctx.fillStyle = "#ffffff"; ctx.fillRect(HEATMAP_WIDTH, 0, CANVAS_SIZE - HEATMAP_WIDTH, CANVAS_SIZE);
    let grad = ctx.createLinearGradient(0, 20, 0, 380);
    grad.addColorStop(0, "hsl(0, 100%, 50%)");     
    grad.addColorStop(0.5, "hsl(120, 100%, 50%)"); 
    grad.addColorStop(1, "hsl(240, 100%, 50%)");   
    ctx.fillStyle = grad; ctx.fillRect(HEATMAP_WIDTH + 10, 20, 15, 360);
    ctx.fillStyle = "#2c3e50"; ctx.font = "bold 11px Arial"; ctx.textAlign = "left";
    ctx.fillText("100%", HEATMAP_WIDTH + 30, 25);
    ctx.fillText("50%", HEATMAP_WIDTH + 30, 205);
    ctx.fillText("0%", HEATMAP_WIDTH + 30, 380);
}

function drawAllHeatmaps() {
    ctxOffBatho.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctxOffEtar.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    
    const block_size = 3; 
    for (let y = 0; y < CANVAS_SIZE; y += block_size) {
        for (let x = 0; x < HEATMAP_WIDTH; x += block_size) {
            ctxOffBatho.fillStyle = getColorForDose(calculateDoseBathoAt(x, y));
            ctxOffBatho.fillRect(x, y, block_size, block_size);
            ctxOffEtar.fillStyle = getColorForDose(calculateDoseEtarAt(x, y));
            ctxOffEtar.fillRect(x, y, block_size, block_size);
        }
    }
    drawColorbar(ctxOffBatho); drawColorbar(ctxOffEtar);

    ctxBatho.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE); ctxBatho.drawImage(offscreenBatho, 0, 0);
    ctxEtar.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE); ctxEtar.drawImage(offscreenEtar, 0, 0);
}

function drawPhantom() {
    ctxSetup.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctxSetup.fillStyle = "#e0f7fa"; ctxSetup.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    
    ctxSetup.fillStyle = "#2c3e50"; ctxSetup.font = "10px Arial"; ctxSetup.textAlign = "right";
    for (let i = 0; i <= 40; i += 5) {
        let yPos = i * PPCM;
        ctxSetup.fillText(i + " cm", 35, yPos + 4);
        ctxSetup.beginPath(); ctxSetup.moveTo(40, yPos); ctxSetup.lineTo(45, yPos);
        ctxSetup.strokeStyle = "#34495e"; ctxSetup.stroke();
    }

    let fsPx = parseInt(inputField.value) * PPCM;
    ctxSetup.fillStyle = "rgba(241, 196, 15, 0.25)";
    ctxSetup.fillRect(centerX - (fsPx / 2), 0, fsPx, CANVAS_SIZE);

    ctxSetup.fillStyle = "#95a5a6";
    ctxSetup.fillRect(box.x, box.y, box.width, box.height);
    
    let d1 = box.y / PPCM; let d2 = (box.y + box.height) / PPCM;
    ctxSetup.fillStyle = "#c0392b"; ctxSetup.font = "bold 12px Arial"; ctxSetup.textAlign = "center";
    ctxSetup.fillText(`d1 = ${d1.toFixed(1)} cm`, centerX, box.y - 8);
    ctxSetup.fillText(`d2 = ${d2.toFixed(1)} cm`, centerX, box.y + box.height + 15);

    ctxSetup.beginPath(); ctxSetup.setLineDash([5, 5]);
    ctxSetup.moveTo(centerX, 0); ctxSetup.lineTo(centerX, CANVAS_SIZE);
    ctxSetup.strokeStyle = "#e74c3c"; ctxSetup.stroke(); ctxSetup.setLineDash([]);

    let tDepthPx = parseFloat(inputDepth.value) * PPCM;
    ctxSetup.beginPath(); ctxSetup.arc(centerX, tDepthPx, 6, 0, 2 * Math.PI);
    ctxSetup.strokeStyle = "#27ae60"; ctxSetup.lineWidth = 2; ctxSetup.stroke();
    ctxSetup.beginPath();
    ctxSetup.moveTo(centerX - 10, tDepthPx); ctxSetup.lineTo(centerX + 10, tDepthPx);
    ctxSetup.moveTo(centerX, tDepthPx - 10); ctxSetup.lineTo(centerX, tDepthPx + 10);
    ctxSetup.stroke(); ctxSetup.lineWidth = 1;

    drawAllHeatmaps();
}

// ==========================================
// 5. SYNCHRONIZED TOOLTIP
// ==========================================
function renderTooltipOn(ctx, x, y, title, dosePercent, effectiveRho) {
    if (x >= HEATMAP_WIDTH) return;
    let dmax = parseFloat(inputDmax.value); let doseAbs = dosePercent * dmax;
    let depthCm = y / PPCM; let offAxisCm = (x - centerX) / PPCM;
    let boxWidth = 140; let boxHeight = effectiveRho ? 85 : 70;
    let boxX = x + 15; let boxY = y + 15;
    
    if (boxX + boxWidth > CANVAS_SIZE) boxX = x - boxWidth - 10;
    if (boxY + boxHeight > CANVAS_SIZE) boxY = y - boxHeight - 10;

    ctx.fillStyle = "rgba(44, 62, 80, 0.9)";
    ctx.beginPath(); ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 6); ctx.fill();

    ctx.fillStyle = "#ecf0f1"; ctx.font = "bold 11px Consolas, monospace"; ctx.textAlign = "left";
    ctx.fillText(`[ ${title} ]`, boxX + 10, boxY + 18);
    ctx.font = "11px Consolas, monospace"; ctx.fillText(`Depth : ${depthCm.toFixed(1)} cm`, boxX + 10, boxY + 35);
    
    let lineY = boxY + 50;
    if (effectiveRho) {
        ctx.fillStyle = "#3498db"; ctx.fillText(`ρ_eff : ${effectiveRho.toFixed(2)}`, boxX + 10, lineY); lineY += 15;
    }
    ctx.fillStyle = "#f1c40f"; ctx.fillText(`Dose %: ${(dosePercent * 100).toFixed(1)}%`, boxX + 10, lineY);
    ctx.fillStyle = "#2ecc71"; ctx.fillText(`Dose  : ${doseAbs.toFixed(1)} cGy`, boxX + 10, lineY + 15);

    ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fillStyle = "white"; ctx.fill();
    ctx.strokeStyle = "#e74c3c"; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x-8, y); ctx.lineTo(x+8, y); ctx.moveTo(x, y-8); ctx.lineTo(x, y+8); ctx.stroke();
}

function handleMouseMove(e, sourceCanvas) {
    let rect = sourceCanvas.getBoundingClientRect();
    let x = (e.clientX - rect.left) * (sourceCanvas.width / rect.width);
    let y = (e.clientY - rect.top) * (sourceCanvas.height / rect.height);

    ctxBatho.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE); ctxBatho.drawImage(offscreenBatho, 0, 0);
    ctxEtar.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE); ctxEtar.drawImage(offscreenEtar, 0, 0);

    renderTooltipOn(ctxBatho, x, y, "BATHO", calculateDoseBathoAt(x, y), null);
    renderTooltipOn(ctxEtar, x, y, "ETAR", calculateDoseEtarAt(x, y), getEffectiveDensity(x, y, (parseInt(inputField.value) * PPCM) / 2));
}

canvasBatho.addEventListener('mousemove', (e) => handleMouseMove(e, canvasBatho));
canvasEtar.addEventListener('mousemove', (e) => handleMouseMove(e, canvasEtar));
canvasBatho.addEventListener('mouseleave', () => {
    ctxBatho.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE); ctxBatho.drawImage(offscreenBatho, 0, 0);
    ctxEtar.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE); ctxEtar.drawImage(offscreenEtar, 0, 0);
});
canvasEtar.addEventListener('mouseleave', () => {
    ctxBatho.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE); ctxBatho.drawImage(offscreenBatho, 0, 0);
    ctxEtar.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE); ctxEtar.drawImage(offscreenEtar, 0, 0);
});

// ==========================================
// 6. EVENT LISTENERS (INTERAKSI & KLIK)
// ==========================================
inputDensity.addEventListener('input', drawPhantom);
inputDepth.addEventListener('input', drawPhantom);
inputField.addEventListener('change', drawPhantom);
inputThickness.addEventListener('input', () => {
    let val = parseFloat(inputThickness.value);
    if (!isNaN(val) && val > 0) { box.height = val * PPCM; drawPhantom(); }
});

canvasSetup.addEventListener('mousemove', function(e) {
    let rect = canvasSetup.getBoundingClientRect();
    let mX = (e.clientX - rect.left) * (CANVAS_SIZE / rect.width); let mY = (e.clientY - rect.top) * (CANVAS_SIZE / rect.height);
    let isNearBottom = (mX >= box.x && mX <= box.x + box.width && Math.abs(mY - (box.y + box.height)) <= resizeMargin);

    if (!isDragging && !isResizing) {
        canvasSetup.style.cursor = isNearBottom ? "ns-resize" : (mX >= box.x && mX <= box.x + box.width && mY >= box.y && mY <= box.y + box.height) ? "grab" : "default";
    }

    if (isDragging) {
        box.y = mY - startY; if (box.y < 0) box.y = 0; drawPhantom();
    } else if (isResizing) {
        let newH = mY - box.y; if (newH > 5) { box.height = newH; inputThickness.value = (newH / PPCM).toFixed(1); } drawPhantom();
    }
});

canvasSetup.addEventListener('mousedown', function(e) {
    let rect = canvasSetup.getBoundingClientRect(); let mY = (e.clientY - rect.top) * (CANVAS_SIZE / rect.height);
    if (canvasSetup.style.cursor === "ns-resize") isResizing = true; 
    else if (canvasSetup.style.cursor === "grab") { isDragging = true; startY = mY - box.y; canvasSetup.style.cursor = "grabbing"; }
});

canvasSetup.addEventListener('mouseup', () => { isDragging = false; isResizing = false; });
canvasSetup.addEventListener('mouseleave', () => { isDragging = false; isResizing = false; });

// ==========================================
// 7. CHART.JS (LOGIKA TOMBOL RUN GRAFIK)
// ==========================================
function initCharts() {
    const ctxPDD = document.getElementById('chart-pdd').getContext('2d');
    const ctxProfile = document.getElementById('chart-profile').getContext('2d');

    pddChart = new Chart(ctxPDD, {
        type: 'line',
        data: { labels: [], datasets: [] },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: { x: { title: { display: true, text: 'Kedalaman (cm)' } }, y: { title: { display: true, text: 'Dosis Absolut (cGy)' }, beginAtZero: true } },
            plugins: { title: { display: true, text: 'PDD pada Central Axis' } }
        }
    });

    profileChart = new Chart(ctxProfile, {
        type: 'line',
        data: { labels: [], datasets: [] },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: { x: { title: { display: true, text: 'Jarak Off-Axis (cm)' } }, y: { title: { display: true, text: 'Dosis Absolut (cGy)' }, beginAtZero: true } },
            plugins: { title: { display: true, text: 'Profil Berkas pada Kedalaman Target' } }
        }
    });
}

// Fungsi Pengekstrak Data saat Tombol Run Diklik
btnCalculate.addEventListener('click', () => {
    let dmax = parseFloat(inputDmax.value);
    let targetDepthPx = parseFloat(inputDepth.value) * PPCM;

    // --- Data PDD (Sepanjang Sumbu Y Tengah) ---
    let pddLabels = []; let bathoPDD = []; let etarPDD = [];
    for (let y = 0; y <= 400; y += 10) { // Ambil tiap 1 cm
        pddLabels.push((y / PPCM).toFixed(1));
        bathoPDD.push(calculateDoseBathoAt(centerX, y) * dmax);
        etarPDD.push(calculateDoseEtarAt(centerX, y) * dmax);
    }

    pddChart.data.labels = pddLabels;
    pddChart.data.datasets = [
        { label: 'Batho', data: bathoPDD, borderColor: '#e74c3c', backgroundColor: 'rgba(231, 76, 60, 0.2)', fill: true, tension: 0.3 },
        { label: 'ETAR', data: etarPDD, borderColor: '#2ecc71', backgroundColor: 'rgba(46, 204, 113, 0.2)', fill: true, tension: 0.3 }
    ];
    pddChart.update();

    // --- Data Profile (Sepanjang Sumbu X di Kedalaman Target) ---
    let profLabels = []; let bathoProf = []; let etarProf = [];
    for (let x = 0; x <= 400; x += 5) { // Ambil tiap 0.5 cm
        profLabels.push(((x - centerX) / PPCM).toFixed(1));
        bathoProf.push(calculateDoseBathoAt(x, targetDepthPx) * dmax);
        etarProf.push(calculateDoseEtarAt(x, targetDepthPx) * dmax);
    }

    profileChart.data.labels = profLabels;
    profileChart.data.datasets = [
        { label: 'Batho', data: bathoProf, borderColor: '#3498db', tension: 0.1 },
        { label: 'ETAR', data: etarProf, borderColor: '#9b59b6', tension: 0.1 }
    ];
    profileChart.update();

    // Gulir halaman secara otomatis ke area grafik
    document.getElementById('panel-pdd').scrollIntoView({ behavior: 'smooth' });
});

// Render awal
initCharts();
drawPhantom();