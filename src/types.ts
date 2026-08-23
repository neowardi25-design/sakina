export type MemberStatus = 'aktif' | 'nonaktif';
export type TransactionType = 'setor' | 'tarik' | 'refund';

export interface Anggota {
  id_anggota: string;
  nama: string;
  no_hp: string;
  alamat?: string;
  tanggal_gabung: string;
  status: MemberStatus;
  catatan?: string;
}

export interface Setoran {
  id_setoran: string;
  id_anggota: string;
  nama_anggota?: string; // cached for convenience
  tanggal: string; // YYYY-MM-DD or ISO
  waktu?: string; // HH:mm
  jenis: TransactionType;
  jumlah: number;
  saldo_setelah: number;
  keterangan_program: string; // e.g. "Ziarah Wali Songo 2026", "Wisata Religi", etc. (optional/free text)
  dicatat_oleh: string; // nama bendahara
  catatan?: string;
}

export interface RekapAnggota {
  id_anggota: string;
  nama: string;
  no_hp: string;
  status: MemberStatus;
  total_setor: number;
  total_tarik: number;
  total_refund: number;
  saldo_berjalan: number;
  jumlah_transaksi: number;
  transaksi_terakhir?: string;
}

export interface Bendahara {
  id: string;
  nama: string;
  peran: string; // e.g., 'Bendahara Utama', 'Bendahara 1', 'Sekretaris'
  no_hp?: string;
  avatarColor?: string;
}

export interface ProgramKegiatan {
  id_program: string;
  nama_program: string;
  target_dana?: number;
  tanggal_pelaksanaan?: string;
  deskripsi?: string;
  status: 'aktif' | 'selesai' | 'draft';
}

export interface ProgramSummary {
  id_program?: string;
  nama_program: string;
  target_dana?: number;
  tanggal_pelaksanaan?: string;
  deskripsi?: string;
  status?: 'aktif' | 'selesai' | 'draft';
  total_dana_masuk: number;
  total_dana_keluar: number;
  saldo_bersih: number;
  jumlah_transaksi: number;
  jumlah_anggota: number;
  transaksi_terakhir: string;
}

export interface MajlisTaklimConfig {
  app_name?: string;
  app_subtitle?: string;
  nama_majlis: string;
  sub_nama: string;
  alamat: string;
  no_kontak: string;
  logo_teks: string;
  logo_url?: string;
  apps_script_url?: string;
  auto_sync_sheets?: boolean;
  last_sync_time?: string;
  daftar_program?: ProgramKegiatan[];
  nama_ketua?: string;
  nama_bendahara?: string;
  jabatan_ketua?: string;
  jabatan_bendahara?: string;
}
