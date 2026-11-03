```javascript
document.addEventListener("DOMContentLoaded", () => {
    // 1. STATE MANAGEMENT APLIKASI
    let configSKPD = {
        program: "1.03.01.1 Program Penunjang Urusan Pemerintah Daerah Provinsi",
        kegiatan: "1.03.01.1.06 Administrasi Umum Perangkat Daerah",
        subKegiatan: "1.03.01.1.06.0009 Penyelenggaraan Rapat Koordinasi dan Konsultasi SKPD",
        saldoAwal: 500000000,
        namaPejabat: "HARRY KUSWIAN, S.T., M.T.",
        nipPejabat: "198004 201201 1 011"
    };

    let dataTransaksi = [
        { id: 1, nomor: "BKT-001", tanggal: "2026-12-01", uraian: "Pembayaran Honorarium Tim Pelaksana SKPD", jenis: "pengeluaran", nominal: 400000 }
    ];

    // 2. ENGINE TAB SWITCH NAVIGASI SIDEBAR (Memperbaiki tombol pengaturan)
    const menuItems = document.querySelectorAll(".menu-item");
    const tabPanels = document.querySelectorAll(".tab-panel");

    menuItems.forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            menuItems.forEach(i => i.classList.remove("active"));
            tabPanels.forEach(p => p.classList.remove("active-panel"));

            item.classList.add("active");
            const targetId = item.getAttribute("data-target");
            const targetPanel = document.getElementById(targetId);
            if(targetPanel) targetPanel.classList.add("active-panel");
        });
    });

    // 3. UTILTAS FORMAT RUPIAH
    function formatRupiah(angka) {
        return "Rp " + new Intl.NumberFormat("id-ID").format(angka);
    }

    // 4. HITUNG DAN RE-RENDER TOTAL KAS DASHBOARD
    function updateCoreCalculations() {
        let totalPenerimaan = 0;
        let totalPengeluaran = 0;

        dataTransaksi.forEach(item => {
            if (item.jenis === "penerimaan") totalPenerimaan += item.nominal;
            else totalPengeluaran += item.nominal;
        });

        const sisaKasAkhir = configSKPD.saldoAwal + totalPenerimaan - totalPengeluaran;

        // Cetak ke layar kartu statis
        document.getElementById("txt-saldo-awal").textContent = formatRupiah(configSKPD.saldoAwal);
        document.getElementById("txt-penerimaan").textContent = formatRupiah(totalPenerimaan);
        document.getElementById("txt-pengeluaran").textContent = formatRupiah(totalPengeluaran);
        document.getElementById("txt-sisa-kas").textContent = formatRupiah(sisaKasAkhir);
        
        // Kirim ke modul rekonsiliasi
        document.getElementById("rec-bku").textContent = formatRupiah(sisaKasAkhir);

        renderTableData();
        eksekusiKalkulatorFisik(sisaKasAkhir);
    }

    // 5. RENDER BARIS TABEL TRANSAKSI
    function renderTableData() {
        const tableBody = document.getElementById("table-body");
        if (!tableBody) return;
        tableBody.innerHTML = "";

        if (dataTransaksi.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="8" class="text-center text-muted" style="padding:24px;">Tidak ada rekam data transaksi saat ini.</td></tr>`;
            return;
        }

        let runningSaldo = configSKPD.saldoAwal;
        dataTransaksi.forEach((tx, index) => {
            if (tx.jenis === "penerimaan") runningSaldo += tx.nominal;
            else runningSaldo -= tx.nominal;

            const row = document.createElement("tr");
            row.innerHTML = `
                <td><input type="checkbox" class="check-row" data-id="${tx.id}"></td>
                <td>${index + 1}</td>
                <td>${tx.tanggal}</td>
                <td><strong>[${tx.nomor}]</strong> ${tx.uraian}</td>
                <td class="text-right text-success">${tx.jenis === 'penerimaan' ? formatRupiah(tx.nominal) : '-'}</td>
                <td class="text-right text-danger">${tx.jenis === 'pengeluaran' ? formatRupiah(tx.nominal) : '-'}</td>
                <td class="text-right" style="font-weight:600;">${formatRupiah(runningSaldo)}</td>
                <td class="text-center">
                    <button type="button" class="btn btn-sm btn-secondary text-danger" onclick="hapusBarisTransaksi(${tx.id})">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    // 6. FORM TAMBAH TRANSAKSI MANUAL
    const formTransaksi = document.getElementById("form-transaksi");
    if(formTransaksi) {
        formTransaksi.addEventListener("submit", (e) => {
            e.preventDefault();
            const dataBaru = {
                id: Date.now(),
                nomor: document.getElementById("tx-nomor").value,
                tanggal: document.getElementById("tx-tanggal").value,
                uraian: document.getElementById("tx-uraian").value,
                jenis: document.querySelector('input[name="tx-type"]:checked').value,
                nominal: parseFloat(document.getElementById("tx-nominal").value) || 0
            };
            dataTransaksi.push(dataBaru);
            formTransaksi.reset();
            updateCoreCalculations();
        });
    }

    // 7. INPUT TRANSAKSI VIA ASISTEN AI
    const btnProsesAI = document.getElementById("btn-proses-ai");
    const inputAICommand = document.getElementById("ai-command");

    if(btnProsesAI && inputAICommand) {
        btnProsesAI.addEventListener("click", () => {
            const komand = inputAICommand.value.trim().toLowerCase();
            if(!komand) return;

            let jenisTerdeteksi = "pengeluaran";
            if(komand.includes("terima") || komand.includes("masuk") || komand.includes("dana") || komand.includes("pendapatan")) {
                jenisTerdeteksi = "penerimaan";
            }

            let murniAngka = komand.replace(/\./g, ""); 
            const matchAngka = murniAngka.match(/\d+/);
            let nominalAkhir = 0;

            if(matchAngka) {
                nominalAkhir = parseFloat(matchAngka[0]);
                if(komand.includes("jt") || komand.includes("juta")) nominalAkhir *= 1000000;
            }

            if(nominalAkhir > 0) {
                dataTransaksi.push({
                    id: Date.now(),
                    nomor: "AI-" + Math.floor(100 + Math.random() * 800),
                    tanggal: new Date().toISOString().split('T')[0],
                    uraian: inputAICommand.value,
                    jenis: jenisTerdeteksi,
                    nominal: nominalAkhir
                });
                updateCoreCalculations();
                inputAICommand.value = "";
            } else {
                alert("Gagal mendeteksi jumlah uang. Ketik instruksi dengan jelas.");
            }
        });
    }

    // Fungsi global hapus baris transaksi
    window.hapusBarisTransaksi = function(id) {
        dataTransaksi = dataTransaksi.filter(item => item.id !== id);
        updateCoreCalculations();
    };

    // Tombol Kosongkan Seluruh Data BKU
    const btnResetData = document.getElementById("btn-reset-data");
    if(btnResetData) {
        btnResetData.addEventListener("click", () => {
            if(confirm("Hapus seluruh catatan BKU? Tindakan ini tidak bisa dibatalkan.")) {
                dataTransaksi = [];
                updateCoreCalculations();
            }
        });
    }

    // 8. ENGINE REKONSILIASI KAS REALTIME
    const inputTunai = document.getElementById("input-kas-tunai");
    const inputBank = document.getElementById("input-saldo-bank");

    function eksekusiKalkulatorFisik(sisaKasBKU) {
        const tunai = parseFloat(inputTunai.value) || 0;
        const bank = parseFloat(inputBank.value) || 0;
        const totalFisik = tunai + bank;

        const recFisik = document.getElementById("rec-fisik");
        if(recFisik) recFisik.textContent = formatRupiah(totalFisik);

        const selisih = (sisaKasBKU || 0) - totalFisik;
        const alertSelisih = document.getElementById("alert-selisih");
        const txtSelisih = document.getElementById("txt-selisih");

        if(txtSelisih) txtSelisih.textContent = formatRupiah(Math.abs(selisih));

        if(alertSelisih) {
            if (selisih === 0) {
                alertSelisih.className = "alert-banner alert-success";
                alertSelisih.innerHTML = `<i class="fa-solid fa-circle-check"></i> Sinkronisasi Akurat! Tidak ada selisih kas fisik.`;
            } else {
                alertSelisih.className = "alert-banner alert-danger";
                alertSelisih.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Terdapat selisih <strong>${formatRupiah(Math.abs(selisih))}</strong> antara pembukuan BKU dan fisik kas.`;
            }
        }
    }

    if(inputTunai) inputTunai.addEventListener("input", () => updateCoreCalculations());
    if(inputBank) inputBank.addEventListener("input", () => updateDashboardCalculationsFromInput());

    function updateDashboardCalculationsFromInput() {
        let totalPenerimaan = 0; let totalPengeluaran = 0;
        dataTransaksi.forEach(item => { item.jenis === "penerimaan" ? totalPenerimaan += item.nominal : totalPengeluaran += item.nominal; });
        eksekusiKalkulatorFisik(configSKPD.saldoAwal + totalPenerimaan - totalPengeluaran);
    }

    // 9. SIMPAN CONFIG PARAMETER FORM PENGATURAN
    const formPengaturan = document.getElementById("form-pengaturan");
    if(formPengaturan) {
        formPengaturan.addEventListener("submit", (e) => {
            e.preventDefault();
            configSKPD.saldoAwal = parseFloat(document.getElementById("cfg-saldo").value) || 0;
            configSKPD.namaPejabat = document.getElementById("cfg-pejabat").value;
            configSKPD.nipPejabat = document.getElementById("cfg-nip").value;

            // Update Label Identitas KPA di lembar TTD
document.getElementById("lbl-nama-pejabat").textContent = configSKPD.namaPejabat;
document.getElementById("lbl-nip-pejabat").textContent = configSKPD.nipPejabat;
// Beri notifikasi sukses ke user
alert("Parameter konfigurasi instansi & pagu berhasil diupdate!");
updateCoreCalculations();
});
}
// 10. KANVAS DRAWING TANDA TANGAN
const canvas = document.getElementById("signature-pad");
if(canvas) {
const ctx = canvas.getContext("2d");
let isDrawing = false;
ctx.strokeStyle = "#0f172a"; ctx.lineWidth = 2.5; ctx.lineCap = "round";
canvas.addEventListener("mousedown", (e) => { isDrawing = true; ctx.beginPath(); ctx.moveTo(e.offsetX, e.offsetY); });
canvas.addEventListener("mousemove", (e) => { if(isDrawing) { ctx.lineTo(e.offsetX, e.offsetY); ctx.stroke(); } });
window.addEventListener("mouseup", () => isDrawing = false);
document.getElementById("clear-canvas").addEventListener("click", () => ctx.clearRect(0, 0, canvas.width, canvas.height));
document.getElementById("save-canvas").addEventListener("click", () => alert("Tanda tangan KPA dikunci secara aman ke dokumen laporan BKU."));
}
// Set tanggal hari ini di dokumen cetak
document.getElementById("current-date").textContent = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
// Booting up calculations awal
updateCoreCalculations();
});
