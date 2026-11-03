document.addEventListener("DOMContentLoaded", () => {
    // State Global Sederhana untuk Data Transaksi
    let dataTransaksi = [
        { id: 1, tanggal: "2026-12-01", uraian: "Pembayaran Honorarium Tim Pelaksana SKPD", jenis: "pengeluaran", nominal: 400000 }
    ];
    let saldoAwal = 500000000;

    // Elemen DOM Finansial
    const txtSaldoAwal = document.getElementById("txt-saldo-awal");
    const txtPenerimaan = document.getElementById("txt-penerimaan");
    const txtPengeluaran = document.getElementById("txt-pengeluaran");
    const txtSisaKas = document.getElementById("txt-sisa-kas");
    const tableBody = document.getElementById("table-body");

    // Format Rupiah utilitas
    function formatRupiah(angka) {
        return "Rp " + new Intl.NumberFormat("id-ID").format(angka);
    }

    // Hitung Ulang & Tampilkan Nilai Kas Terbaru
    function updateDashboard() {
        let totalMasuk = 0;
        let totalKeluar = 0;

        dataTransaksi.forEach(t => {
            if (t.jenis === "penerimaan") totalMasuk += t.nominal;
            else if (t.jenis === "pengeluaran") totalKeluar += t.nominal;
        });

        const sisaKas = saldoAwal + totalMasuk - totalKeluar;

        txtSaldoAwal.textContent = formatRupiah(saldoAwal);
        txtPenerimaan.textContent = formatRupiah(totalMasuk);
        txtPengeluaran.textContent = formatRupiah(totalKeluar);
        txtSisaKas.textContent = formatRupiah(sisaKas);
        
        // Perbarui Bagian Rekonsiliasi
        document.getElementById("rec-bku").textContent = formatRupiah(sisaKas);
        hitungRekonsiliasi(sisaKas);

        renderTable(sisaKas);
    }

    // Render Data Baris Tabel secara Dinamis
    function renderTable(sisaKasBerjalan) {
        tableBody.innerHTML = "";
        if (dataTransaksi.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="8" class="text-center text-muted">Tidak ada transaksi terdaftar.</td></tr>`;
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
                <td>${t.uraian}</td>
                <td class="text-right text-success">${t.jenis === 'penerimaan' ? formatRupiah(t.nominal) : '-'}</td>
                <td class="text-right text-danger">${t.jenis === 'pengeluaran' ? formatRupiah(t.nominal) : '-'}</td>
                <td class="text-right" style="font-weight:600;">${formatRupiah(runningSaldo)}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-secondary text-danger" onclick="hapusSatuTransaksi(${t.id})">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    }

    // Menangani Tambah Data Transaksi Manual via Form
    const formTx = document.getElementById("form-transaksi");
    formTx.addEventListener("submit", (e) => {
        e.preventDefault();
        const inputs = formTx.elements;
        const tipe = document.querySelector('input[name="tx-type"]:checked').value;

        const dataBaru = {
            id: Date.now(),
            tanggal: inputs[1].value,
            uraian: inputs[4].value,
            jenis: tipe,
            nominal: parseFloat(inputs[5].value)
        };

        dataTransaksi.push(dataBaru);
        formTx.reset();
        updateDashboard();
    });

    // Fitur Asisten AI Parsing Alami (Otomatis memilah Masuk/Keluar)
    const btnAI = document.getElementById("btn-proses-ai");
    const inputAI = document.getElementById("ai-command");

    btnAI.addEventListener("click", () => {
        const text = inputAI.value.trim().toLowerCase();
        if (!text) return;

        let jenis = "pengeluaran"; // default
        if (text.includes("terima") || text.includes("masuk") || text.includes("dana")) {
            jenis = "penerimaan";
        }

        // Regex ekstraksi nominal angka (mendukung format jt / juta)
        let nominal = 0;
        const matchAngka = text.match(/\d+([\.,]\d+)?/);
        if (matchAngka) {
            nominal = parseFloat(matchAngka[0].replace(",", "."));
            if (text.includes("jt") || text.includes("juta")) {
                nominal *= 1000000;
            }
        }

        if (nominal > 0) {
            dataTransaksi.push({
                id: Date.now(),
                tanggal: new Date().toISOString().split('T')[0],
                uraian: inputAI.value,
                jenis: jenis,
                nominal: nominal
            });
            updateDashboard();
            inputAI.value = "";
        } else {
            alert("AI tidak berhasil mengenali nominal transaksi. Coba ketik secara jelas (Cth: Beli Kertas 50000).");
        }
    });

    // Menghapus data transaksi tunggal
    window.hapusSatuTransaksi = function(id) {
        dataTransaksi = dataTransaksi.filter(t => t.id !== id);
        updateDashboard();
    };

    // Reset Semua Data
    document.getElementById("btn-reset-data").addEventListener("click", () => {
        if(confirm("Apakah Anda yakin ingin menghapus seluruh data transaksi?")) {
            dataTransaksi = [];
            updateDashboard();
        }
    });

    // Realtime Rekonsiliasi Perhitungan Kas Fisik vs BKU
    const inputTunai = document.getElementById("input-kas-tunai");
    const inputBank = document.getElementById("input-saldo-bank");

    function hitungRekonsiliasi(sisaKasBKU) {
        const tunai = parseFloat(inputTunai.value) || 0;
        const bank = parseFloat(inputBank.value) || 0;
        const totalFisik = tunai + bank;

        document.getElementById("rec-fisik").textContent = formatRupiah(totalFisik);

        const selisih = (sisaKasBKU || 0) - totalFisik;
        const txtSelisih = document.getElementById("txt-selisih");
        const alertSelisih = document.getElementById("alert-selisih");

        txtSelisih.textContent = formatRupiah(Math.abs(selisih));
        
        if (selisih === 0) {
            alertSelisih.className = "alert-box success";
            alertSelisih.innerHTML = `<i class="fa-solid fa-circle-check"></i> Kas cocok! Tidak ada selisih antara BKU & Fisik.`;
        } else {
            alertSelisih.className = "alert-box error";
            alertSelisih.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Selisih <strong>${formatRupiah(Math.abs(selisih))}</strong> antara BKU dan kas fisik.`;
        }
    }

    [inputTunai, inputBank].forEach(el => el.addEventListener("input", () => {
        let totalMasuk = 0, totalKeluar = 0;
        dataTransaksi.forEach(t => { t.jenis === "penerimaan" ? totalMasuk += t.nominal : totalKeluar += t.nominal });
        hitungRekonsiliasi(saldoAwal + totalMasuk - totalKeluar);
    }));

    // Manajemen Tanda Tangan Kanvas (Drawing Pad)
    const canvas = document.getElementById("signature-pad");
    const ctx = canvas.getContext("2d");
    let drawing = false;

    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2;

    canvas.addEventListener("mousedown", (e) => { drawing = true; ctx.beginPath(); ctx.moveTo(e.offsetX, e.offsetY); });
    canvas.addEventListener("mousemove", (e) => { if(drawing) { ctx.lineTo(e.offsetX, e.offsetY); ctx.stroke(); } });
    window.addEventListener("mouseup", () => drawing = false);

    document.getElementById("clear-canvas").addEventListener("click", () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    document.getElementById("save-canvas").addEventListener("click", () => {
        alert("Tanda tangan telah dikunci ke dalam sistem dokumen.");
    });

    // Tanggal Berjalan Otomatis untuk Laporan Dokumen
    const opsiTanggal = { year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById("current-date").textContent = new Date().toLocaleDateString('id-ID', opsiTanggal);

    // Inisialisasi awal aplikasi
    updateDashboard();
});
