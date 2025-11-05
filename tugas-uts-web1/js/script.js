// js/script.js

// Pastikan dataPengguna, dataKatalogBuku, dan dataTracking (dari data.js) sudah dimuat.

// ==========================================================
// FUNGSI GLOBAL UTILITY
// ==========================================================

function showAlert(message) {
    alert("⚠️ " + message);
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = "block";
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = "none";
    }
}

// Menghapus karakter non-digit dan mengkonversi harga ke angka
function parseRupiahToNumber(rupiahString) {
    return parseInt(rupiahString.replace(/[^0-9]/g, ''));
}

// Mengkonversi angka ke format Rupiah
function formatNumberToRupiah(number) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(number);
}

// ==========================================================
// 1. LOGIKA LOGIN (index.html)
// ==========================================================
function handleLogin(event) {
    event.preventDefault(); 

    const emailInput = document.getElementById('email').value.trim();
    const passwordInput = document.getElementById('password').value;

    // D. Validasi Form
    if (!emailInput || !passwordInput) {
        showAlert("Email dan Password tidak boleh kosong.");
        return;
    }
    
    const user = dataPengguna.find(
        u => u.email === emailInput && u.password === passwordInput
    );

    if (user) {
        localStorage.setItem('loggedInUser', JSON.stringify(user));
        window.location.href = 'dashboard.html';
    } else {
        showAlert("Email atau Password yang Anda masukkan salah.");
    }
}

// ==========================================================
// 2. LOGIKA DASHBOARD (dashboard.html)
// ==========================================================
function displayGreeting() {
    const greetingElement = document.getElementById('greeting');
    if (!greetingElement) return;

    const now = new Date();
    const hour = now.getHours();
    let greetingText;

    if (hour >= 4 && hour < 11) {
        greetingText = "Selamat Pagi";
    } else if (hour >= 11 && hour < 15) {
        greetingText = "Selamat Siang";
    } else if (hour >= 15 && hour < 18) {
        greetingText = "Selamat Sore";
    } else {
        greetingText = "Selamat Malam";
    }

    const user = JSON.parse(localStorage.getItem('loggedInUser'));
    const userName = user ? user.nama : "Pengunjung";

    // C. Javascript DOM
    greetingElement.textContent = `${greetingText}, ${userName}!`;
}


// ==========================================================
// 3. LOGIKA STOK/KATALOG (stok.html) - LOGIKA GAMBAR DITAMBAH
// ==========================================================
function generateKatalogTable() {
    const tableBody = document.getElementById('katalog-body');
    if (!tableBody) return;
    tableBody.innerHTML = ''; 

    dataKatalogBuku.forEach(buku => {
        const row = tableBody.insertRow();

        // 🖼️ TAMBAH KOLOM COVER (Pertama)
        const coverCell = row.insertCell();
        const coverImage = document.createElement('img');
        coverImage.src = buku.cover; 
        coverImage.alt = "Cover " + buku.namaBarang;
        coverImage.title = buku.namaBarang;
        coverImage.classList.add('book-cover'); // Gunakan class untuk styling CSS
        coverCell.appendChild(coverImage);
        // ----------------------------------------------------

        row.insertCell().textContent = buku.kodeBarang;
        row.insertCell().textContent = buku.namaBarang;
        row.insertCell().textContent = buku.jenisBarang;
        row.insertCell().textContent = buku.edisi;
        
        const stokCell = row.insertCell();
        stokCell.textContent = buku.stok;

        // F. Kreativitas Tambahan: Highlight stok rendah
        if (buku.stok < 300) {
            stokCell.style.color = 'var(--tertiary-color)';
            stokCell.style.fontWeight = 'bold';
        }

        row.insertCell().textContent = buku.harga;

        const actionCell = row.insertCell();
        const pesanButton = document.createElement('button');
        pesanButton.textContent = 'Pesan';
        pesanButton.onclick = () => {
            localStorage.setItem('checkoutItem', JSON.stringify(buku));
            window.location.href = 'checkout.html';
        };
        actionCell.appendChild(pesanButton);
    });
}

