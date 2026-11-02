// ==========================================
// 1. DATA AWAL & STATE APLIKASI
// ==========================================
let konfigurasi = {
    program: "1.03.01.1 Program Penunjang Urusan Pemerintah Daerah Provinsi",
    kegiatan: "1.03.01.1.06 Administrasi Umum Perangkat Daerah",
    subKegiatan: "1.03.01.1.06.0009 Penyelenggaraan Rapat Koordinasi dan Konsultasi SKPD",
    saldoAwal: 500000000,
    namaKPA: "HARRY KUSWIAN, S.T., M.T.",
    nipKPA: "198004 201201 1 011",
    // Data Rekonsiliasi Kas
    kasTunai: 0,
    saldoBank: 0,
    suratBerharga: 0,
    pajakBelumDisetor: 0
};

let daftarTransaksi = [
    { id: 1, tanggal: "01/10/2021", uraian: "Pengadaan Rapat Koordinasi SKPD", jenis: "pengeluaran", jumlah: 400000 }
];

let filterAktif = "Semua";
let keywordPencarian = "";

function getTanggalHariIni() {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('id-ID', options);
}

// ==========================================
// 2. SELEKTOR ELEMEN DOM
// ==========================================
const elSaldoAwal = document.querySelectorAll('.summary-cards .card')[0].querySelector('h2');
const elTotalPenerimaan = document.querySelectorAll('.summary-cards .card')[1].querySelector('h2');
const elTotalPengeluaran = document.querySelectorAll('.summary-cards .card')[2].querySelector('h2');
const elSisaKas = document.querySelectorAll('.summary-cards .card')[3].querySelector('h2');

const elViewProgram = document.getElementById('viewProgram');
const elViewKegiatan = document.getElementById('viewKegiatan');
const elViewSubKegiatan = document.getElementById('viewSubKegiatan');
const elViewNamaKPA = document.getElementById('viewNamaKPA');
const elViewNIPKPA = document.getElementById('viewNIPKPA');
const elTanggalCetakFooter = document.getElementById('tanggalCetakFooter');

const elRekonBku = document.getElementById('rekonBku');
const elValKasTunai = document.getElementById('valKasTunai');
const elValSaldoBank = document.getElementById('valSaldoBank');
const elValTotalFisik = document.getElementById('valTotalFisik');
const elValPajak = document.getElementById('valPajak');
const elTextWarning = document.getElementById('textWarning');
const elWarningBox = document.querySelector('.warning-box');

const inputPencarian = document.querySelector('.search-bar input');
const tombolTabs = document.querySelectorAll('.tabs button');
const tombolTambah = document.querySelector('.add-transaction');
const tabelBody = document.querySelector('table tbody');

// Tombol Fitur Utama & Rekonsiliasi
const btnCetak = document.getElementById('btnCetak');
const btnEkspor = document.getElementById('btnEkspor');
const btnPengaturan = document.getElementById('btnPengaturan');
const btnTambahKas = document.getElementById('btnTambahKas');
const btnSaldoBank = document.getElementById('btnSaldoBank');
const btnPajak = document.getElementById('btnPajak');

// Modal Pengaturan
const modalPengaturan = document.getElementById('modalPengaturan');
const btnTutupModal = document.getElementById('btnTutupModal');
const btnSimpanPengaturan = document.getElementById('btnSimpanPengaturan');

const inputProgram = document.getElementById('inputProgram');
const inputKegiatan = document.getElementById('inputKegiatan');
const inputSubKegiatan = document.getElementById('inputSubKegiatan');
const inputSaldoAwal = document.getElementById('inputSaldoAwal');
const inputNamaKPA = document.getElementById('inputNamaKPA');
const inputNIPKPA = document.getElementById('inputNIPKPA');

