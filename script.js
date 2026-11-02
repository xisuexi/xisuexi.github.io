// ==========================================
// 1. DATA AWAL & STATE APLIKASI
// ==========================================
let saldoAwal = 500000000; // Rp 500.000.000
let daftarTransaksi = [
    { id: 1, tanggal: "01/10/2021", uraian: "Pengadaan Rapat Koordinasi SKPD", jenis: "pengeluaran", jumlah: 400000, kodeRek: "5.1.02.1.00000001" }
];
let filterAktif = "Semua";
let keywordPencarian = "";

// ==========================================
// 2. SELEKTOR ELEMEN DOM
// ==========================================
const elSaldoAwal = document.querySelectorAll('.summary-cards .card')[0].querySelector('h2');
const elTotalPenerimaan = document.querySelectorAll('.summary-cards .card')[1].querySelector('h2');
const elTotalPengeluaran = document.querySelectorAll('.summary-cards .card')[2].querySelector('h2');
const elSisaKas = document.querySelectorAll('.summary-cards .card')[3].querySelector('h2');

const elSisaKasBkuRekon = document.querySelector('.reconciliation-card .details').previousElementSibling.querySelector('span') || document.querySelector('.reconciliation-card p:nth-of-type(3) span');
const elWarningBox = document.querySelector('.warning-box');

const inputPencarian = document.querySelector('.search-bar input');
const tombolTabs = document.querySelectorAll('.tabs button');
const tombolTambah = document.querySelector('.add-transaction');
const tabelBody = document.querySelector('table tbody');

