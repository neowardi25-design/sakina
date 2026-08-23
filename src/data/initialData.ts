import { Anggota, Bendahara, MajlisTaklimConfig, ProgramKegiatan, Setoran } from '../types';

export const initialPrograms: ProgramKegiatan[] = [];

export const initialConfig: MajlisTaklimConfig = {
  app_name: 'SAKINA',
  app_subtitle: 'Simpanan Anggota Kegiatan Majlis Taklim',
  nama_majlis: 'Majlis Taklim',
  sub_nama: 'Simpanan Anggota Kegiatan Majlis Taklim',
  alamat: '',
  no_kontak: '',
  logo_teks: 'SAKINA',
  logo_url: 'https://res.cloudinary.com/maswardi/image/upload/v1787467189/2_lehnfa.png',
  apps_script_url: 'https://script.google.com/macros/s/AKfycbxQoyJ19Pev9Rj3_wDQQIBmxXW1W6vWi3SN2aZ1XrtFFaMdSFlPdegeV8AYqv9Ppo_v/exec',
  auto_sync_sheets: true,
  daftar_program: [],
  nama_ketua: '',
  nama_bendahara: 'Bendahara Majlis',
  jabatan_ketua: 'Ketua Majlis',
  jabatan_bendahara: 'Bendahara Utama',
};

export const initialBendahara: Bendahara[] = [
  {
    id: 'BND-01',
    nama: 'Bendahara Majlis',
    peran: 'Bendahara Utama',
    no_hp: '',
    avatarColor: 'bg-emerald-700',
  },
];

export const initialAnggota: Anggota[] = [];

export const initialSetoran: Setoran[] = [];


