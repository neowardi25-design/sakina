/**
 * SAKINA - Google Sheets Sync & Webhook API Client
 * Terhubung langsung dengan Google Apps Script Web App URL.
 */

import { Anggota, MajlisTaklimConfig, Setoran } from '../types';

export const DEFAULT_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbxQoyJ19Pev9Rj3_wDQQIBmxXW1W6vWi3SN2aZ1XrtFFaMdSFlPdegeV8AYqv9Ppo_v/exec';

export interface SyncResult {
  success: boolean;
  message: string;
  data?: {
    anggota?: Anggota[];
    setoran?: Setoran[];
    config?: Partial<MajlisTaklimConfig>;
    programs?: any[];
  };
  timestamp?: string;
}

/**
 * Normalizes raw key-value pairs from Google Spreadsheet Config sheet
 */
export function normalizeSpreadsheetConfig(raw: Record<string, any>): Partial<MajlisTaklimConfig> {
  if (!raw || typeof raw !== 'object') return {};

  const normalized: Partial<MajlisTaklimConfig> = {};
  const lowerMap: Record<string, any> = {};

  Object.keys(raw).forEach((k) => {
    const cleanKey = k.toLowerCase().replace(/[\s_-]/g, '');
    lowerMap[cleanKey] = raw[k];
  });

  if (lowerMap['namamajlis'] || lowerMap['majlis']) {
    normalized.nama_majlis = String(lowerMap['namamajlis'] || lowerMap['majlis']).trim();
  }
  if (lowerMap['subjudul'] || lowerMap['subnama'] || lowerMap['keterangan']) {
    normalized.sub_nama = String(lowerMap['subjudul'] || lowerMap['subnama'] || lowerMap['keterangan']).trim();
  }
  if (lowerMap['ketuamajlis'] || lowerMap['namaketua'] || lowerMap['ketua']) {
    normalized.nama_ketua = String(lowerMap['ketuamajlis'] || lowerMap['namaketua'] || lowerMap['ketua']).trim();
  }
  if (lowerMap['bendaharautama'] || lowerMap['namabendahara'] || lowerMap['bendahara']) {
    normalized.nama_bendahara = String(lowerMap['bendaharautama'] || lowerMap['namabendahara'] || lowerMap['bendahara']).trim();
  }
  if (lowerMap['jabatanketua']) {
    normalized.jabatan_ketua = String(lowerMap['jabatanketua']).trim();
  }
  if (lowerMap['jabatanbendahara']) {
    normalized.jabatan_bendahara = String(lowerMap['jabatanbendahara']).trim();
  }
  if (lowerMap['alamat'] || lowerMap['lokasi']) {
    normalized.alamat = String(lowerMap['alamat'] || lowerMap['lokasi']).trim();
  }
  if (lowerMap['kontakwa'] || lowerMap['nokontak'] || lowerMap['nomorwa'] || lowerMap['kontak'] || lowerMap['nohp']) {
    normalized.no_kontak = String(lowerMap['kontakwa'] || lowerMap['nokontak'] || lowerMap['nomorwa'] || lowerMap['kontak'] || lowerMap['nohp']).trim();
  }
  if (lowerMap['namaaplikasi'] || lowerMap['appname']) {
    normalized.app_name = String(lowerMap['namaaplikasi'] || lowerMap['appname']).trim();
  }
  if (lowerMap['appsubtitle'] || lowerMap['subjudulaplikasi']) {
    normalized.app_subtitle = String(lowerMap['appsubtitle'] || lowerMap['subjudulaplikasi']).trim();
  }
  if (lowerMap['periode'] || lowerMap['tahunbuku']) {
    normalized.periode = String(lowerMap['periode'] || lowerMap['tahunbuku']).trim();
  }

  return normalized;
}

/**
 * Fetch all data from Google Sheets Web App
 */
