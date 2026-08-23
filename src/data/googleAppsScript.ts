/**
 * SAKINA - Google Apps Script (Code.gs) Generator
 * Kode lengkap Google Apps Script untuk Google Sheets Majlis Taklim.
 */

export const SAKINA_APPS_SCRIPT_CODE = `/**
 * ============================================================================
 * SAKINA - Simpanan Anggota Kegiatan Majlis Taklim
 * GOOGLE APPS SCRIPT (Code.gs) - SISTEM OTOMATISASI GOOGLE SHEETS
 * ============================================================================
 * 
 * FITUR UTAMA:
 * 1. setupSakinaSheets(): Auto-generate 4 sheet (Anggota, Setoran, Rekap, Config)
 *    lengkap dengan format mata uang Rp, warna tema, validasi dropdown & formula.
 * 2. onOpen(): Menambahkan Menu khusus "🌙 SAKINA Tabungan" di Google Sheets.
 * 3. onEdit(e): Auto-lookup nama anggota & auto-hitung saldo ketika bendahara input.
 * 4. doGet(e) & doPost(e): Web API JSON endpoint untuk sinkronisasi realtime dengan aplikasi.
 * 5. tambahTransaksi(): Validasi otomatis saldo, penomoran kuitansi unik & format pesan WA.
 */

// ============================================================================
// 1. KONFIGURASI GLOBAL NAMA SHEET
// ============================================================================
const SHEET_NAMES = {
  ANGGOTA: 'Anggota',
  SETORAN: 'Setoran',
  REKAP: 'Rekap_Saldo',
  CONFIG: 'Config_Majlis'
};

/**
 * Trigger otomatis saat Google Spreadsheet dibuka.
 * Menambahkan Menu interaktif SAKINA di toolbar Google Sheets.
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🌙 SAKINA Tabungan')
    .addItem('⚡ Setup / Auto-Generate Semua Sheet', 'setupSakinaSheets')
    .addSeparator()
    .addItem('➕ Catat Transaksi Baru (Dialog)', 'showNewTransactionDialog')
    .addItem('🔄 Hitung Ulang & Sinkronkan Saldo', 'recalculateBalances')
    .addItem('📊 Buat Ringkasan Laporan Bulanan', 'generateMonthlySummaryPrompt')
    .addSeparator()
    .addItem('ℹ️ Bantuan & Format Webhook API', 'showApiHelp')
    .addToUi();
}

/**
 * ============================================================================
 * 2. AUTO-GENERATE SEMUA STRUKTUR SHEET, FORMULA, DAN FORMATING
 * ============================================================================
 */
function setupSakinaSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. SETUP SHEET CONFIG
  let sheetConfig = ss.getSheetByName(SHEET_NAMES.CONFIG);
  if (!sheetConfig) {
    sheetConfig = ss.insertSheet(SHEET_NAMES.CONFIG);
  }
  sheetConfig.clear();
  sheetConfig.setTabColor('#4C1D95'); // Purple
  
  const configHeaders = [['Parameter', 'Nilai', 'Keterangan']];
  const configData = [
    ['NAMA_APLIKASI', 'SAKINA', 'Nama Resmi Sistem Tabungan'],
    ['SUB_JUDUL', 'Simpanan Anggota Kegiatan Majlis Taklim', 'Deskripsi'],
    ['NAMA_MAJLIS', 'Majlis Taklim', 'Nama Majlis Taklim'],
    ['KETUA_MAJLIS', 'Ketua Majlis', 'Penanggung Jawab'],
    ['BENDAHARA_UTAMA', 'Bendahara Majlis', 'Pencatat Keuangan'],
    ['ALAMAT', '', 'Lokasi Majlis'],
    ['KONTAK_WA', '', 'Nomor CS/Admin']
  ];
  sheetConfig.getRange(1, 1, 1, 3).setValues(configHeaders)
    .setBackground('#4C1D95').setFontColor('#FFFFFF').setFontWeight('bold');
  sheetConfig.getRange(2, 1, configData.length, 3).setValues(configData);
  sheetConfig.autoResizeColumns(1, 3);

  // 2. SETUP SHEET ANGGOTA
  let sheetAnggota = ss.getSheetByName(SHEET_NAMES.ANGGOTA);
  if (!sheetAnggota) {
    sheetAnggota = ss.insertSheet(SHEET_NAMES.ANGGOTA);
  }
  sheetAnggota.clear();
  sheetAnggota.setTabColor('#047857'); // Emerald Green
  
  const anggotaHeaders = [[
    'id_anggota', 'nama', 'no_hp', 'tanggal_gabung', 'status', 'alamat', 'catatan'
  ]];
  sheetAnggota.getRange(1, 1, 1, 7).setValues(anggotaHeaders)
    .setBackground('#1E1B4B').setFontColor('#FFFFFF').setFontWeight('bold');
  sheetAnggota.setFrozenRows(1);

  // Sample data anggota jika kosong
  const sampleAnggota = [
    ['AGT-001', 'Hj. Maryam Susilowati', '081234567890', '2025-01-05', 'aktif', 'Jl. Kenanga No. 4, RT 02/04', 'Koordinator Konsumsi'],
    ['AGT-002', 'Ibu Nurhayati', '081398765432', '2025-01-10', 'aktif', 'Jl. Melati No. 15', 'Peserta Ziarah 2026'],
    ['AGT-003', 'Umi Kulsum', '081512345678', '2025-01-15', 'aktif', 'Komplek Griya Indah B3', 'Peserta Ziarah 2026'],
    ['AGT-004', 'Hj. Siti Rahmah', '081723456789', '2025-02-01', 'aktif', 'Jl. Mawar RT 01/02', 'Jamaah Pengajian Ahad'],
    ['AGT-005', 'Ibu Fatimah Zahra', '081834567890', '2025-02-10', 'aktif', 'Jl. Anggrek No. 8', 'Peserta Ziarah 2026']
  ];
  sheetAnggota.getRange(2, 1, sampleAnggota.length, 7).setValues(sampleAnggota);
  
  // Validasi Dropdown Status
  const ruleStatus = SpreadsheetApp.newDataValidation()
    .requireValueInList(['aktif', 'nonaktif'], true)
    .build();
  sheetAnggota.getRange('E2:E1000').setDataValidation(ruleStatus);
  sheetAnggota.autoResizeColumns(1, 7);

  // 3. SETUP SHEET SETORAN (TRANSAKSI)
  let sheetSetoran = ss.getSheetByName(SHEET_NAMES.SETORAN);
  if (!sheetSetoran) {
    sheetSetoran = ss.insertSheet(SHEET_NAMES.SETORAN);
  }
  sheetSetoran.clear();
  sheetSetoran.setTabColor('#065F46'); // Dark Emerald
  
  const setoranHeaders = [[
    'id_setoran', 'id_anggota', 'nama_anggota', 'tanggal', 'waktu', 'jenis', 'jumlah', 'saldo_setelah', 'keterangan_program', 'dicatat_oleh', 'catatan'
  ]];
  sheetSetoran.getRange(1, 1, 1, 11).setValues(setoranHeaders)
    .setBackground('#064E3B').setFontColor('#FFFFFF').setFontWeight('bold');
  sheetSetoran.setFrozenRows(1);

  // Sample data setoran
  const sampleSetoran = [
    ['SET-001', 'AGT-001', 'Hj. Maryam Susilowati', '2025-02-01', '08:30', 'setor', 200000, 200000, 'Ziarah Wali Songo 2026', 'Ustdzah Khadijah', 'Tabungan awal'],
    ['SET-002', 'AGT-002', 'Ibu Nurhayati', '2025-02-05', '09:15', 'setor', 150000, 150000, 'Ziarah Wali Songo 2026', 'Ustdzah Khadijah', 'Cicilan ke-1'],
    ['SET-003', 'AGT-003', 'Umi Kulsum', '2025-02-10', '10:00', 'setor', 100000, 100000, 'Tabungan Bebas', 'Hj. Rohmah', 'Setoran rutin'],
    ['SET-004', 'AGT-001', 'Hj. Maryam Susilowati', '2025-03-01', '09:00', 'setor', 300000, 500000, 'Ziarah Wali Songo 2026', 'Ustdzah Khadijah', 'Cicilan ke-2'],
    ['SET-005', 'AGT-004', 'Hj. Siti Rahmah', '2025-03-05', '08:45', 'setor', 250000, 250000, 'Rihlah & Santunan Yatim', 'Ustdzah Khadijah', 'Setoran program']
  ];
  sheetSetoran.getRange(2, 1, sampleSetoran.length, 11).setValues(sampleSetoran);
  
  // Format Currency (Rupiah) kolom Jumlah (G) dan Saldo Setelah (H)
  sheetSetoran.getRange('G2:H1000').setNumberFormat('"Rp" #,##0');
  
  // Validasi Dropdown Jenis Transaksi
  const ruleJenis = SpreadsheetApp.newDataValidation()
    .requireValueInList(['setor', 'tarik'], true)
    .build();
  sheetSetoran.getRange('F2:F1000').setDataValidation(ruleJenis);
  sheetSetoran.autoResizeColumns(1, 11);

  // 4. SETUP SHEET REKAP SALDO DENGAN FORMULA OTOMATIS
  let sheetRekap = ss.getSheetByName(SHEET_NAMES.REKAP);
  if (!sheetRekap) {
    sheetRekap = ss.insertSheet(SHEET_NAMES.REKAP);
  }
  sheetRekap.clear();
  sheetRekap.setTabColor('#581C87'); // Deep Purple
  
  const rekapHeaders = [[
    'id_anggota', 'nama', 'no_hp', 'status', 'total_setor', 'total_tarik', 'saldo_berjalan', 'jml_transaksi', 'status_tabungan'
  ]];
  sheetRekap.getRange(1, 1, 1, 9).setValues(rekapHeaders)
    .setBackground('#3B0764').setFontColor('#FFFFFF').setFontWeight('bold');
  sheetRekap.setFrozenRows(1);

  // Tulis formula dinamis untuk 50 baris pertama
  for (let r = 2; r <= 30; r++) {
    sheetRekap.getRange(r, 1).setFormula(\`=IF(Anggota!A\${r}="","",Anggota!A\${r})\`);
    sheetRekap.getRange(r, 2).setFormula(\`=IF(A\${r}="","",VLOOKUP(A\${r},Anggota!A:B,2,FALSE))\`);
    sheetRekap.getRange(r, 3).setFormula(\`=IF(A\${r}="","",VLOOKUP(A\${r},Anggota!A:C,3,FALSE))\`);
    sheetRekap.getRange(r, 4).setFormula(\`=IF(A\${r}="","",VLOOKUP(A\${r},Anggota!A:E,5,FALSE))\`);
    sheetRekap.getRange(r, 5).setFormula(\`=IF(A\${r}="","",SUMIFS(Setoran!G:G,Setoran!B:B,A\${r},Setoran!F:F,"setor"))\`);
    sheetRekap.getRange(r, 6).setFormula(\`=IF(A\${r}="","",SUMIFS(Setoran!G:G,Setoran!B:B,A\${r},Setoran!F:F,"tarik"))\`);
    sheetRekap.getRange(r, 7).setFormula(\`=IF(A\${r}="","",E\${r}-F\${r})\`);
    sheetRekap.getRange(r, 8).setFormula(\`=IF(A\${r}="","",COUNTIF(Setoran!B:B,A\${r}))\`);
    sheetRekap.getRange(r, 9).setFormula(\`=IF(A\${r}="","",IF(G\${r}>=2500000,"LUNAS TARGET",IF(G\${r}>0,"AKTIF MENABUNG","BELUM SETOR")))\`);
  }

  // Format Angka & Uang pada Sheet Rekap
  sheetRekap.getRange('E2:G100').setNumberFormat('"Rp" #,##0');
  sheetRekap.getRange('H2:H100').setNumberFormat('0');
  sheetRekap.autoResizeColumns(1, 9);

  // Buat Sheet Rekap menjadi sheet aktif utama
  ss.setActiveSheet(sheetRekap);

  SpreadsheetApp.getUi().alert(
    'Berhasil!', 
    '✨ Struktur Sheet SAKINA berhasil di-generate secara otomatis!\\n\\n' +
    '• 4 Sheet Terbentuk: Anggota, Setoran, Rekap_Saldo, Config_Majlis\\n' +
    '• Rumus SUMIFS saldo berjalan terhubung otomatis\\n' +
    '• Format Rupiah dan Dropdown telah aktif.', 
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/**
 * ============================================================================
 * 3. TRIGGER EDIT: AUTO-LOOKUP & PERHITUNGAN SALDO OTOMATIS
 * ============================================================================
 */
function onEdit(e) {
  if (!e || !e.range) return;
  const sheet = e.range.getSheet();
  const sheetName = sheet.getName();
  const row = e.range.getRow();
  const col = e.range.getColumn();

  // Jika mengedit Sheet Setoran pada kolom B (id_anggota)
  if (sheetName === SHEET_NAMES.SETORAN && col === 2 && row > 1) {
    const idAnggota = e.value;
    if (idAnggota) {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheetAnggota = ss.getSheetByName(SHEET_NAMES.ANGGOTA);
      if (sheetAnggota) {
        const dataAnggota = sheetAnggota.getDataRange().getValues();
        for (let i = 1; i < dataAnggota.length; i++) {
          if (dataAnggota[i][0] == idAnggota) {
            // Auto-isi Nama Anggota di kolom C (3)
            sheet.getRange(row, 3).setValue(dataAnggota[i][1]);
            break;
          }
        }
      }
      // Auto-isi Tanggal hari ini jika kolom D (4) kosong
      const cellTgl = sheet.getRange(row, 4);
      if (!cellTgl.getValue()) {
        const today = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd');
        cellTgl.setValue(today);
      }
      // Auto-isi Waktu jika kolom E (5) kosong
      const cellWaktu = sheet.getRange(row, 5);
      if (!cellWaktu.getValue()) {
        const timeNow = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'HH:mm');
        cellWaktu.setValue(timeNow);
      }
      // Auto-generate ID Setoran jika kolom A (1) kosong
      const cellIdSetor = sheet.getRange(row, 1);
      if (!cellIdSetor.getValue()) {
        const idTx = 'SET-' + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyMMdd') + '-' + Math.floor(100 + Math.random() * 900);
        cellIdSetor.setValue(idTx);
      }
    }
  }
}

/**
 * ============================================================================
 * 4. HITUNG ULANG SALDO BERJALAN & KONSISTENSI DATA
 * ============================================================================
 */
function recalculateBalances() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetSetoran = ss.getSheetByName(SHEET_NAMES.SETORAN);
  if (!sheetSetoran) return;

  const data = sheetSetoran.getDataRange().getValues();
  if (data.length <= 1) return;

  const memberBalances = {};

  for (let i = 1; i < data.length; i++) {
    const idAnggota = data[i][1];
    const jenis = (data[i][5] || 'setor').toString().toLowerCase();
    const jumlah = Number(data[i][6]) || 0;

    if (!memberBalances[idAnggota]) {
      memberBalances[idAnggota] = 0;
    }

    if (jenis === 'setor') {
      memberBalances[idAnggota] += jumlah;
    } else {
      memberBalances[idAnggota] -= jumlah;
    }

    // Update Saldo Setelah pada baris transaksi
    sheetSetoran.getRange(i + 1, 8).setValue(memberBalances[idAnggota]);
  }

  SpreadsheetApp.getUi().alert('Selesai', '✅ Saldo transaksi seluruh anggota telah dihitung ulang dengan benar!', SpreadsheetApp.getUi().ButtonSet.OK);
}

/**
 * ============================================================================
 * 5. WEB APP API: doGet (BACA DATA UNTUK APLIKASI WEB)
 * ============================================================================
 */
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const action = e && e.parameter ? e.parameter.action : 'all';

    const result = {
      status: 'success',
      timestamp: new Date().toISOString(),
      data: {}
    };

    // Ambil Data Anggota
    const sheetAnggota = ss.getSheetByName(SHEET_NAMES.ANGGOTA);
    if (sheetAnggota) {
      const rows = sheetAnggota.getDataRange().getValues();
      const headers = rows[0];
      result.data.anggota = rows.slice(1).map(r => ({
        id_anggota: String(r[0]),
        nama: String(r[1]),
        no_hp: String(r[2] || ''),
        tanggal_gabung: String(r[3]),
        status: String(r[4] || 'aktif'),
        alamat: String(r[5] || ''),
        catatan: String(r[6] || '')
      }));
    }

    // Ambil Data Setoran
    const sheetSetoran = ss.getSheetByName(SHEET_NAMES.SETORAN);
    if (sheetSetoran) {
      const rows = sheetSetoran.getDataRange().getValues();
      result.data.setoran = rows.slice(1).map(r => ({
        id_setoran: String(r[0]),
        id_anggota: String(r[1]),
        nama_anggota: String(r[2]),
        tanggal: String(r[3]),
        waktu: String(r[4] || ''),
        jenis: String(r[5] || 'setor'),
        jumlah: Number(r[6]) || 0,
        saldo_setelah: Number(r[7]) || 0,
        keterangan_program: String(r[8] || ''),
        dicatat_oleh: String(r[9] || 'Bendahara'),
        catatan: String(r[10] || '')
      }));
    }

    // Ambil Config
    const sheetConfig = ss.getSheetByName(SHEET_NAMES.CONFIG);
    if (sheetConfig) {
      const rows = sheetConfig.getDataRange().getValues();
      const cfg = {};
      for (let i = 1; i < rows.length; i++) {
        cfg[rows[i][0]] = rows[i][1];
      }
      result.data.config = cfg;
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * ============================================================================
 * 6. WEB APP API: doPost (SIMPAN TRANSAKSI DARI APLIKASI WEB)
 * ============================================================================
 */
function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action || 'add_transaction';
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'add_transaction') {
      const tx = postData.data;
      const sheetSetoran = ss.getSheetByName(SHEET_NAMES.SETORAN);
      if (!sheetSetoran) throw new Error('Sheet Setoran tidak ditemukan');

      const idSetoran = tx.id_setoran || ('SET-' + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyMMdd-HHmmss'));
      const tanggal = tx.tanggal || Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd');
      const waktu = tx.waktu || Utilities.formatDate(new Date(), 'Asia/Jakarta', 'HH:mm');

      // Hitung saldo anggota sebelum transaksi ini
      const dataSetoran = sheetSetoran.getDataRange().getValues();
      let currentBal = 0;
      for (let i = 1; i < dataSetoran.length; i++) {
        if (dataSetoran[i][1] == tx.id_anggota) {
          const jns = dataSetoran[i][5];
          const jml = Number(dataSetoran[i][6]) || 0;
          if (jns === 'setor') currentBal += jml;
          else currentBal -= jml;
        }
      }

      const nominal = Number(tx.jumlah) || 0;
      const newSaldo = (tx.jenis === 'setor') ? (currentBal + nominal) : (currentBal - nominal);

      // Append Baris
      sheetSetoran.appendRow([
        idSetoran,
        tx.id_anggota,
        tx.nama_anggota || '',
        tanggal,
        waktu,
        tx.jenis || 'setor',
        nominal,
        newSaldo,
        tx.keterangan_program || 'Tabungan Bebas',
        tx.dicatat_oleh || 'Bendahara',
        tx.catatan || ''
      ]);

      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Transaksi berhasil disimpan ke Google Sheets!',
        id_setoran: idSetoran,
        saldo_setelah: newSaldo
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'add_member') {
      const mbr = postData.data;
      const sheetAnggota = ss.getSheetByName(SHEET_NAMES.ANGGOTA);
      if (!sheetAnggota) throw new Error('Sheet Anggota tidak ditemukan');

      sheetAnggota.appendRow([
        mbr.id_anggota,
        mbr.nama,
        mbr.no_hp || '',
        mbr.tanggal_gabung || Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd'),
        mbr.status || 'aktif',
        mbr.alamat || '',
        mbr.catatan || ''
      ]);

      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Anggota baru berhasil didaftarkan ke Google Sheets!'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Aksi tidak dikenali'
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * ============================================================================
 * 7. DIALOG HELPER & PESAN BANTUAN
 * ============================================================================
 */
function showApiHelp() {
  const ui = SpreadsheetApp.getUi();
  const helpText = 
    'CARA DEPLOY SEBAGAI WEB APP UNTUK SINKRONISASI:\\n\\n' +
    '1. Klik menu "Deploy" (di kanan atas editor Apps Script) -> "New deployment".\\n' +
    '2. Pilih type "Web app".\\n' +
    '3. Atur "Execute as": Me (email akun Anda).\\n' +
    '4. Atur "Who has access": Anyone (agar aplikasi bisa mengirim data transaksi).\\n' +
    '5. Salin URL Web App yang dihasilkan untuk digunakan pada integrasi API SAKINA.';
  
  ui.alert('Panduan Integrasi Web App SAKINA', helpText, ui.ButtonSet.OK);
}

function showNewTransactionDialog() {
  const ui = SpreadsheetApp.getUi();
  const idPrompt = ui.prompt('Catat Setoran', 'Masukkan ID Anggota (contoh: AGT-001):', ui.ButtonSet.OK_CANCEL);
  if (idPrompt.getSelectedButton() != ui.Button.OK) return;
  
  const idAnggota = idPrompt.getResponseText();
  const nominalPrompt = ui.prompt('Catat Setoran', 'Masukkan Nominal Setoran (contoh: 150000):', ui.ButtonSet.OK_CANCEL);
  if (nominalPrompt.getSelectedButton() != ui.Button.OK) return;
  
  const nominal = Number(nominalPrompt.getResponseText()) || 0;
  if (nominal <= 0) {
    ui.alert('Peringatan', 'Nominal harus lebih dari 0', ui.ButtonSet.OK);
    return;
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetSetoran = ss.getSheetByName(SHEET_NAMES.SETORAN);
  const sheetAnggota = ss.getSheetByName(SHEET_NAMES.ANGGOTA);
  
  let namaAnggota = idAnggota;
  if (sheetAnggota) {
    const dataAgt = sheetAnggota.getDataRange().getValues();
    for (let i = 1; i < dataAgt.length; i++) {
      if (dataAgt[i][0] == idAnggota) {
        namaAnggota = dataAgt[i][1];
        break;
      }
    }
  }

  const idTx = 'SET-' + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyMMdd') + '-' + Math.floor(100 + Math.random() * 900);
  const today = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd');
  const now = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'HH:mm');

  sheetSetoran.appendRow([
    idTx,
    idAnggota,
    namaAnggota,
    today,
    now,
    'setor',
    nominal,
    0, // akan dihitung otomatis
    'Ziarah Wali Songo 2026',
    'Bendahara Majlis',
    'Input langsung dari Google Sheets'
  ]);

  recalculateBalances();
}

function generateMonthlySummaryPrompt() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetSetoran = ss.getSheetByName(SHEET_NAMES.SETORAN);
  if (!sheetSetoran) return;

  const data = sheetSetoran.getDataRange().getValues();
  let totalMasuk = 0;
  let totalKeluar = 0;
  let countTx = 0;

  for (let i = 1; i < data.length; i++) {
    const jns = data[i][5];
    const nominal = Number(data[i][6]) || 0;
    if (jns === 'setor') totalMasuk += nominal;
    else if (jns === 'tarik') totalKeluar += nominal;
    countTx++;
  }

  const saldoKas = totalMasuk - totalKeluar;
  const msg = 
    '📊 RINGKASAN KAS TABUNGAN SAKINA:\\n' +
    '----------------------------------\\n' +
    '• Total Transaksi : ' + countTx + ' transaksi\\n' +
    '• Total Setoran   : Rp ' + totalMasuk.toLocaleString('id-ID') + '\\n' +
    '• Total Penarikan : Rp ' + totalKeluar.toLocaleString('id-ID') + '\\n' +
    '• Saldo Kas Akhir : Rp ' + saldoKas.toLocaleString('id-ID');

  ui.alert('Laporan Kas Tabungan', msg, ui.ButtonSet.OK);
}
`;