// ==========================================
// 3. FUNGSI UTILITAS FORMAT RUPIAH
// ==========================================
function formatRupiah(angka) {
    return 'Rp ' + angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// ==========================================
// 4. FUNGSI UTAMA RENDER & KALKULASI
// ==========================================
function perbaruiAplikasi() {
    let totalPenerimaan = 0;
    let totalPengeluaran = 0;

    // Hitung total penerimaan dan pengeluaran dari data
    daftarTransaksi.forEach(trx => {
        if (trx.jenis === 'penerimaan') {
            totalPenerimaan += trx.jumlah;
        } else if (trx.jenis === 'pengeluaran') {
            totalPengeluaran += trx.jumlah;
        }
    });

    let sisaKas = saldoAwal + totalPenerimaan - totalPengeluaran;

    // Perbarui Kartu Ringkasan Atas
    elSaldoAwal.innerText = formatRupiah(saldoAwal);
    elTotalPenerimaan.innerText = formatRupiah(totalPenerimaan);
    elTotalPengeluaran.innerText = formatRupiah(totalPengeluaran);
    elSisaKas.innerText = formatRupiah(sisaKas);

    // Perbarui Bagian Rekonsiliasi Kas
    const totalKasFisik = 0; // Ubah jika ada input kas fisik dinamis
    const selisih = sisaKas - totalKasFisik;
    
    if (elWarningBox) {
        if (selisih !== 0) {
            elWarningBox.style.display = 'flex';
            elWarningBox.innerHTML = `<img src="https://img.icons8.com/material-outlined/24/c62828/error.png"/> Selisih ${formatRupiah(Math.abs(selisih))} antara BKU dan kas fisik.`;
        } else {
            elWarningBox.style.display = 'none';
        }
    }

    // Filter Transaksi Berdasarkan Tab dan Pencarian
    let transaksiTampil = daftarTransaksi.filter(trx => {
        let matchTab = true;
        if (filterAktif === 'Penerimaan') matchTab = trx.jenis === 'penerimaan';
        if (filterAktif === 'Pengeluaran') matchTab = trx.jenis === 'pengeluaran';

        let matchSearch = trx.uraian.toLowerCase().includes(keywordPencarian.toLowerCase()) || 
                          trx.tanggal.includes(keywordPencarian);
        return matchTab && matchSearch;
    });

    // Render Tabel Transaksi
    renderTabel(transaksiTampil, totalPenerimaan, totalPengeluaran, sisaKas);
}

function renderTabel(data, totalPenerimaan, totalPengeluaran, sisaKas) {
    // Kosongkan isi tabel
    tabelBody.innerHTML = '';

    // Baris Saldo Awal / Posisi Awal di Tabel
    let htmlContent = `
        <tr class="summary-row">
            <td></td>
            <td></td>
            <td>${saldoAwal.toLocaleString('id-ID')}</td>
        </tr>
    `;

    // Baris Data Transaksi
    if (data.length === 0) {
        htmlContent += `<tr><td colspan="4" style="text-align: center; color: #888;">Tidak ada transaksi ditemukan</td></tr>`;
    } else {
        data.forEach(trx => {
            let kolomPenerimaan = trx.jenis === 'penerimaan' ? trx.jumlah.toLocaleString('id-ID') : '';
            let kolomPengeluaran = trx.jenis === 'pengeluaran' ? trx.jumlah.toLocaleString('id-ID') : '';
            
            htmlContent += `
                <tr>
                    <td>${trx.tanggal}</td>
                    <td class="${trx.jenis === 'pengeluaran' ? 'expense' : ''}">${kolomPengeluaran}</td>
                    <td>${sisaKas.toLocaleString('id-ID')}</td>
                    <td class="action-icons">
                        <img src="https://img.icons8.com/material-outlined/20/737373/edit.png" onclick="editTransaksi(${trx.id})" title="Edit"/>
                        <img src="https://img.icons8.com/material-outlined/20/737373/trash.png" onclick="hapusTransaksi(${trx.id})" title="Hapus"/>
                    </td>
                </tr>
            `;
        });
    }

    // Baris Total Bawah Tabel
    htmlContent += `
        <tr class="final-row">
            <td>${totalPenerimaan.toLocaleString('id-ID')}</td>
            <td>${totalPengeluaran.toLocaleString('id-ID')}</td>
            <td>${sisaKas.toLocaleString('id-ID')}</td>
        </tr>
    `;

    tabelBody.innerHTML = htmlContent;
}

// ==========================================
// 5. EVENT LISTENERS & INTERaktivitas
// ==========================================

// Fitur Pencarian Real-time
if (inputPencarian) {
    inputPencarian.addEventListener('input', function(e) {
        keywordPencarian = e.target.value;
        perbaruiAplikasi();
    });
}

// Fitur Filter Tab (Semua, Penerimaan, Pengeluaran)
tombolTabs.forEach(btn => {
    btn.addEventListener('click', function() {
        tombolTabs.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        filterAktif = this.innerText;
        perbaruiAplikasi();
    });
});

// Fitur Tambah Transaksi Interaktif (Prompt Sederhana)
if (tombolTambah) {
    tombolTambah.addEventListener('click', function() {
        let tgl = prompt("Masukkan Tanggal (DD/MM/YYYY):", "02/10/2021");
        if (!tgl) return;
        let uraian = prompt("Masukkan Uraian Transaksi:", "Belanja ATK");
        if (!uraian) return;
        let jenis = prompt("Jenis Transaksi ('penerimaan' atau 'pengeluaran'):", "pengeluaran");
        if (!jenis || (jenis !== 'penerimaan' && jenis !== 'pengeluaran')) return;
        let jumlah = parseInt(prompt("Masukkan Jumlah Nominal (Angka saja):", "150000"));
        if (isNaN(jumlah) || jumlah <= 0) {
            alert("Nominal tidak valid!");
            return;
        }

        // Tambah ke array data
        const transaksiBaru = {
            id: Date.now(),
            tanggal: tgl,
            uraian: uraian,
            jenis: jenis,
            jumlah: jumlah,
            kodeRek: "5.1.02.1.00000001"
        };

        daftarTransaksi.push(transaksiBaru);
        perbaruiAplikasi();
        alert("Transaksi berhasil ditambahkan!");
    });
}

// Fungsi Hapus Transaksi
window.hapusTransaksi = function(id) {
    if (confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) {
        daftarTransaksi = daftarTransaksi.filter(trx => trx.id !== id);
        perbaruiAplikasi();
    }
};

// Fungsi Edit Transaksi (Contoh Sederhana)
window.editTransaksi = function(id) {
    let trx = daftarTransaksi.find(t => t.id === id);
    if (!trx) return;

    let nominalBaru = prompt("Ubah nominal pengeluaran/penerimaan:", trx.jumlah);
    if (nominalBaru !== null && !isNaN(nominalBaru)) {
        trx.jumlah = parseInt(nominalBaru);
        perbaruiAplikasi();
        alert("Transaksi berhasil diperbarui!");
    }
};

// Jalankan saat halaman pertama kali dimuat
document.addEventListener("DOMContentLoaded", function() {
    perbaruiAplikasi();
});