function formatRupiah(angka) {
    return 'Rp ' + angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// ==========================================
// 3. FUNGSI UTAMA RENDER & KALKULASI
// ==========================================
function perbaruiAplikasi() {
    let totalPenerimaan = 0;
    let totalPengeluaran = 0;

    daftarTransaksi.forEach(trx => {
        if (trx.jenis === 'penerimaan') {
            totalPenerimaan += trx.jumlah;
        } else if (trx.jenis === 'pengeluaran') {
            totalPengeluaran += trx.jumlah;
        }
    });

    let sisaKas = konfigurasi.saldoAwal + totalPenerimaan - totalPengeluaran;

    // Update Teks Informasi Header & Footer
    elViewProgram.innerText = konfigurasi.program;
    elViewKegiatan.innerText = konfigurasi.kegiatan;
    elViewSubKegiatan.innerText = konfigurasi.subKegiatan;
    elViewNamaKPA.innerText = konfigurasi.namaKPA;
    elViewNIPKPA.innerText = konfigurasi.nipKPA;
    elTanggalCetakFooter.innerText = getTanggalHariIni();

    // Kartu Ringkasan Atas
    elSaldoAwal.innerText = formatRupiah(konfigurasi.saldoAwal);
    elTotalPenerimaan.innerText = formatRupiah(totalPenerimaan);
    elTotalPengeluaran.innerText = formatRupiah(totalPengeluaran);
    elSisaKas.innerText = formatRupiah(sisaKas);
    elRekonBku.innerText = formatRupiah(sisaKas);

    // Hitung Rekonsiliasi Kas Fisik & Pajak
    let totalKasFisik = konfigurasi.kasTunai + konfigurasi.saldoBank + konfigurasi.suratBerharga;
    elValKasTunai.innerText = formatRupiah(konfigurasi.kasTunai);
    elValSaldoBank.innerText = formatRupiah(konfigurasi.saldoBank);
    elValTotalFisik.innerText = formatRupiah(totalKasFisik);
    elValPajak.innerText = formatRupiah(konfigurasi.pajakBelumDisetor);

    let selisih = sisaKas - totalKasFisik;
    if (elWarningBox) {
        if (selisih !== 0) {
            elWarningBox.style.display = 'flex';
            elTextWarning.innerText = `Selisih ${formatRupiah(Math.abs(selisih))} antara BKU dan kas fisik.`;
        } else {
            elWarningBox.style.display = 'none';
        }
    }

    // Filter & Render Tabel Transaksi
    let transaksiTampil = daftarTransaksi.filter(trx => {
        let matchTab = true;
        if (filterAktif === 'Penerimaan') matchTab = trx.jenis === 'penerimaan';
        if (filterAktif === 'Pengeluaran') matchTab = trx.jenis === 'pengeluaran';

        let matchSearch = trx.uraian.toLowerCase().includes(keywordPencarian.toLowerCase()) || 
                          trx.tanggal.includes(keywordPencarian);
        return matchTab && matchSearch;
    });

    renderTabel(transaksiTampil, totalPenerimaan, totalPengeluaran, sisaKas);
}

function renderTabel(data, totalPenerimaan, totalPengeluaran, sisaKas) {
    tabelBody.innerHTML = '';

    let htmlContent = `
        <tr class="summary-row">
            <td>-</td>
            <td><strong>Saldo Awal / Saldo Sebelumnya</strong></td>
            <td>-</td>
            <td>-</td>
            <td>${konfigurasi.saldoAwal.toLocaleString('id-ID')}</td>
            <td></td>
        </tr>
    `;

    if (data.length === 0) {
        htmlContent += `<tr><td colspan="6" style="text-align: center; color: #888;">Tidak ada transaksi ditemukan</td></tr>`;
    } else {
        data.forEach(trx => {
            let kolomPenerimaan = trx.jenis === 'penerimaan' ? trx.jumlah.toLocaleString('id-ID') : '-';
            let kolomPengeluaran = trx.jenis === 'pengeluaran' ? trx.jumlah.toLocaleString('id-ID') : '-';
            
            htmlContent += `
                <tr>
                    <td>${trx.tanggal}</td>
                    <td>
                        <div class="teks-uraian">${trx.uraian}</div>
                        <div class="sub-teks-uraian">Jenis: ${trx.jenis.toUpperCase()}</div>
                    </td>
                    <td>${kolomPenerimaan}</td>
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

    htmlContent += `
        <tr class="final-row">
            <td><strong>TOTAL</strong></td>
            <td></td>
            <td><strong>${totalPenerimaan.toLocaleString('id-ID')}</strong></td>
            <td><strong>${totalPengeluaran.toLocaleString('id-ID')}</strong></td>
            <td><strong>${sisaKas.toLocaleString('id-ID')}</strong></td>
            <td></td>
        </tr>
    `;

    tabelBody.innerHTML = htmlContent;
}

// ==========================================
// 4. EVENT LISTENERS & INTERAKTIVITAS
// ==========================================

if (inputPencarian) {
    inputPencarian.addEventListener('input', function(e) {
        keywordPencarian = e.target.value;
        perbaruiAplikasi();
    });
}

tombolTabs.forEach(btn => {
    btn.addEventListener('click', function() {
        tombolTabs.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        filterAktif = this.innerText;
        perbaruiAplikasi();
    });
});

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

        daftarTransaksi.push({
            id: Date.now(),
            tanggal: tgl,
            uraian: uraian,
            jenis: jenis,
            jumlah: jumlah
        });
        perbaruiAplikasi();
    });
}

// ==========================================
// FUNGSI TOMBOL REKONSIILIASI (Kas, Bank, Pajak)
// ==========================================
if (btnTambahKas) {
    btnTambahKas.addEventListener('click', function() {
        let nilaiBaru = prompt("Masukkan jumlah Kas Tunai fisik (Angka saja):", konfigurasi.kasTunai);
        if (nilaiBaru !== null && !isNaN(nilaiBaru)) {
            konfigurasi.kasTunai = parseInt(nilaiBaru);
            perbaruiAplikasi();
        }
    });
}

if (btnSaldoBank) {
    btnSaldoBank.addEventListener('click', function() {
        let nilaiBaru = prompt("Masukkan jumlah Saldo Bank (Angka saja):", konfigurasi.saldoBank);
        if (nilaiBaru !== null && !isNaN(nilaiBaru)) {
            konfigurasi.saldoBank = parseInt(nilaiBaru);
            perbaruiAplikasi();
        }
    });
}

if (btnPajak) {
    btnPajak.addEventListener('click', function() {
        let nilaiBaru = prompt("Masukkan jumlah Pajak Belum Disetor (Angka saja):", konfigurasi.pajakBelumDisetor);
        if (nilaiBaru !== null && !isNaN(nilaiBaru)) {
            konfigurasi.pajakBelumDisetor = parseInt(nilaiBaru);
            perbaruiAplikasi();
        }
    });
}

window.hapusTransaksi = function(id) {
    if (confirm("Yakin ingin menghapus transaksi ini?")) {
        daftarTransaksi = daftarTransaksi.filter(trx => trx.id !== id);
        perbaruiAplikasi();
    }
};

window.editTransaksi = function(id) {
    let trx = daftarTransaksi.find(t => t.id === id);
    if (!trx) return;
    let nominalBaru = prompt("Ubah nominal transaksi:", trx.jumlah);
    if (nominalBaru !== null && !isNaN(nominalBaru)) {
        trx.jumlah = parseInt(nominalBaru);
        perbaruiAplikasi();
    }
};

// Pengaturan Modal
btnPengaturan.addEventListener('click', function() {
    inputProgram.value = konfigurasi.program;
    inputKegiatan.value = konfigurasi.kegiatan;
    inputSubKegiatan.value = konfigurasi.subKegiatan;
    inputSaldoAwal.value = konfigurasi.saldoAwal;
    inputNamaKPA.value = konfigurasi.namaKPA;
    inputNIPKPA.value = konfigurasi.nipKPA;
    modalPengaturan.style.display = 'block';
});

btnTutupModal.addEventListener('click', function() {
    modalPengaturan.style.display = 'none';
});

btnSimpanPengaturan.addEventListener('click', function() {
    konfigurasi.program = inputProgram.value;
    konfigurasi.kegiatan = inputKegiatan.value;
    konfigurasi.subKegiatan = inputSubKegiatan.value;
    konfigurasi.saldoAwal = parseInt(inputSaldoAwal.value) || 0;
    konfigurasi.namaKPA = inputNamaKPA.value;
    konfigurasi.nipKPA = inputNIPKPA.value;

    modalPengaturan.style.display = 'none';
    perbaruiAplikasi();
    alert("Pengaturan berhasil disimpan!");
});

btnCetak.addEventListener('click', function() {
    window.print();
});

btnEkspor.addEventListener('click', function() {
    let htmlContent = `
        <html>
        <head><meta charset="utf-8"></head>
        <body>
            <h3>Buku Kas Umum</h3>
            <p><strong>Tanggal Ekspor:</strong> ${getTanggalHariIni()}</p>
            <p><strong>Program:</strong> ${konfigurasi.program}</p>
            <p><strong>Kegiatan:</strong> ${konfigurasi.kegiatan}</p>
            <p><strong>Sub Kegiatan:</strong> ${konfigurasi.subKegiatan}</p>
            <br/>
            <table border="1">
                ${document.querySelector('table').innerHTML}
            </table>
            <br/><br/>
            <p>Mengetahui,</p>
            <p>Kuasa Pengguna Anggaran</p>
            <br/><br/>
            <p><b>${konfigurasi.namaKPA}</b></p>
            <p>NIP. ${konfigurasi.nipKPA}</p>
        </body>
        </html>
    `;

    let blob = new Blob(['\ufeff' + htmlContent], { type: 'application/vnd.ms-excel' });
    let url = URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = url;
    a.download = `Buku_Kas_Umum_${new Date().toISOString().slice(0,10)}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
});

document.addEventListener("DOMContentLoaded", function() {
    perbaruiAplikasi();
});