function addStockRow() {
    const kodeBarang = prompt("Masukkan Kode Barang:");
    if (!kodeBarang) return; 
    
    const namaBarang = prompt("Masukkan Nama Barang:");
    const jenisBarang = prompt("Masukkan Jenis Barang:");
    const edisi = prompt("Masukkan Edisi:");
    const stokInput = prompt("Masukkan Stok (Angka):");
    const harga = prompt("Masukkan Harga (Contoh: Rp 150.000):");
    
    const stok = parseInt(stokInput);

    // D. Validasi Form sederhana
    if (!kodeBarang || !namaBarang || isNaN(stok) || stok <= 0) {
        showAlert("Penambahan dibatalkan. Pastikan data lengkap dan Stok adalah angka positif.");
        return;
    }

    const newBook = {
        kodeBarang, namaBarang, jenisBarang, edisi, stok, harga,
        cover: "img/default.jpg" // Default cover untuk buku baru
    };

    dataKatalogBuku.push(newBook); 
    generateKatalogTable(); // Render ulang tabel untuk menampilkan data baru
    
    alert(`🎉 Buku **${newBook.namaBarang}** berhasil ditambahkan ke katalog!`);
}

// ==========================================================
// 4. LOGIKA CHECKOUT (checkout.html)
// ==========================================================
function loadCheckoutDetails() {
    const checkoutItem = JSON.parse(localStorage.getItem('checkoutItem'));
    
    const nameEl = document.getElementById('checkout-item-name');
    const hargaEl = document.getElementById('checkout-item-harga');
    const subtotalEl = document.getElementById('checkout-subtotal');
    const totalBayarEl = document.getElementById('total-pembayaran');
    const jumlahInput = document.getElementById('jumlah-pesan');

    if (!checkoutItem || !nameEl || !jumlahInput) {
        if(nameEl) nameEl.textContent = 'Tidak ada buku dipilih.';
        if(totalBayarEl) totalBayarEl.textContent = 'Rp 0';
        if (jumlahInput) jumlahInput.disabled = true;
        return;
    }

    const hargaNumeric = parseRupiahToNumber(checkoutItem.harga);

    function updatePrice() {
        let jumlah = parseInt(jumlahInput.value);
        
        // Validasi Stok
        if (jumlah > checkoutItem.stok) {
            showAlert(`Stok **${checkoutItem.namaBarang}** hanya tersisa ${checkoutItem.stok}. Jumlah disesuaikan.`);
            jumlahInput.value = checkoutItem.stok;
            jumlah = checkoutItem.stok;
        } else if (jumlah < 1 || isNaN(jumlah)) {
            jumlahInput.value = 1;
            jumlah = 1;
        }

        const subtotal = hargaNumeric * jumlah;
        
        nameEl.textContent = checkoutItem.namaBarang;
        hargaEl.textContent = checkoutItem.harga;
        
        // C. Javascript DOM: Update harga
        subtotalEl.textContent = formatNumberToRupiah(subtotal);
        totalBayarEl.textContent = formatNumberToRupiah(subtotal);
    }

    jumlahInput.addEventListener('input', updatePrice);
    updatePrice(); 
}

function handleCheckout(event) {
    event.preventDefault();
    
    // D. Validasi Form Checkout
    const nama = document.getElementById('nama-pemesan')?.value.trim();
    const alamat = document.getElementById('alamat')?.value.trim();
    const noHp = document.getElementById('no-hp')?.value.trim();
    const metodeBayar = document.getElementById('metode-bayar')?.value;
    const checkoutItem = JSON.parse(localStorage.getItem('checkoutItem'));

    if (!nama || !alamat || !noHp || !metodeBayar) {
        showAlert("Semua kolom harus diisi untuk melanjutkan pemesanan.");
        return;
    }
    if (!checkoutItem) {
        showAlert("Keranjang kosong. Silakan pilih buku terlebih dahulu.");
        return;
    }

    // C. Interaksi UI: Pop-up/Alert Box Konfirmasi
    const total = document.getElementById('total-pembayaran').textContent;

    if (confirm(`✅ Konfirmasi Pesanan: Anda yakin ingin memesan **${checkoutItem.namaBarang}** dengan total **${total}** melalui metode **${metodeBayar}**?`)) {
        localStorage.removeItem('checkoutItem'); 
        alert("🎉 Pemesanan berhasil dikonfirmasi! Pesanan Anda akan diproses. Terima kasih.");
        window.location.href = 'dashboard.html';
    }
}


