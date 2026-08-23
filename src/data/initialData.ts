import { Anggota, Bendahara, MajlisTaklimConfig, ProgramKegiatan, Setoran } from '../types';

export const initialPrograms: ProgramKegiatan[] = [
  {
    id_program: 'PROG-001',
    nama_program: 'Ziarah Wali Songo 2026',
    target_dana: 25000000,
    tanggal_pelaksanaan: '2026-06-15',
    deskripsi: 'Program tabungan ziarah keliling makam Wali Songo bersama seluruh jamaah majlis taklim.',
    status: 'aktif',
  },
  {
    id_program: 'PROG-002',
    nama_program: 'Wisata Religi Banten & Banten Lama',
    target_dana: 10000000,
    tanggal_pelaksanaan: '2026-08-20',
    deskripsi: 'Kunjungan ziarah ke Masjid Agung Banten, makam Sultan Hasanuddin, dan wisata religi.',
    status: 'aktif',
  },
  {
    id_program: 'PROG-003',
    nama_program: 'Santunan & Wisata Yatim Muharram',
    target_dana: 15000000,
    tanggal_pelaksanaan: '2026-07-25',
    deskripsi: 'Penyaluran santunan anak yatim dan dhuafa binaan majlis dalam peringatan bulan Muharram.',
    status: 'aktif',
  },
  {
    id_program: 'PROG-004',
    nama_program: 'Ziarah Luar Batang & Habib Ali Kwitang',
    target_dana: 8000000,
    tanggal_pelaksanaan: '2026-09-10',
    deskripsi: 'Ziarah makam habaib dan aulia di wilayah Jakarta dan sekitarnya.',
    status: 'aktif',
  },
  {
    id_program: 'PROG-005',
    nama_program: 'Wisata Religi Solo & Jogja',
    target_dana: 20000000,
    tanggal_pelaksanaan: '2026-11-05',
    deskripsi: 'Wisata religi dan silaturahmi ke Masjid Sheikh Zayed Solo dan pesantren Jogja.',
    status: 'aktif',
  },
  {
    id_program: 'PROG-006',
    nama_program: 'Milad & Khotmil Quran Majlis',
    target_dana: 12000000,
    tanggal_pelaksanaan: '2026-12-20',
    deskripsi: 'Peringatan milad majlis taklim dan tasyakuran khataman Al-Quran.',
    status: 'aktif',
  },
];

export const initialConfig: MajlisTaklimConfig = {
  app_name: 'SAKINA',
  app_subtitle: 'Simpanan Anggota Kegiatan Majlis Taklim',
  nama_majlis: 'Majlis Taklim Baiturrohman 1',
  sub_nama: 'Simpanan Anggota Kegiatan Majlis Taklim',
  alamat: 'Jl. Masjid Agung No. 12, Kel. Sukamaju, Kec. Cilodong, Kota Depok',
  no_kontak: '0812-8901-2345',
  logo_teks: 'SAKINA',
  logo_url: 'https://res.cloudinary.com/maswardi/image/upload/v1787467189/2_lehnfa.png',
  apps_script_url: 'https://script.google.com/macros/s/AKfycbxQoyJ19Pev9Rj3_wDQQIBmxXW1W6vWi3SN2aZ1XrtFFaMdSFlPdegeV8AYqv9Ppo_v/exec',
  auto_sync_sheets: true,
  daftar_program: initialPrograms,
  nama_ketua: 'H. Muhammad Syafi\'i',
  nama_bendahara: 'Ustadzah Hj. Fatimah Azzahra',
  jabatan_ketua: 'Ketua Majlis',
  jabatan_bendahara: 'Bendahara Utama',
};

export const initialBendahara: Bendahara[] = [
  {
    id: 'BND-01',
    nama: 'Ustadzah Hj. Fatimah Azzahra',
    peran: 'Bendahara Utama',
    no_hp: '0812-3456-7890',
    avatarColor: 'bg-emerald-700',
  },
  {
    id: 'BND-02',
    nama: 'Ibu Siti Nurhaliza',
    peran: 'Bendahara 1',
    no_hp: '0813-9876-5432',
    avatarColor: 'bg-teal-700',
  },
  {
    id: 'BND-03',
    nama: 'Ibu Hj. Maryam S.Pd',
    peran: 'Bendahara 2',
    no_hp: '0857-1122-3344',
    avatarColor: 'bg-amber-700',
  },
];

export const initialAnggota: Anggota[] = [];

export const initialSetoran: Setoran[] = [];

