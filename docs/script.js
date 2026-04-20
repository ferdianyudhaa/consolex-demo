// --- 1. INISIALISASI ELEMEN UI ---
const energySlider = document.getElementById('energy-slider');
const energyVal = document.getElementById('energy-val');
const rhoSlider = document.getElementById('rho-slider');
const rhoVal = document.getElementById('rho-val');
const btnCalculate = document.getElementById('btn-calculate');

const canvasSetup = document.getElementById('canvas-setup');
const ctxSetup = canvasSetup.getContext('2d');

// --- 2. VARIABEL OBJEK PHANTOM ---
// Mengatur ukuran dan posisi awal kotak material inhomogen
let box = {
    x: 100,
    y: 150,
    width: 200,
    height: 100
};
let isDragging = false;
let startX, startY;

// Mengatur ukuran canvas agar presisi
canvasSetup.width = 400;
canvasSetup.height = 400;

// --- 3. FUNGSI MENGGAMBAR PHANTOM ---
function drawPhantom() {
    // Bersihkan layar
    ctxSetup.clearRect(0, 0, canvasSetup.width, canvasSetup.height);

    // 1. Gambar Medium Air (Background Biru Muda)
    ctxSetup.fillStyle = "#e0f7fa";
    ctxSetup.fillRect(0, 0, canvasSetup.width, canvasSetup.height);

    // 2. Gambar Material Inhomogen (Kotak Abu-abu)
    ctxSetup.fillStyle = "#95a5a6";
    ctxSetup.fillRect(box.x, box.y, box.width, box.height);
    
    // 3. Gambar Garis Berkas Radiasi (Garis Putus-putus Merah di tengah)
    ctxSetup.beginPath();
    ctxSetup.setLineDash([5, 5]);
    ctxSetup.moveTo(canvasSetup.width / 2, 0);
    ctxSetup.lineTo(canvasSetup.width / 2, canvasSetup.height);
    ctxSetup.strokeStyle = "red";
    ctxSetup.stroke();
    ctxSetup.setLineDash([]); // Reset garis
}

// --- 4. FUNGSI INTERAKTIF (EVENT LISTENERS) ---

// A. Interaksi Slider
energySlider.addEventListener('input', () => {
    energyVal.innerText = energySlider.value;
});

rhoSlider.addEventListener('input', () => {
    rhoVal.innerText = rhoSlider.value;
});

// B. Interaksi Drag & Drop Kotak (Mouse)
canvasSetup.addEventListener('mousedown', function(e) {
    let rect = canvasSetup.getBoundingClientRect();
    // Skala posisi klik sesuai ukuran asli canvas vs ukuran render di layar
    let scaleX = canvasSetup.width / rect.width;
    let scaleY = canvasSetup.height / rect.height;
    
    let mouseX = (e.clientX - rect.left) * scaleX;
    let mouseY = (e.clientY - rect.top) * scaleY;

    // Cek apakah klik tepat berada di dalam kotak abu-abu
    if (mouseX >= box.x && mouseX <= box.x + box.width &&
        mouseY >= box.y && mouseY <= box.y + box.height) {
        isDragging = true;
        startX = mouseX - box.x;
        startY = mouseY - box.y;
        canvasSetup.style.cursor = "grabbing";
    }
});

canvasSetup.addEventListener('mousemove', function(e) {
    if (isDragging) {
        let rect = canvasSetup.getBoundingClientRect();
        let scaleX = canvasSetup.width / rect.width;
        let scaleY = canvasSetup.height / rect.height;
        
        let mouseX = (e.clientX - rect.left) * scaleX;
        let mouseY = (e.clientY - rect.top) * scaleY;

        // Update koordinat kotak
        box.x = mouseX - startX;
        box.y = mouseY - startY;

        // Gambar ulang kanvas setiap kali mouse bergeser
        drawPhantom();
    }
});

canvasSetup.addEventListener('mouseup', function() {
    isDragging = false;
    canvasSetup.style.cursor = "default";
});

canvasSetup.addEventListener('mouseleave', function() {
    isDragging = false;
    canvasSetup.style.cursor = "default";
});

// C. Interaksi Tombol (Persiapan untuk perhitungan matematis)
btnCalculate.addEventListener('click', () => {
    alert("Tombol berfungsi! Parameter: Energi = " + energySlider.value + " MV, Densitas = " + rhoSlider.value);
    // Logika perhitungan matriks akan kita masukkan ke sini nanti
});

// --- 5. JALANKAN SAAT AWAL ---
drawPhantom();