export async function fetchFromGoogleSheets(
  apiUrl: string = DEFAULT_APPS_SCRIPT_URL
): Promise<SyncResult> {
  if (!apiUrl || !apiUrl.trim().startsWith('http')) {
    return { success: false, message: 'URL Google Apps Script tidak valid.' };
  }

  try {
    const url = new URL(apiUrl.trim());
    url.searchParams.set('action', 'all');
    url.searchParams.set('_t', Date.now().toString()); // prevent caching

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const json = await response.json();
    if (json.status === 'success' && json.data) {
      const parsedConfig = json.data.config ? normalizeSpreadsheetConfig(json.data.config) : undefined;
      return {
        success: true,
        message: 'Data berhasil ditarik 100% dari Google Sheets!',
        data: {
          ...json.data,
          config: parsedConfig,
        },
        timestamp: json.timestamp || new Date().toISOString(),
      };
    } else {
      return {
        success: false,
        message: json.message || 'Format data dari Google Sheets tidak dikenali.',
      };
    }
  } catch (error: any) {
    console.error('Error fetching from Google Sheets:', error);
    return {
      success: false,
      message: error?.message || 'Gagal menghubungi server Google Sheets. Pastikan akses Web App diatur ke "Anyone".',
    };
  }
}

/**
 * Send a new transaction to Google Sheets
 */
export async function pushTransactionToGoogleSheets(
  tx: Setoran,
  apiUrl: string = DEFAULT_APPS_SCRIPT_URL
): Promise<{ success: boolean; message: string }> {
  if (!apiUrl || !apiUrl.trim().startsWith('http')) {
    return { success: false, message: 'URL Google Apps Script tidak aktif' };
  }

  try {
    const payload = {
      action: 'add_transaction',
      data: tx,
    };

    // Google Apps Script handles plain text payload best without CORS preflight failures
    const response = await fetch(apiUrl.trim(), {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP status: ${response.status}`);
    }

    const json = await response.json();
    return {
      success: json.status === 'success',
      message: json.message || 'Transaksi berhasil dikirim ke Google Sheets',
    };
  } catch (error: any) {
    console.warn('Gagal sinkron transaksi ke Google Sheets:', error);
    return {
      success: false,
      message: error?.message || 'Gagal mengirim transaksi ke Google Sheets',
    };
  }
}

/**
 * Send a new member to Google Sheets
 */
export async function pushMemberToGoogleSheets(
  member: Anggota,
  apiUrl: string = DEFAULT_APPS_SCRIPT_URL
): Promise<{ success: boolean; message: string }> {
  if (!apiUrl || !apiUrl.trim().startsWith('http')) {
    return { success: false, message: 'URL Google Apps Script tidak aktif' };
  }

  try {
    const payload = {
      action: 'add_member',
      data: member,
    };

    const response = await fetch(apiUrl.trim(), {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP status: ${response.status}`);
    }

    const json = await response.json();
    return {
      success: json.status === 'success',
      message: json.message || 'Anggota berhasil dikirim ke Google Sheets',
    };
  } catch (error: any) {
    console.warn('Gagal sinkron anggota ke Google Sheets:', error);
    return {
      success: false,
      message: error?.message || 'Gagal mengirim anggota ke Google Sheets',
    };
  }
}

/**
 * Send updated config/profile to Google Sheets (Sheet: "Config")
 */
