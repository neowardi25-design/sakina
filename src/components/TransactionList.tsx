import React, { useState } from 'react';
import { Anggota, Setoran, TransactionType } from '../types';
import { formatDateIndo, formatDateShort, formatRupiah, generateWhatsAppMessage } from '../utils/formatters';
import { getDistinctPrograms } from '../utils/storage';
import {
  ReceiptText,
  Search,
  Filter,
  ArrowDownRight,
  ArrowUpRight,
  Printer,
  Share2,
  Calendar,
  Tag,
  CheckCircle2,
  Trash2,
  PlusCircle,
  X,
  LayoutGrid,
  List,
  Wallet,
  Clock,
  User,
  ShieldCheck,
  ChevronRight,
  Copy
} from 'lucide-react';

interface TransactionListProps {
  setoranList: Setoran[];
  anggotaList: Anggota[];
  namaMajlis: string;
  onOpenNewTransaction: () => void;
  onOpenReceipt: (tx: Setoran) => void;
  onDeleteTransaction?: (id: string) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  setoranList,
  anggotaList,
  namaMajlis,
  onOpenNewTransaction,
  onOpenReceipt,
  onDeleteTransaction,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProgram, setSelectedProgram] = useState<string>('semua');
  const [selectedType, setSelectedType] = useState<string>('semua');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

  const distinctPrograms = getDistinctPrograms(setoranList);

  const filteredTransactions = [...setoranList]
    .filter((tx) => {
      const matchSearch =
        tx.id_setoran.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tx.nama_anggota && tx.nama_anggota.toLowerCase().includes(searchTerm.toLowerCase())) ||
        tx.id_anggota.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tx.catatan && tx.catatan.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchProgram =
        selectedProgram === 'semua' ||
        (tx.keterangan_program && tx.keterangan_program.trim() === selectedProgram.trim());

      const matchType = selectedType === 'semua' || tx.jenis === selectedType;

      return matchSearch && matchProgram && matchType;
    })
    .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

  // Calculations for filtered set
  let sumSetor = 0;
  let sumTarik = 0;
  filteredTransactions.forEach((t) => {
    if (t.jenis === 'setor') sumSetor += t.jumlah;
    else sumTarik += t.jumlah;
  });
  const netBalance = sumSetor - sumTarik;

  const handleCopyWA = (tx: Setoran) => {
    const text = generateWhatsAppMessage({
      namaMajlis: namaMajlis,
      namaAnggota: tx.nama_anggota || tx.id_anggota,
      idAnggota: tx.id_anggota,
      jenisTransaksi: tx.jenis,
      jumlah: tx.jumlah,
      saldoSetelah: tx.saldo_setelah,
      tanggal: tx.tanggal,
      program: tx.keterangan_program,
      bendahara: tx.dicatat_oleh,
      idTransaksi: tx.id_setoran,
    });

    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(tx.id_setoran);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div className="space-y-4 pb-16 max-w-md md:max-w-2xl mx-auto">
      {/* ========================================================================= */}
      {/* 1. TOP TITLE & ACTION HEADER */}
      {/* ========================================================================= */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-[16px] sm:text-[18px] font-bold text-slate-900 font-display flex items-center gap-2">
            <ReceiptText className="w-5 h-5 text-purple-900" />
            <span>Riwayat Transaksi</span>
          </h2>
          <p className="text-[11.5px] text-slate-500 font-normal mt-0.5">
            Log lengkap setoran & penarikan tabungan
          </p>
        </div>
        
        <button
          onClick={onOpenNewTransaction}
          className="bg-purple-900 hover:bg-purple-800 text-white px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Catat Transaksi</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 2. SUMMARY METRIC CARDS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-3 gap-2">
        {/* Total Setoran */}
        <div className="bg-emerald-50 border border-emerald-200/80 p-3 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-medium tracking-[0.5px] text-emerald-800">
              Setoran (+)
            </span>
            <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xs sm:text-[13px] font-bold font-mono text-emerald-950 mt-1 tracking-tight truncate tabular-nums">
            {formatRupiah(sumSetor)}
          </div>
        </div>

        {/* Total Penarikan */}
        <div className="bg-rose-50 border border-rose-200/80 p-3 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-medium tracking-[0.5px] text-rose-800">
              Penarikan (-)
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-xs sm:text-[13px] font-bold font-mono text-rose-950 mt-1 tracking-tight truncate tabular-nums">
            {formatRupiah(sumTarik)}
          </div>
        </div>

        {/* Selisih Bersih */}
        <div className="bg-purple-950 text-white p-3 rounded-2xl flex flex-col justify-between shadow-xs border border-purple-900">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-medium tracking-[0.5px] text-purple-200">
              Selisih
            </span>
            <Wallet className="w-3.5 h-3.5 text-purple-300" />
          </div>
          <div className="text-xs sm:text-[13px] font-bold font-mono text-white mt-1 tracking-tight truncate tabular-nums">
            {formatRupiah(netBalance)}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. SEARCH & FILTER CONTROLS */}
      {/* ========================================================================= */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs space-y-2.5">
        {/* Search Field */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama, kuitansi, catatan..."
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

        {/* Filters Row */}
        <div className="grid grid-cols-2 gap-2">
          {/* Program Selector */}
          <div className="relative">
            <select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="w-full pl-3 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 truncate focus:ring-2 focus:ring-purple-500 focus:outline-hidden appearance-none cursor-pointer"
            >
              <option value="semua">Semua Program</option>
              {distinctPrograms.map((prog, i) => (
                <option key={i} value={prog}>
                  {prog}
                </option>
              ))}
            </select>
            <Tag className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Type Selector */}
          <div className="relative">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full pl-3 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 truncate focus:ring-2 focus:ring-purple-500 focus:outline-hidden appearance-none cursor-pointer"
            >
              <option value="semua">Semua Transaksi</option>
              <option value="setor">Setoran (+)</option>
              <option value="tarik">Penarikan (-)</option>
              <option value="refund">Refund (-)</option>
            </select>
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Counter and View Switcher */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5 px-0.5 font-normal">
          <span>
            Menampilkan <strong className="text-slate-800 font-semibold">{filteredTransactions.length}</strong> transaksi
          </span>

          <div className="flex items-center space-x-2">
            {(selectedProgram !== 'semua' || selectedType !== 'semua' || searchTerm) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedProgram('semua');
                  setSelectedType('semua');
                }}
                className="text-rose-600 font-semibold hover:underline"
              >
                Reset
              </button>
            )}

            {/* View Mode Toggle */}
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
      {/* 4. TRANSACTIONS LIST: NATIVE MOBILE FEED */}
      {/* ========================================================================= */}
      {filteredTransactions.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
            <ReceiptText className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800 font-display">Tidak ada transaksi ditemukan</h4>
          <p className="text-xs text-slate-500 mt-0.5 font-normal">
            Coba ubah kata kunci pencarian atau reset filter.
          </p>
        </div>
      ) : viewMode === 'card' ? (
        <div className="space-y-2.5">
          {filteredTransactions.map((tx) => {
            const isSetor = tx.jenis === 'setor';
            const isCopied = copiedId === tx.id_setoran;

            return (
              <div
                key={tx.id_setoran}
                className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs hover:border-purple-300 transition relative overflow-hidden"
              >
                {/* Top Section: Avatar/Icon + Member Name + Nominal */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    {/* Circle icon */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm border shadow-xs ${
                        isSetor
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}
                    >
                      {isSetor ? '+' : '-'}
                    </div>

                    {/* Member Details */}
                    <div className="min-w-0">
                      <div className="text-xs sm:text-[13px] font-bold text-slate-900 truncate font-display">
                        {tx.nama_anggota || tx.id_anggota}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 truncate flex items-center gap-1 mt-0.5 tabular-nums">
                        <span>{tx.id_setoran}</span>
                        <span className="text-slate-300">•</span>
                        <span>ID: {tx.id_anggota}</span>
                      </div>
                    </div>
                  </div>

                  {/* Nominal Amount */}
                  <div className="text-right shrink-0">
                    <div
                      className={`text-xs sm:text-[13px] font-bold font-mono tracking-tight tabular-nums ${
                        isSetor ? 'text-emerald-900' : 'text-rose-900'
                      }`}
                    >
                      {isSetor ? '+' : '-'}{formatRupiah(tx.jumlah)}
                    </div>
                    <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                      Saldo: <span className="font-semibold font-mono text-slate-700 tabular-nums">{formatRupiah(tx.saldo_setelah)}</span>
                    </div>
                  </div>
                </div>

                {/* Middle Info Tag (Program & Note) */}
                <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="bg-purple-50 text-purple-900 border border-purple-200 px-2 py-0.5 rounded-md text-[10px] font-medium">
                      {tx.keterangan_program || 'Tabungan Bebas'}
                    </span>
                    {tx.catatan && (
                      <span className="text-[10.5px] text-slate-500 italic truncate max-w-[140px]">
                        "{tx.catatan}"
                      </span>
                    )}
                  </div>

                  {/* Date and Time */}
                  <div className="text-[10.5px] text-slate-500 font-normal flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{formatDateShort(tx.tanggal)}</span>
                    {tx.waktu && <span className="text-slate-400">({tx.waktu})</span>}
                  </div>
                </div>

                {/* Bottom Actions Bar */}
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[10.5px] text-slate-500 truncate flex items-center gap-1 font-normal">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>Oleh: <strong className="text-slate-700 font-semibold">{tx.dicatat_oleh}</strong></span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {/* Print / View Receipt */}
                    <button
                      onClick={() => onOpenReceipt(tx)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium flex items-center gap-1 transition border border-slate-200 cursor-pointer"
                      title="Lihat & Cetak Kuitansi"
                    >
                      <Printer className="w-3 h-3 text-slate-600" />
                      <span>Kuitansi</span>
                    </button>

                    {/* Share WhatsApp */}
                    <button
                      onClick={() => handleCopyWA(tx)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1 transition border cursor-pointer ${
                        isCopied
                          ? 'bg-emerald-700 text-white border-emerald-700'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                      }`}
                      title="Salin Pesan WhatsApp"
                    >
                      {isCopied ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-3 h-3 text-emerald-700" />
                          <span>Kirim WA</span>
                        </>
                      )}
                    </button>

                    {/* Delete (if allowed) */}
                    {onDeleteTransaction && (
                      <button
                        onClick={() => {
                          if (confirm(`Yakin ingin menghapus transaksi ${tx.id_setoran}?`)) {
                            onDeleteTransaction(tx.id_setoran);
                          }
                        }}
                        className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                        title="Hapus Transaksi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
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
                  <th className="py-2.5 px-3.5">No. Resi & Tanggal</th>
                  <th className="py-2.5 px-3.5">Nama Jamaah</th>
                  <th className="py-2.5 px-3.5">Program</th>
                  <th className="py-2.5 px-3.5 text-right">Nominal</th>
                  <th className="py-2.5 px-3.5 text-right">Saldo Setelah</th>
                  <th className="py-2.5 px-3.5">Dicatat Oleh</th>
                  <th className="py-2.5 px-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-normal">
                {filteredTransactions.map((tx) => {
                  const isSetor = tx.jenis === 'setor';
                  return (
                    <tr key={tx.id_setoran} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-3.5 font-mono text-[11px] tabular-nums">
                        <div className="font-bold text-slate-900">{tx.id_setoran}</div>
                        <div className="text-slate-500">{formatDateShort(tx.tanggal)}</div>
                      </td>
                      <td className="py-2.5 px-3.5">
                        <div className="font-bold text-slate-900 font-display">{tx.nama_anggota || tx.id_anggota}</div>
                        <div className="text-[10px] text-slate-500 font-mono tabular-nums">ID: {tx.id_anggota}</div>
                      </td>
                      <td className="py-2.5 px-3.5">
                        <span className="bg-purple-50 text-purple-900 border border-purple-200 text-[10px] font-medium px-2 py-0.5 rounded-md">
                          {tx.keterangan_program || 'Tabungan Bebas'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-mono font-bold tabular-nums">
                        <span className={isSetor ? 'text-emerald-900' : 'text-rose-900'}>
                          {isSetor ? '+' : '-'}{formatRupiah(tx.jumlah)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-mono font-bold text-slate-900 tabular-nums">
                        {formatRupiah(tx.saldo_setelah)}
                      </td>
                      <td className="py-2.5 px-3.5 text-[11px] text-slate-600">
                        {tx.dicatat_oleh}
                      </td>
                      <td className="py-2.5 px-3.5 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => onOpenReceipt(tx)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer"
                            title="Kuitansi"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleCopyWA(tx)}
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 cursor-pointer"
                            title="Kirim WA"
                          >
                            <Share2 className="w-3.5 h-3.5" />
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
    </div>
  );
};
