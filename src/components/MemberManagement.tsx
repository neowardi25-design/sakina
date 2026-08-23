import React, { useState } from 'react';
import { Anggota, RekapAnggota, Setoran } from '../types';
import { formatDateShort, formatRupiah } from '../utils/formatters';
import { generateMemberId } from '../utils/storage';
import {
  Users,
  Search,
  UserPlus,
  Edit2,
  CheckCircle,
  XCircle,
  Eye,
  PlusCircle,
  Phone,
  Filter,
  ArrowUpDown,
  BookOpen,
  X,
  LayoutGrid,
  List,
  Wallet,
  Calendar,
  MessageCircle,
  ChevronRight
} from 'lucide-react';

interface MemberManagementProps {
  anggotaList: Anggota[];
  rekapList: RekapAnggota[];
  setoranList: Setoran[];
  onAddMember: (newMember: Anggota) => void;
  onUpdateMember: (updatedMember: Anggota) => void;
  onToggleStatus: (id: string) => void;
  onOpenMemberDetail: (member: Anggota) => void;
  onOpenNewTransaction: (memberId: string) => void;
}

export const MemberManagement: React.FC<MemberManagementProps> = ({
  anggotaList,
  rekapList,
  setoranList,
  onAddMember,
  onUpdateMember,
  onToggleStatus,
  onOpenMemberDetail,
  onOpenNewTransaction,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'semua' | 'aktif' | 'nonaktif'>('semua');
  const [sortBy, setSortBy] = useState<'nama' | 'saldo' | 'transaksi'>('saldo');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

  // Modal Add / Edit State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Anggota | null>(null);

  const [formData, setFormData] = useState({
    id_anggota: '',
    nama: '',
    no_hp: '',
    alamat: '',
    tanggal_gabung: new Date().toISOString().split('T')[0],
    status: 'aktif' as 'aktif' | 'nonaktif',
    catatan: '',
  });

  const handleOpenAdd = () => {
    setEditingMember(null);
    setFormData({
      id_anggota: generateMemberId(anggotaList),
      nama: '',
      no_hp: '',
      alamat: '',
      tanggal_gabung: new Date().toISOString().split('T')[0],
      status: 'aktif',
      catatan: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (e: React.MouseEvent, member: Anggota) => {
    e.stopPropagation();
    setEditingMember(member);
    setFormData({
      id_anggota: member.id_anggota,
      nama: member.nama,
      no_hp: member.no_hp || '',
      alamat: member.alamat || '',
      tanggal_gabung: member.tanggal_gabung,
      status: member.status,
      catatan: member.catatan || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama.trim()) return;

    if (editingMember) {
      onUpdateMember({
        ...editingMember,
        nama: formData.nama.trim(),
        no_hp: formData.no_hp.trim(),
        alamat: formData.alamat.trim() || undefined,
        tanggal_gabung: formData.tanggal_gabung,
        status: formData.status,
        catatan: formData.catatan.trim() || undefined,
      });
    } else {
      onAddMember({
        id_anggota: formData.id_anggota || generateMemberId(anggotaList),
        nama: formData.nama.trim(),
        no_hp: formData.no_hp.trim(),
        alamat: formData.alamat.trim() || undefined,
        tanggal_gabung: formData.tanggal_gabung,
        status: formData.status,
        catatan: formData.catatan.trim() || undefined,
      });
    }

    setIsModalOpen(false);
  };

  // Filter and Sort
  const filteredMembers = anggotaList
    .filter((m) => {
      const matchSearch =
        m.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.id_anggota.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.no_hp && m.no_hp.includes(searchTerm)) ||
        (m.alamat && m.alamat.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus = statusFilter === 'semua' || m.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      const rekapA = rekapList.find((r) => r.id_anggota === a.id_anggota);
      const rekapB = rekapList.find((r) => r.id_anggota === b.id_anggota);

      if (sortBy === 'saldo') {
        return (rekapB?.saldo_berjalan || 0) - (rekapA?.saldo_berjalan || 0);
      }
      if (sortBy === 'transaksi') {
        return (rekapB?.jumlah_transaksi || 0) - (rekapA?.jumlah_transaksi || 0);
      }
      return a.nama.localeCompare(b.nama);
    });

  return (
    <div className="space-y-4 pb-16 max-w-md md:max-w-2xl mx-auto">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER BAR */}
      {/* ========================================================================= */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-[16px] sm:text-[18px] font-bold text-slate-900 font-display flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-900" />
            <span>Daftar Jamaah</span>
          </h2>
          <p className="text-[11.5px] text-slate-500 font-normal mt-0.5">
            {anggotaList.length} jamaah terdaftar • Pantau saldo tabungan
          </p>
        </div>
        
        <button
          onClick={handleOpenAdd}
          className="bg-purple-900 hover:bg-purple-800 text-white px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 2. SEARCH AND FILTER CONTROLS */}
      {/* ========================================================================= */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs space-y-2.5">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama, ID, no HP, alamat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-[13px] font-normal text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-hidden transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter & Sort Controls */}
        <div className="grid grid-cols-2 gap-2">
          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full pl-3 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 truncate focus:ring-2 focus:ring-purple-500 focus:outline-hidden appearance-none cursor-pointer"
            >
              <option value="semua">Status: Semua</option>
              <option value="aktif">Hanya Aktif</option>
              <option value="nonaktif">Hanya Nonaktif</option>
            </select>
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Sort By */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full pl-3 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 truncate focus:ring-2 focus:ring-purple-500 focus:outline-hidden appearance-none cursor-pointer"
            >
              <option value="saldo">Urut: Saldo Tertinggi</option>
              <option value="transaksi">Urut: Sering Setor</option>
              <option value="nama">Urut: Nama (A-Z)</option>
            </select>
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Counter Badge & View Switcher */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5 px-0.5 font-normal">
          <span>
            Menampilkan <strong className="text-slate-800 font-semibold">{filteredMembers.length}</strong> jamaah
          </span>

          <div className="flex items-center space-x-2">
            {(statusFilter !== 'semua' || searchTerm) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('semua');
                }}
                className="text-rose-600 font-semibold hover:underline"
              >
                Reset Filter
              </button>
            )}

            <div className="hidden sm:flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => setViewMode('card')}
                className={`p-1 rounded-md text-xs transition ${
                  viewMode === 'card' ? 'bg-white shadow-xs text-purple-900' : 'text-slate-400'
                }`}
                title="Tampilan Kartu"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1 rounded-md text-xs transition ${
                  viewMode === 'table' ? 'bg-white shadow-xs text-purple-900' : 'text-slate-400'
                }`}
                title="Tampilan Tabel"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MEMBERS LIST (NATIVE MOBILE CARDS) */}
      {/* ========================================================================= */}
      {filteredMembers.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
            <Users className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">Tidak ada jamaah ditemukan</h4>
          <p className="text-xs text-slate-500 mt-0.5 font-normal">
            Coba ubah kata kunci pencarian Anda.
          </p>
        </div>
      ) : viewMode === 'card' ? (
        <div className="space-y-2.5">
          {filteredMembers.map((member) => {
            const rekap = rekapList.find((r) => r.id_anggota === member.id_anggota);
            const isAktif = member.status === 'aktif';
            const saldo = rekap?.saldo_berjalan || 0;
            const txCount = rekap?.jumlah_transaksi || 0;

            return (
              <div
                key={member.id_anggota}
                onClick={() => onOpenMemberDetail(member)}
                className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs hover:border-purple-300 transition cursor-pointer active:scale-[0.99] relative overflow-hidden"
              >
                {/* Top Row: Avatar + Name & ID + Balance */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    {/* Member Avatar Initial */}
                    <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-950 flex items-center justify-center font-bold text-xs border border-purple-200 shrink-0 font-display">
                      {member.nama.charAt(0).toUpperCase()}
                    </div>

                    {/* Name and ID */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs sm:text-[13px] font-bold text-slate-900 truncate font-display">
                          {member.nama}
                        </span>
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            isAktif ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                          title={isAktif ? 'Aktif' : 'Nonaktif'}
                        />
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1 mt-0.5 truncate tabular-nums">
                        <span>{member.id_anggota}</span>
                        {member.no_hp && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="flex items-center gap-0.5 text-slate-600">
                              <Phone className="w-2.5 h-2.5 text-slate-400" />
                              {member.no_hp}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Saldo Berjalan */}
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-[0.5px] block">
                      Saldo
                    </span>
                    <div className="text-xs sm:text-[13px] font-bold font-mono text-emerald-900 tracking-tight tabular-nums">
                      {formatRupiah(saldo)}
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Stats & Action Buttons */}
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-normal">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium text-[10.5px]">
                      {txCount}x transaksi
                    </span>
                    {member.alamat && (
                      <span className="truncate max-w-[120px] text-slate-400 hidden xs:inline">
                        📍 {member.alamat}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
                    {/* Edit Button */}
                    <button
                      onClick={(e) => handleOpenEdit(e, member)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-purple-900 transition cursor-pointer"
                      title="Edit Data Jamaah"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Direct WhatsApp chat if phone exists */}
                    {member.no_hp && (
                      <a
                        href={`https://wa.me/${member.no_hp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 transition"
                        title="Chat WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </a>
                    )}

                    {/* Catat Setoran Button */}
                    <button
                      onClick={() => onOpenNewTransaction(member.id_anggota)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-semibold flex items-center gap-1 transition border border-emerald-200 cursor-pointer"
                      title="Catat Setoran Jamaah Ini"
                    >
                      <PlusCircle className="w-3 h-3 text-emerald-600" />
                      <span>Setor</span>
                    </button>

                    {/* Buku Tabungan Button */}
                    <button
                      onClick={() => onOpenMemberDetail(member)}
                      className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-900 text-[11px] font-semibold flex items-center gap-1 transition border border-purple-200 cursor-pointer"
                      title="Buka Buku Tabungan"
                    >
                      <BookOpen className="w-3 h-3 text-purple-900" />
                      <span>Buku</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Full Desktop Table (when table mode selected) */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white uppercase text-[10px] tracking-[0.5px]">
                <tr>
                  <th className="py-2.5 px-3.5">ID & Nama Jamaah</th>
                  <th className="py-2.5 px-3.5">No. WhatsApp</th>
                  <th className="py-2.5 px-3.5">Status</th>
                  <th className="py-2.5 px-3.5 text-right">Total Setor</th>
                  <th className="py-2.5 px-3.5 text-right">Sisa Saldo</th>
                  <th className="py-2.5 px-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-normal">
                {filteredMembers.map((member) => {
                  const rekap = rekapList.find((r) => r.id_anggota === member.id_anggota);
                  const isAktif = member.status === 'aktif';
                  return (
                    <tr
                      key={member.id_anggota}
                      onClick={() => onOpenMemberDetail(member)}
                      className="hover:bg-slate-50 transition cursor-pointer"
                    >
                      <td className="py-2.5 px-3.5">
                        <div className="font-bold text-slate-900 font-display">{member.nama}</div>
                        <div className="text-[10px] text-slate-500 font-mono tabular-nums">{member.id_anggota}</div>
                      </td>
                      <td className="py-2.5 px-3.5 font-mono text-[11px] text-slate-600 tabular-nums">
                        {member.no_hp || '-'}
                      </td>
                      <td className="py-2.5 px-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isAktif
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {isAktif ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-mono font-medium text-slate-600 tabular-nums">
                        {formatRupiah(rekap?.total_setor || 0)}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-mono font-bold text-emerald-900 tabular-nums">
                        {formatRupiah(rekap?.saldo_berjalan || 0)}
                      </td>
                      <td className="py-2.5 px-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => onOpenNewTransaction(member.id_anggota)}
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 cursor-pointer"
                            title="Setor"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleOpenEdit(e, member)}
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODAL TAMBAH / EDIT ANGGOTA */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-purple-900 text-white p-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold tracking-tight font-display">
                  {editingMember ? 'Edit Data Jamaah' : 'Pendaftaran Jamaah Baru'}
                </h3>
                <p className="text-xs text-purple-200 mt-0.5 font-normal">
                  Lengkapi data untuk pembukuan tabungan
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-purple-800 text-purple-200 hover:text-white flex items-center justify-center cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitForm} className="p-4 space-y-3">
              {/* ID Anggota */}
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-[0.5px] text-slate-500 mb-1">
                  ID Anggota (Otomatis)
                </label>
                <input
                  type="text"
                  value={formData.id_anggota}
                  readOnly
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl font-mono text-xs font-bold text-slate-700 tabular-nums"
                />
              </div>

              {/* Nama Lengkap */}
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-[0.5px] text-slate-600 mb-1">
                  Nama Lengkap Jamaah <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ibu Hj. Siti Khadijah"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>

              {/* No WhatsApp / HP */}
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-[0.5px] text-slate-600 mb-1">
                  Nomor WhatsApp / HP
                </label>
                <input
                  type="tel"
                  placeholder="Contoh: 08123456789"
                  value={formData.no_hp}
                  onChange={(e) => setFormData({ ...formData, no_hp: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-hidden tabular-nums"
                />
              </div>

              {/* Alamat / RT RW */}
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-[0.5px] text-slate-600 mb-1">
                  Alamat / RT / RW
                </label>
                <input
                  type="text"
                  placeholder="Contoh: RT 03 RW 05 Ds. Sukamaju"
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-normal text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>

              {/* Tanggal Gabung & Status */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-[0.5px] text-slate-600 mb-1">
                    Tanggal Terdaftar
                  </label>
                  <input
                    type="date"
                    value={formData.tanggal_gabung}
                    onChange={(e) => setFormData({ ...formData, tanggal_gabung: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-normal text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-[0.5px] text-slate-600 mb-1">
                    Status Jamaah
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  >
                    <option value="aktif">Aktif</option>
                    <option value="nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>

              {/* Catatan Khusus */}
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-[0.5px] text-slate-600 mb-1">
                  Catatan Tambahan (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Catatan khusus, kelompok pengajian, dll..."
                  value={formData.catatan}
                  onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-normal text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-900 hover:bg-purple-800 text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
                >
                  {editingMember ? 'Simpan Perubahan' : 'Daftarkan Jamaah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
