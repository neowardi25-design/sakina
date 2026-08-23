import { Anggota, Bendahara, MajlisTaklimConfig, ProgramKegiatan, ProgramSummary, RekapAnggota, Setoran } from '../types';
import { initialAnggota, initialBendahara, initialConfig, initialPrograms, initialSetoran } from '../data/initialData';

const STORAGE_KEYS = {
  ANGGOTA: 'mt_tabungan_anggota_v2_gsheet',
  SETORAN: 'mt_tabungan_setoran_v2_gsheet',
  BENDAHARA: 'mt_tabungan_bendahara_v1',
  ACTIVE_BENDAHARA: 'mt_tabungan_active_bendahara_v1',
  CONFIG: 'mt_tabungan_config_v1',
  PROGRAMS: 'mt_tabungan_programs_v1',
};

// --- DATA PERSISTENCE HELPERS ---
export function loadAnggota(): Anggota[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ANGGOTA);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading anggota:', e);
  }
  return [];
}

export function saveAnggota(data: Anggota[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.ANGGOTA, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving anggota:', e);
  }
}

export function loadSetoran(): Setoran[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETORAN);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading setoran:', e);
  }
  return [];
}

export function saveSetoran(data: Setoran[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.SETORAN, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving setoran:', e);
  }
}

export function loadBendahara(): Bendahara[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BENDAHARA);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading bendahara:', e);
  }
  saveBendahara(initialBendahara);
  return initialBendahara;
}

export function saveBendahara(data: Bendahara[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.BENDAHARA, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving bendahara:', e);
  }
}

export function loadActiveBendahara(): Bendahara {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_BENDAHARA);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading active bendahara:', e);
  }
  const defaultB = initialBendahara[0];
  saveActiveBendahara(defaultB);
  return defaultB;
}

export function saveActiveBendahara(b: Bendahara) {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_BENDAHARA, JSON.stringify(b));
  } catch (e) {
    console.error('Error saving active bendahara:', e);
  }
}

export function loadProgramKegiatan(): ProgramKegiatan[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROGRAMS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading programs:', e);
  }
  saveProgramKegiatan(initialPrograms);
  return initialPrograms;
}

export function saveProgramKegiatan(programs: ProgramKegiatan[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.PROGRAMS, JSON.stringify(programs));
  } catch (e) {
    console.error('Error saving programs:', e);
  }
}

export function loadConfig(): MajlisTaklimConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...initialConfig,
        ...parsed,
        app_name: parsed.app_name || 'SAKINA',
        app_subtitle: parsed.app_subtitle || 'Simpanan Anggota Kegiatan Majlis Taklim',
        logo_url: parsed.logo_url || initialConfig.logo_url,
        apps_script_url: parsed.apps_script_url || initialConfig.apps_script_url,
        auto_sync_sheets: parsed.auto_sync_sheets ?? true,
        daftar_program: parsed.daftar_program || loadProgramKegiatan(),
        nama_ketua: parsed.nama_ketua || initialConfig.nama_ketua || 'H. Muhammad Syafi\'i',
        nama_bendahara: parsed.nama_bendahara || initialConfig.nama_bendahara || 'Ustadzah Hj. Fatimah Azzahra',
        jabatan_ketua: parsed.jabatan_ketua || initialConfig.jabatan_ketua || 'Ketua Majlis',
        jabatan_bendahara: parsed.jabatan_bendahara || initialConfig.jabatan_bendahara || 'Bendahara Utama',
      };
    }
  } catch (e) {
    console.error('Error loading config:', e);
  }
  saveConfig(initialConfig);
  return initialConfig;
}

export function saveConfig(cfg: MajlisTaklimConfig) {
  try {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(cfg));
  } catch (e) {
    console.error('Error saving config:', e);
  }
}

// --- CALCULATION HELPERS ---

/**
 * Calculates current balance and full summary per member (Sheet "Rekap")
 */
export function calculateRekap(anggotaList: Anggota[], setoranList: Setoran[]): RekapAnggota[] {
  return anggotaList.map((m) => {
    const memberTx = setoranList
      .filter((s) => s.id_anggota === m.id_anggota)
      .sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());

    let totalSetor = 0;
    let totalTarik = 0;
    let totalRefund = 0;
    let lastDate = '-';

    memberTx.forEach((tx) => {
      if (tx.jenis === 'setor') {
        totalSetor += tx.jumlah;
      } else if (tx.jenis === 'tarik') {
        totalTarik += tx.jumlah;
      } else if (tx.jenis === 'refund') {
        totalRefund += tx.jumlah;
      }
      lastDate = tx.tanggal;
    });

    const saldoBerjalan = totalSetor - totalTarik - totalRefund;

    return {
      id_anggota: m.id_anggota,
      nama: m.nama,
      no_hp: m.no_hp,
      status: m.status,
      total_setor: totalSetor,
      total_tarik: totalTarik,
      total_refund: totalRefund,
      saldo_berjalan: saldoBerjalan,
      jumlah_transaksi: memberTx.length,
      transaksi_terakhir: memberTx.length > 0 ? lastDate : undefined,
    };
  });
}

/**
 * Calculates member balance up to current moment
 */