export async function pushConfigToGoogleSheets(
  config: MajlisTaklimConfig,
  apiUrl: string = DEFAULT_APPS_SCRIPT_URL
): Promise<{ success: boolean; message: string }> {
  if (!apiUrl || !apiUrl.trim().startsWith('http')) {
    return { success: false, message: 'URL Google Apps Script tidak aktif' };
  }

  try {
    const payload = {
      action: 'update_config',
      data: {
        nama_majlis: config.nama_majlis || '',
        sub_nama: config.sub_nama || '',
        alamat: config.alamat || '',
        no_kontak: config.no_kontak || '',
        nama_ketua: config.nama_ketua || '',
        jabatan_ketua: config.jabatan_ketua || '',
        nama_bendahara: config.nama_bendahara || '',
        jabatan_bendahara: config.jabatan_bendahara || '',
        app_name: config.app_name || 'SAKINA',
        app_subtitle: config.app_subtitle || 'Simpanan Anggota Kegiatan Majlis Taklim',
        auto_sync_sheets: config.auto_sync_sheets ?? true,
      },
    };

    const response = await fetch(apiUrl.trim(), {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP status: ${response.status}`);
    }

    const json = await response.json();
    return {
      success: json.status === 'success',
      message: json.message || 'Data profil & pengurus berhasil disimpan ke sheet Config Google Spreadsheet!',
    };
  } catch (error: any) {
    console.warn('Gagal sinkron konfigurasi ke Google Sheets:', error);
    return {
      success: false,
      message: error?.message || 'Gagal menyimpan konfigurasi ke Google Spreadsheet.',
    };
  }
}

/**
 * Full, robust Google Apps Script source code that users can copy-paste into Google Spreadsheet
 */
export const APPS_SCRIPT_TEMPLATE = `/**
 * ====================================================================
 * SAKINA - Google Apps Script Backend for Google Spreadsheet
 * Versi: 2.0 (Dukungan Penuh: Sheet "Config", "Anggota", "Setoran", "Program")
 * ====================================================================
 * CARA MEMASANG:
 * 1. Di Google Spreadsheet Anda, klik menu: Ekstensi > Apps Script
 * 2. Hapus semua kode yang ada, lalu Paste seluruh kode ini.
 * 3. Klik tombol "Simpan" (ikon disket).
 * 4. Klik tombol biru "Terapkan" (Deploy) > "Kelola Penerapan" atau "Penerapan Baru".
 * 5. Pilih Jenis: "Aplikasi Web" (Web app).
 * 6. Jalankan sebagai: "Saya" (Me).
 * 7. Siapa yang memiliki akses: "Siapa saja" (Anyone) -> WAJIB agar aplikasi web bisa sinkron!
 * 8. Klik "Terapkan" dan salin URL Web App (akhiran /exec) ke menu Pengaturan SAKINA.
 * ====================================================================
 */

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var action = e.parameter.action || 'all';

  // 1. Ambil data Config
  var config = getConfigData(ss);

  if (action === 'config') {
    return createJsonResponse({ status: 'success', data: config });
  }

  // 2. Ambil data Anggota
  var anggota = getAnggotaData(ss);

  // 3. Ambil data Setoran
  var setoran = getSetoranData(ss);

  // 4. Ambil data Program
  var programs = getProgramData(ss);

  return createJsonResponse({
    status: 'success',
    data: {
      config: config,
      anggota: anggota,
      setoran: setoran,
      programs: programs
    },
    timestamp: new Date().toISOString()
  });
}

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var postData = JSON.parse(e.postData.contents);
    var action = postData.action;
    var data = postData.data;

    // --- A. UPDATE CONFIG / PROFIL / PENGURUS ---
    if (action === 'update_config' || action === 'set_config' || action === 'save_config') {
      saveConfigData(ss, data);
      return createJsonResponse({
        status: 'success',
        message: 'Data profil & pengurus di sheet Config berhasil diperbarui!'
      });
    }

    // --- B. TAMBAH TRANSAKSI SETORAN / PENARIKAN ---
    if (action === 'add_transaction') {
      var sheetSetoran = getOrCreateSheet(ss, 'Setoran', [
        'ID Transaksi', 'ID Anggota', 'Nama Jamaah', 'Tanggal', 'Jenis', 'Jumlah', 'Keterangan / Program', 'Dicatat Oleh', 'Waktu Dicatat'
      ]);
      sheetSetoran.appendRow([
        data.id_setoran,
        data.id_anggota,
        data.nama_anggota || '',
        data.tanggal,
        data.jenis,
        data.jumlah,
        data.keterangan_program || '',
        data.dicatat_oleh || '',
        new Date().toISOString()
      ]);
      return createJsonResponse({ status: 'success', message: 'Transaksi berhasil disimpan ke Google Sheets.' });
    }

    // --- C. TAMBAH ANGGOTA / JAMAAH ---
    if (action === 'add_member') {
      var sheetAnggota = getOrCreateSheet(ss, 'Anggota', [
        'ID Anggota', 'Nama Jamaah', 'No HP / WA', 'Alamat', 'Tanggal Bergabung', 'Status'
      ]);
      sheetAnggota.appendRow([
        data.id_anggota,
        data.nama,
        data.no_hp || '',
        data.alamat || '',
        data.tanggal_bergabung || new Date().toISOString().split('T')[0],
        data.status || 'aktif'
      ]);
      return createJsonResponse({ status: 'success', message: 'Anggota berhasil disimpan ke Google Sheets.' });
    }

    return createJsonResponse({ status: 'error', message: 'Aksi tidak dikenali: ' + action });
  } catch (err) {
    return createJsonResponse({ status: 'error', message: err.toString() });
  }
}

// --- HELPER CONFIG SHEET ---
function getConfigData(ss) {
  var sheet = ss.getSheetByName('Config');
  if (!sheet) return {};
  var rows = sheet.getDataRange().getValues();
  var config = {};
  for (var i = 1; i < rows.length; i++) {
    var key = String(rows[i][0] || '').trim();
    var val = rows[i][1];
    if (key) {
      config[key] = val;
    }
  }
  return config;
}

function saveConfigData(ss, data) {
  var sheet = getOrCreateSheet(ss, 'Config', ['Key (Pengaturan)', 'Nilai (Value)']);
  var rows = sheet.getDataRange().getValues();
  var keyMap = {};
  for (var i = 1; i < rows.length; i++) {
    var k = String(rows[i][0] || '').trim();
    if (k) keyMap[k] = i + 1; // 1-based row index
  }

  for (var prop in data) {
    if (data.hasOwnProperty(prop)) {
      var val = data[prop];
      if (keyMap[prop]) {
        sheet.getRange(keyMap[prop], 2).setValue(val);
      } else {
        sheet.appendRow([prop, val]);
        keyMap[prop] = sheet.getLastRow();
      }
    }
  }
}

// --- HELPER ANGGOTA SHEET ---
function getAnggotaData(ss) {
  var sheet = ss.getSheetByName('Anggota');
  if (!sheet) return [];
  var rows = sheet.getDataRange().getValues();
  var list = [];
  for (var i = 1; i < rows.length; i++) {
    var id = String(rows[i][0] || '').trim();
    var nama = String(rows[i][1] || '').trim();
    if (id && nama) {
      list.push({
        id_anggota: id,
        nama: nama,
        no_hp: String(rows[i][2] || ''),
        alamat: String(rows[i][3] || ''),
        tanggal_bergabung: rows[i][4] ? String(rows[i][4]) : '',
        status: String(rows[i][5] || 'aktif')
      });
    }
  }
  return list;
}

// --- HELPER SETORAN SHEET ---
function getSetoranData(ss) {
  var sheet = ss.getSheetByName('Setoran');
  if (!sheet) return [];
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  
  // Header map
  var headerRow = rows[0].map(function(h) { return String(h || '').toLowerCase().trim(); });
  var colMap = {
    id_setoran: headerRow.indexOf('id_setoran') !== -1 ? headerRow.indexOf('id_setoran') : headerRow.indexOf('id transaksi'),
    id_anggota: headerRow.indexOf('id_anggota') !== -1 ? headerRow.indexOf('id_anggota') : headerRow.indexOf('id anggota'),
    nama_anggota: headerRow.indexOf('nama_anggota') !== -1 ? headerRow.indexOf('nama_anggota') : (headerRow.indexOf('nama jamaah') !== -1 ? headerRow.indexOf('nama jamaah') : headerRow.indexOf('nama')),
    tanggal: headerRow.indexOf('tanggal'),
    waktu: headerRow.indexOf('waktu'),
    jenis: headerRow.indexOf('jenis'),
    jumlah: headerRow.indexOf('jumlah') !== -1 ? headerRow.indexOf('jumlah') : headerRow.indexOf('nominal'),
    saldo_setelah: headerRow.indexOf('saldo_setelah') !== -1 ? headerRow.indexOf('saldo_setelah') : headerRow.indexOf('saldo'),
    keterangan_program: headerRow.indexOf('keterangan_program') !== -1 ? headerRow.indexOf('keterangan_program') : (headerRow.indexOf('keterangan / program') !== -1 ? headerRow.indexOf('keterangan / program') : headerRow.indexOf('program')),
    dicatat_oleh: headerRow.indexOf('dicatat_oleh') !== -1 ? headerRow.indexOf('dicatat_oleh') : (headerRow.indexOf('dicatat oleh') !== -1 ? headerRow.indexOf('dicatat oleh') : headerRow.indexOf('bendahara')),
    catatan: headerRow.indexOf('catatan')
  };

  var list = [];
  for (var i = 1; i < rows.length; i++) {
    var id = colMap.id_setoran !== -1 ? String(rows[i][colMap.id_setoran] || '').trim() : String(rows[i][0] || '').trim();
    if (id) {
      var idAnggota = colMap.id_anggota !== -1 ? String(rows[i][colMap.id_anggota] || '').trim() : String(rows[i][1] || '').trim();
      var namaAnggota = colMap.nama_anggota !== -1 ? String(rows[i][colMap.nama_anggota] || '').trim() : String(rows[i][2] || '').trim();
      var tanggalVal = colMap.tanggal !== -1 ? rows[i][colMap.tanggal] : rows[i][3];
      var jenisVal = colMap.jenis !== -1 ? String(rows[i][colMap.jenis] || 'setor').toLowerCase().trim() : 'setor';
      var jumlahVal = colMap.jumlah !== -1 ? Number(rows[i][colMap.jumlah] || 0) : Number(rows[i][6] || 0);
      var saldoSetelahVal = colMap.saldo_setelah !== -1 ? Number(rows[i][colMap.saldo_setelah] || 0) : 0;
      var programVal = colMap.keterangan_program !== -1 ? String(rows[i][colMap.keterangan_program] || '').trim() : '';
      var dicatatVal = colMap.dicatat_oleh !== -1 ? String(rows[i][colMap.dicatat_oleh] || '').trim() : '';
      var catatanVal = colMap.catatan !== -1 ? String(rows[i][colMap.catatan] || '').trim() : '';

      list.push({
        id_setoran: id,
        id_anggota: idAnggota,
        nama_anggota: namaAnggota,
        tanggal: tanggalVal ? formatDateCell(tanggalVal) : '',
        jenis: jenisVal === 'tarik' || jenisVal === 'refund' ? jenisVal : 'setor',
        jumlah: jumlahVal,
        saldo_setelah: saldoSetelahVal,
        keterangan_program: programVal,
        dicatat_oleh: dicatatVal,
        catatan: catatanVal
      });
    }
  }
  return list;
}

// --- HELPER PROGRAM SHEET ---
function getProgramData(ss) {
  var sheet = ss.getSheetByName('Program');
  if (!sheet) return [];
  var rows = sheet.getDataRange().getValues();
  var list = [];
  for (var i = 1; i < rows.length; i++) {
    var id = String(rows[i][0] || '').trim();
    var nama = String(rows[i][1] || '').trim();
    if (id && nama) {
      list.push({
        id_program: id,
        nama_program: nama,
        target_dana: Number(rows[i][2] || 0) || undefined,
        tanggal_pelaksanaan: rows[i][3] ? String(rows[i][3]) : undefined,
        status: String(rows[i][4] || 'aktif'),
        deskripsi: String(rows[i][5] || '')
      });
    }
  }
  return list;
}

function getOrCreateSheet(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (headers && headers.length > 0) {
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#f3f4f6');
    }
  }
  return sheet;
}

function formatDateCell(val) {
  if (val instanceof Date) {
    return val.toISOString().split('T')[0];
  }
  return String(val);
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
`;
