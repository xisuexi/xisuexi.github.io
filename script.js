document.addEventListener("DOMContentLoaded", () => {
    // Basis Data Awal (State Aplikasi)
    let dataTransaksi = [
        { id: 1, nomor: "BKT-001", tanggal: "2026-12-01", uraian: "Pembayaran Honorarium Tim Pelaksana SKPD", jenis: "pengeluaran", nominal: 400000 }
    ];
    let saldoAwal = 500000000;

    // Elemen Ringkasan Saldo Dashboard
    const txtSaldoAwal = document.getElementById("txt-saldo-awal");
    const txtPenerimaan = document.getElementById("txt-penerimaan");
    const txtPengeluaran = document.getElementById("txt-pengeluaran");
    const txtSisaKas = document.getElementById("txt-sisa-kas");
    const tableBody = document.getElementById("table-body");

    // Format Mata Uang Rupiah
    function formatRupiah(angka) {
        return "Rp " + new Intl.NumberFormat("id-ID").format(angka);
    }

    // Fungsi Utama Update Dashboard & Angka Finansial
    function updateDashboard() {
        let totalMasuk = 0;
        let totalKeluar = 0;

        dataTransaksi.forEach(t => {
            if (t.jenis === "penerimaan") totalMasuk += t.nominal;
            else if (t.jenis === "pengeluaran") totalKeluar += t.nominal;
        });

        const sisaKas = saldoAwal + totalMasuk - totalKeluar;

        // Pasang angka ke komponen UI Dashboard
        if(txtSaldoAwal) txtSaldoAwal.textContent = formatRupiah(saldoAwal);
        if(txtPenerimaan) txtPenerimaan.textContent = formatRupiah(totalMasuk);
        if(txtPengeluaran) txtPengeluaran.textContent = formatRupiah(totalKeluar);
        if(txtSisaKas) txtSisaKas.textContent = formatRupiah(sisaKas);
        
        // Update data pada modul rekonsiliasi kas
        const recBku = document.getElementById("rec-bku");
        if(recBku) recBku.textContent = formatRupiah(sisaKas);

        hitungRekonsiliasi(sisaKas);
        renderTable();
    }

    // Fungsi Render Tampilan Baris Tabel Laporan Transaksi
    function renderTable() {
        if (!tableBody) return;
        tableBody.innerHTML = "";

        if (dataTransaksi.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="8" class="text-center text-muted" style="padding: 20px;">Tidak ada transaksi terdaftar.</td></tr>`;
            return;
        }

        let runningSaldo = saldoAwal;
        dataTransaksi.forEach((t, index) => {
            if (t.jenis === "penerimaan") runningSaldo += t.nominal;
            else runningSaldo -= t.nominal;

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><input type="checkbox" class="check-item" data-id="${t.id}"></td>
                <td>${index + 1}</td>
                <td>${t.tanggal}</td>
                <td><strong>[${t.nomor}]</strong> ${t.uraian}</td>
                <td class="text-right text-success" style="font-weight: 500;">${t.jenis === 'penerimaan' ? formatRupiah(t.nominal) : '-'}</td>
                <td class="text-right text-danger" style="font-weight: 500;">${t.jenis === 'pengeluaran' ? formatRupiah(t.nominal) : '-'}</td>
                <td class="text-right" style="font-weight: 600;">${formatRupiah(runningSaldo)}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-secondary text-danger" style="padding: 4px 8px;" onclick="hapusSatuTransaksi(${t.id})">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    }

    // Handler Tambah Transaksi Manual via Form Terpaku ID
    const formTx = document.getElementById("form-transaksi");
    if(formTx) {
        formTx.addEventListener("submit", (e) => {
            e.preventDefault();
            
            const nomor = document.getElementById("tx-nomor").value;
            const tanggal = document.getElementById("tx-tanggal").value;
            const uraian = document.getElementById("tx-uraian").value;
            const nominal = parseFloat(document.getElementById("tx-nominal").value) || 0;
            const jenis = document.querySelector('input[name="tx-type"]:checked').value;

            const dataBaru = {
                id: Date.now(),
                nomor: nomor,
                tanggal: tanggal,
                uraian: uraian,
                jenis: jenis,
                nominal: nominal
            };

            dataTransaksi.push(dataBaru);
            formTx.reset();
            updateDashboard();
        });
    }

    // Asisten AI Otomatis dengan Regex Pintar
    const btnAI = document.getElementById("btn-proses-ai");
    const inputAI = document.getElementById("ai-command");

    if(btnAI && inputAI) {
        btnAI.addEventListener("click", () => {
            const text = inputAI.value.trim().toLowerCase();
            if (!text) return;

            let jenis = "pengeluaran"; 
            if (text.includes("terima") || text.includes("masuk") || text.includes("dana") || text.includes("pendapatan")) {
                jenis = "penerimaan";
            }

            // Pembersihan string untuk mengambil nominal angka murni
            let nominal = 0;
            let bersihMurni = text.replace(/\./g, ""); // hilangkan titik pemisah ribuan ketikan user
            const matchAngka = bersihMurni.match(/\d+/);
            
            if (matchAngka) {
                nominal = parseFloat(matchAngka[0]);
                if (text.includes("jt") || text.includes("juta")) {
                    nominal *= 1000000;
                }
            }

            if (nominal > 0) {
                dataTransaksi.push({
                    id: Date.now(),
                    nomor: "AI-" + Math.floor(100 + Math.random() * 900),
                    tanggal: new Date().toISOString().split('T')[0],
                    uraian: inputAI.value,
                    jenis: jenis,
                    nominal: nominal
                });
                updateDashboard();
                inputAI.value = "";
            } else {
                alert("Asisten AI gagal mendeteksi nominal angka. Contoh perintah: 'Beli makan rapat 150000' atau 'Terima kas daerah 5 juta'");
            }
        });
    }

    // Fungsi Global Hapus Data Tunggal dari Atribut Klik HTML Inline
    window.hapusSatuTransaksi = function(id) {
        dataTransaksi = dataTransaksi.filter(t => t.id !== id);
        updateDashboard();
    };

    // Fungsi Tombol Reset Semua Laporan Transaksi Buku Kas
    const btnReset = document.getElementById("btn-reset-data");
    if(btnReset) {
        btnReset.addEventListener("click", () => {
            if(confirm("Apakah Anda yakin ingin mengosongkan seluruh riwayat Buku Kas Umum?")) {
                dataTransaksi = [];
                updateDashboard();
            }
        });
    }

    // Kalkulator Realtime Rekonsiliasi Kas Fisik Dompet & Bank
    const inputTunai = document.getElementById("input-kas-tunai");
    const inputBank = document.getElementById("input-saldo-bank");

    function hitungRekonsiliasi(sisaKasBKU) {
        const tunai = inputTunai ? (parseFloat(inputTunai.value) || 0) : 0;
        const bank = inputBank ? (parseFloat(inputBank.value) || 0) : 0;
        const totalFisik = tunai + bank;

        const recFisik = document.getElementById("rec-fisik");
        if(recFisik) recFisik.textContent = formatRupiah(totalFisik);

        const selisih = (sisaKasBKU || 0) - totalFisik;
        const alertSelisih = document.getElementById("alert-selisih");

        if(alertSelisih) {
            if (selisih === 0) {
                alertSelisih.className = "alert-box success";
                alertSelisih.innerHTML = `<i class="fa-solid fa-circle-check"></i> Kas Akurat! Saldo Buku Kas cocok sempurna dengan fisik uang.`;
            } else {
                alertSelisih.className = "alert-box error";
                alertSelisih.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Terdapat selisih <strong>${formatRupiah(Math.abs(selisih))}</strong> antara BKU dan kondisi kas fisik nyata.`;
            }
        }
    }

    if(inputTunai) inputTunai.addEventListener("input", () => updateDashboard());
    if(inputBank) inputBank.addEventListener("input", () => updateDashboard());

    // Kanvas Core Tanda Tangan Elektronik KPA
    const canvas = document.getElementById("signature-pad");
    if (canvas) {
        const ctx = canvas.getContext("2d");
        let drawing = false;

        ctx.strokeStyle = "#0f172a";
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";

        canvas.addEventListener("mousedown", (e) => { drawing = true; ctx.beginPath(); ctx.moveTo(e.offsetX, e.offsetY); });
        canvas.addEventListener("mousemove", (e) => { if(drawing) { ctx.lineTo(e.offsetX, e.offsetY); ctx.stroke(); } });
        window.addEventListener("mouseup", () => drawing = false);

        const btnClear = document.getElementById("clear-canvas");
        if(btnClear) {
            btnClear.addEventListener("click", () => ctx.clearRect(0, 0, canvas.width, canvas.height));
        }
        
        const btnSave = document.getElementById("save-canvas");
        if(btnSave) {
            btnSave.addEventListener("click", () => alert("Tanda tangan Kuasa Pengguna Anggaran berhasil disimpan!"));
        }
    }

    // Set Tanggal Berjalan Otomatis di Pojok Dokumen
    const txtDate = document.getElementById("current-date");
    if(txtDate) {
        txtDate.textContent = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    // Jalankan Sinkronisasi Perhitungan Saat Pertama Kali Halaman Terbuka
    updateDashboard();
});