export function getMemberBalance(memberId: string, setoranList: Setoran[]): number {
  const memberTx = setoranList.filter((s) => s.id_anggota === memberId);
  let balance = 0;
  memberTx.forEach((tx) => {
    if (tx.jenis === 'setor') {
      balance += tx.jumlah;
    } else if (tx.jenis === 'tarik' || tx.jenis === 'refund') {
      balance -= tx.jumlah;
    }
  });
  return balance;
}

/**
 * Summary per Program Kegiatan, including master programs from admin
 */
export function calculateProgramSummaries(
  setoranList: Setoran[],
  masterPrograms?: ProgramKegiatan[]
): ProgramSummary[] {
  const map = new Map<
    string,
    {
      id?: string;
      nama: string;
      target?: number;
      tanggal?: string;
      deskripsi?: string;
      status?: 'aktif' | 'selesai' | 'draft';
      masuk: number;
      keluar: number;
      txCount: number;
      members: Set<string>;
      lastDate: string;
    }
  >();

  // Initialize master programs first
  if (masterPrograms && masterPrograms.length > 0) {
    masterPrograms.forEach((p) => {
      map.set(p.nama_program, {
        id: p.id_program,
        nama: p.nama_program,
        target: p.target_dana,
        tanggal: p.tanggal_pelaksanaan,
        deskripsi: p.deskripsi,
        status: p.status,
        masuk: 0,
        keluar: 0,
        txCount: 0,
        members: new Set<string>(),
        lastDate: '-',
      });
    });
  }

  setoranList.forEach((s) => {
    const rawProgram = s.keterangan_program?.trim();
    const programName = rawProgram ? rawProgram : 'Tabungan Fleksibel / Bebas';

    if (!map.has(programName)) {
      map.set(programName, {
        nama: programName,
        masuk: 0,
        keluar: 0,
        txCount: 0,
        members: new Set<string>(),
        lastDate: s.tanggal,
      });
    }

    const entry = map.get(programName)!;
    entry.txCount += 1;
    entry.members.add(s.id_anggota);

    if (s.jenis === 'setor') {
      entry.masuk += s.jumlah;
    } else {
      entry.keluar += s.jumlah;
    }

    if (entry.lastDate === '-' || new Date(s.tanggal) > new Date(entry.lastDate)) {
      entry.lastDate = s.tanggal;
    }
  });

  return Array.from(map.values())
    .map((item) => ({
      id_program: item.id,
      nama_program: item.nama,
      target_dana: item.target,
      tanggal_pelaksanaan: item.tanggal,
      deskripsi: item.deskripsi,
      status: item.status || 'aktif',
      total_dana_masuk: item.masuk,
      total_dana_keluar: item.keluar,
      saldo_bersih: item.masuk - item.keluar,
      jumlah_transaksi: item.txCount,
      jumlah_anggota: item.members.size,
      transaksi_terakhir: item.lastDate,
    }))
    .sort((a, b) => b.total_dana_masuk - a.total_dana_masuk);
}

/**
 * Get distinct program names for auto-suggestions
 */
export function getDistinctPrograms(
  setoranList: Setoran[],
  masterPrograms?: ProgramKegiatan[]
): string[] {
  const masterNames = masterPrograms ? masterPrograms.map((p) => p.nama_program) : [];
  const defaults = [
    'Ziarah Wali Songo 2026',
    'Wisata Religi Banten & Banten Lama',
    'Santunan & Wisata Yatim Muharram',
    'Ziarah Luar Batang & Habib Ali Kwitang',
    'Wisata Religi Solo & Jogja',
    'Milad & Khotmil Quran Majlis',
  ];
  const list = setoranList
    .map((s) => s.keterangan_program?.trim())
    .filter((p): p is string => Boolean(p && p.length > 0));

  return Array.from(new Set([...masterNames, ...defaults, ...list]));
}

// --- GENERATE IDS ---
export function generateProgramId(currentList: ProgramKegiatan[]): string {
  const count = currentList.length + 1;
  const numStr = String(count).padStart(3, '0');
  const candidate = `PROG-${numStr}`;
  if (!currentList.some((p) => p.id_program === candidate)) {
    return candidate;
  }
  return `PROG-${Date.now().toString().slice(-4)}`;
}

export function generateMemberId(currentList: Anggota[]): string {
  const count = currentList.length + 1;
  const numStr = String(count).padStart(3, '0');
  const candidate = `AGG-${numStr}`;
  if (!currentList.some((a) => a.id_anggota === candidate)) {
    return candidate;
  }
  // fallback finding max
  let maxNum = 0;
  currentList.forEach((a) => {
    const match = a.id_anggota.match(/AGG-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  });
  return `AGG-${String(maxNum + 1).padStart(3, '0')}`;
}

export function generateSetoranId(): string {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  return `TX-${yearMonth}-${randomSuffix}`;
}

// --- RESET AND BACKUP UTILITIES ---
export function resetAllDataToDefault() {
  saveAnggota(initialAnggota);
  saveSetoran(initialSetoran);
  saveBendahara(initialBendahara);
  saveActiveBendahara(initialBendahara[0]);
  saveConfig(initialConfig);
}

// --- CSV EXPORT UTILITIES ---
export function exportToCSV(filename: string, rows: (string | number)[][]) {
  const csvContent =
    'data:text/csv;charset=utf-8,\uFEFF' +
    rows
      .map((row) =>
        row
          .map((item) => {
            const str = String(item ?? '');
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          })
          .join(',')
      )
      .join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
