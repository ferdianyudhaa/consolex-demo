// --- 1. INISIALISASI ELEMEN UI (PANEL 1) ---
const inputDensity = document.getElementById('input-density');
const inputDepth = document.getElementById('input-depth');
const inputField = document.getElementById('input-field');
const inputDmax = document.getElementById('input-dmax');
const btnCalculate = document.getElementById('btn-calculate');

// Ambil elemen kanvas (hanya sebagai placeholder sementara)
const canvasSetup = document.getElementById('canvas-setup');
const ctxSetup = canvasSetup.getContext('2d');

// --- 2. FUNGSI MENGGAMBAR PHANTOM SEMENTARA ---
// (Ini akan kita rombak total di tahap Panel 2 nanti)
function drawPhantom() {
    canvasSetup.width = 400;
    canvasSetup.height = 400;
    ctxSetup.fillStyle = "#e0f7fa";
    ctxSetup.fillRect(0, 0, 400, 400);
    ctxSetup.fillStyle = "#95a5a6";
    ctxSetup.fillRect(100, 150, 200, 100);
}

// --- 3. EVENT LISTENER TOMBOL HITUNG ---
btnCalculate.addEventListener('click', () => {
    // Membaca nilai radio button yang sedang aktif
    const activeEnergy = document.querySelector('input[name="energy"]:checked').value;
    
    // Membaca input teks dan mengubahnya menjadi angka (Float/Int)
    const densityVal = parseFloat(inputDensity.value);
    const depthVal = parseFloat(inputDepth.value);
    const fieldSizeVal = parseInt(inputField.value);
    const dmaxVal = parseFloat(inputDmax.value);

    // Validasi sederhana (jika user memasukkan angka aneh)
    if (isNaN(densityVal) || isNaN(depthVal) || isNaN(dmaxVal)) {
        alert("Mohon masukkan angka yang valid!");
        return;
    }

    // Tampilkan data yang berhasil dibaca (bisa dilihat di Console Browser dengan F12)
    console.log("--- Parameter Simulasi ---");
    console.log("Energi: " + activeEnergy + " MV");
    console.log("Densitas: " + densityVal);
    console.log("Kedalaman: " + depthVal + " cm");
    console.log("Field Size: " + fieldSizeVal + " x " + fieldSizeVal + " cm");
    console.log("Dmax: " + dmaxVal + " cGy");

    alert("Parameter tersimpan! (Cek Console F12). Siap lanjut ke Panel 2.");
});

// --- 4. JALANKAN SAAT AWAL ---
drawPhantom();