// ==========================================================
// 5. LOGIKA TRACKING PENGIRIMAN (tracking.html)
// ==========================================================
function searchTracking() {
    const doNumber = document.getElementById('do-number').value.trim();
    const resultDiv = document.getElementById('tracking-result');

    if (!resultDiv) return;
    resultDiv.innerHTML = ''; 

    if (!doNumber) {
        showAlert("Nomor Delivery Order (DO) tidak boleh kosong.");
        return;
    }

    const trackingData = dataTracking[doNumber];

    if (trackingData) {
        // Tentukan progress bar width
        let progressWidth = 0;
        let statusText = trackingData.status.toLowerCase();
        
        if (statusText.includes('dikirim') || statusText.includes('selesai')) {
            progressWidth = 100;
        } else if (statusText.includes('perjalanan') || statusText.includes('hub')) {
            progressWidth = 60;
        } else if (statusText.includes('loket')) {
            progressWidth = 30;
        } else {
             progressWidth = 10;
        }
        
        // F. Kreativitas Tambahan: Balik urutan riwayat perjalanan (terbaru di atas)
        const riwayatPerjalanan = [...trackingData.perjalanan].reverse(); 

        // C. Javascript DOM: Tampilkan hasil
        let html = `
            <h3>Hasil Pelacakan Nomor DO: ${trackingData.nomorDO}</h3>
            
            <p><strong>Nama Pemesan:</strong> ${trackingData.nama}</p>
            <p><strong>Status Pengiriman:</strong> <span style="color: ${progressWidth === 100 ? 'var(--button-success)' : 'var(--primary-color)'}; font-weight: bold;">${trackingData.status}</span></p>
            
            <h4>Status Progress 📦</h4>
            <div class="progress-bar-container">
                <div class="progress-bar status-${statusText.replace(/\s/g, '-')}" style="width: ${progressWidth}%;">
                    ${trackingData.status}
                </div>
            </div>

            <h4>Detail Pengiriman 📝</h4>
            <ul>
                <li>Ekspedisi: ${trackingData.ekspedisi}</li>
                <li>Tanggal Kirim: ${trackingData.tanggalKirim}</li>
                <li>Jenis Paket: ${trackingData.paket}</li>
                <li>Total Pembayaran: ${trackingData.total}</li>
            </ul>

            <h4>Riwayat Perjalanan 📍 (Terbaru di atas)</h4>
            <table>
                <thead>
                    <tr><th>Waktu</th><th>Keterangan</th></tr>
                </thead>
                <tbody>
                    ${riwayatPerjalanan.map(item => `
                        <tr><td>${item.waktu}</td><td>${item.keterangan}</td></tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        resultDiv.innerHTML = html;
        
    } else {
        showAlert(`Nomor Delivery Order **${doNumber}** tidak ditemukan.`);
    }
}


// ==========================================================
// EVENT LISTENERS UTAMA (C. Javascript DOM)
// ==========================================================
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;

    // --- index.html (Login) ---
    if (path.includes('index.html') || path === '/') {
        document.getElementById('login-form')?.addEventListener('submit', handleLogin);
        
        // Listener untuk Modal (Lupa Password & Daftar)
        document.getElementById('lupa-password-btn')?.addEventListener('click', () => openModal('modal-lupa-password'));
        document.getElementById('daftar-btn')?.addEventListener('click', () => openModal('modal-daftar'));

        // Listener untuk menutup modal
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => closeModal(e.target.closest('.modal').id));
        });
    }

    // --- dashboard.html ---
    if (path.includes('dashboard.html')) {
        displayGreeting();
    }

    // --- stok.html (Katalog) ---
    if (path.includes('stok.html')) {
        generateKatalogTable();
        document.getElementById('add-stock-btn')?.addEventListener('click', addStockRow);
    }
    
    // --- tracking.html ---
    if (path.includes('tracking.html')) {
        document.getElementById('search-do-btn')?.addEventListener('click', searchTracking);
    }

    // --- checkout.html ---
    if (path.includes('checkout.html')) {
        loadCheckoutDetails();
        document.getElementById('pemesanan-form')?.addEventListener('submit', handleCheckout);
    }
});