import React, { useState } from 'react';
import { Anggota, MajlisTaklimConfig, Setoran } from '../types';
import { formatDateIndo, formatDateShort, formatRupiah, generateWhatsAppMessage } from '../utils/formatters';
import { getMemberBalance } from '../utils/storage';
import { APP_LOGO, APP_NAME, APP_SUBTITLE } from '../assets/logo';
import {
  X,
  User,
  Phone,
  MapPin,
  Calendar,
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  PlusCircle,
  Share2,
  Printer,
  ReceiptText,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface MemberDetailModalProps {
  member: Anggota | null;
  setoranList: Setoran[];
  config: MajlisTaklimConfig;
  onClose: () => void;
  onOpenNewTransaction: (memberId: string) => void;
  onOpenReceipt: (tx: Setoran) => void;
}

export const MemberDetailModal: React.FC<MemberDetailModalProps> = ({
  member,
  setoranList,
  config,
  onClose,
  onOpenNewTransaction,
  onOpenReceipt,
}) => {
  const [copiedWA, setCopiedWA] = useState(false);

  if (!member) return null;

  // Filter member transactions and sort chronologically
  const memberTransactions = setoranList
    .filter((s) => s.id_anggota === member.id_anggota)
    .sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());

  let totalSetor = 0;
  let totalTarik = 0;
  memberTransactions.forEach((tx) => {
    if (tx.jenis === 'setor') totalSetor += tx.jumlah;
    else totalTarik += tx.jumlah;
  });
  const currentBalance = totalSetor - totalTarik;

  const handlePrintPassbook = () => {
    window.print();
  };

  const handleShareSummaryWA = () => {
    const text = `*BUKU TABUNGAN ${APP_NAME.toUpperCase()}*
*${config.nama_majlis.toUpperCase()}*
---------------------------------------
Nama Jamaah : *${member.nama}*
ID Anggota  : *${member.id_anggota}*
Status      : ${member.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
---------------------------------------
• Total Setoran Masuk (+) : ${formatRupiah(totalSetor)}
• Total Penarikan (-)     : ${formatRupiah(totalTarik)}
---------------------------------------
*SISA SALDO AKTIF:*
*${formatRupiah(currentBalance)}*
---------------------------------------
*RIWAYAT TRANSAKSI TERAKHIR:*
${
  memberTransactions.length > 0
    ? memberTransactions
        .map(
          (t, idx) =>
            `${idx + 1}. ${formatDateShort(t.tanggal)} | ${t.jenis === 'setor' ? '(+)' : '(-)'} ${formatRupiah(t.jumlah)} | ${t.keterangan_program || 'Tabungan Fleksibel'}`
        )
        .join('\n')
    : 'Belum ada transaksi.'
}
---------------------------------------
_Jazakumullahu khairan katsiran atas keikutsertaan menabung di Majlis Taklim._`;

    navigator.clipboard.writeText(text).then(() => {
      setCopiedWA(true);
      setTimeout(() => setCopiedWA(false), 2500);
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-purple-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-800 border border-purple-700 text-white flex items-center justify-center font-bold text-base shadow-sm">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base sm:text-lg font-display">{member.nama}</h3>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                    member.status === 'aktif'
                      ? 'bg-emerald-600 text-white border border-emerald-500'
                      : 'bg-rose-900 text-rose-200 border border-rose-800'
                  }`}
                >
                  {member.status}
                </span>
              </div>
              <p className="text-[12px] text-purple-200 font-mono">ID: {member.id_anggota}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-purple-800 text-purple-200 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Member Details & Quick Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="space-y-1">
              <span className="text-[11px] text-slate-500 block font-normal">Nomor WhatsApp / HP:</span>
              <div className="font-semibold text-slate-800 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                {member.no_hp || '-'}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[11px] text-slate-500 block font-normal">Alamat / RT RW:</span>
              <div className="font-semibold text-slate-800 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-600" />
                {member.alamat || 'Sesuai domisili'}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[11px] text-slate-500 block font-normal">Mulai Menabung / Gabung:</span>
              <div className="font-semibold text-slate-800 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                {formatDateShort(member.tanggal_gabung)}
              </div>
            </div>
            {member.catatan && (
              <div className="md:col-span-3 pt-2 border-t border-slate-200 text-slate-600 italic font-normal">
                Catatan: {member.catatan}
              </div>
            )}
          </div>

          {/* Balance Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Total Setor */}
            <div className="bg-emerald-50/80 p-3.5 rounded-xl border border-emerald-200 text-slate-800">
              <div className="flex items-center justify-between text-[11px] text-emerald-800 font-medium mb-1">
                <span>Total Setoran Masuk</span>
                <ArrowDownRight className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-lg font-bold text-emerald-950 tabular-nums font-display">
                {formatRupiah(totalSetor)}
              </div>
            </div>

            {/* Total Tarik */}
            <div className="bg-amber-50/80 p-3.5 rounded-xl border border-amber-200 text-slate-800">
              <div className="flex items-center justify-between text-[11px] text-amber-800 font-medium mb-1">
                <span>Total Penarikan / Dipakai</span>
                <ArrowUpRight className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-lg font-bold text-amber-950 tabular-nums font-display">
                {formatRupiah(totalTarik)}
              </div>
            </div>

            {/* Sisa Saldo */}
            <div className="bg-slate-900 p-3.5 rounded-xl text-white shadow-sm">
              <div className="flex items-center justify-between text-[11px] text-amber-300 font-medium mb-1">
                <span>Sisa Saldo Tabungan</span>
                <Wallet className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-lg font-bold text-white tabular-nums font-display">
                {formatRupiah(currentBalance)}
              </div>
            </div>
          </div>

          {/* Buku Tabungan Ledger Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <ReceiptText className="w-4 h-4 text-emerald-700" />
                <span>Buku Riwayat Tabungan ({memberTransactions.length} transaksi)</span>
              </h4>
              <button
                onClick={() => onOpenNewTransaction(member.id_anggota)}
                className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Catat Transaksi</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-emerald-900 text-white uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">No</th>
                      <th className="py-2.5 px-3">Tanggal</th>
                      <th className="py-2.5 px-3">Program Kegiatan</th>
                      <th className="py-2.5 px-3 text-right">Setor (+)</th>
                      <th className="py-2.5 px-3 text-right">Tarik (-)</th>
                      <th className="py-2.5 px-3 text-right">Saldo</th>
                      <th className="py-2.5 px-3">Bendahara</th>
                      <th className="py-2.5 px-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {memberTransactions.length > 0 ? (
                      memberTransactions.map((tx, idx) => (
                        <tr key={tx.id_setoran} className="hover:bg-slate-50 transition">
                          <td className="py-2.5 px-3 text-slate-400 font-mono">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-medium whitespace-nowrap">
                            {formatDateShort(tx.tanggal)}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-semibold text-emerald-900 block">
                              {tx.keterangan_program || 'Tabungan Fleksibel'}
                            </span>
                            {tx.catatan && (
                              <span className="text-[10px] text-slate-400 italic block">
                                {tx.catatan}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                            {tx.jenis === 'setor' ? formatRupiah(tx.jumlah) : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-amber-800">
                            {tx.jenis === 'tarik' ? formatRupiah(tx.jumlah) : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                            {formatRupiah(tx.saldo_setelah)}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                            {tx.dicatat_oleh.split(' ')[0]}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              onClick={() => onOpenReceipt(tx)}
                              className="p-1 rounded-md bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-800 transition cursor-pointer"
                              title="Cetak Kuitansi Transaksi Ini"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="py-6 text-center text-slate-400">
                          Belum ada setoran atau penarikan untuk anggota ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap gap-2 justify-between items-center shrink-0">
          <div className="text-xs text-slate-500">
            Total {memberTransactions.length} catatan transaksi
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleShareSummaryWA}
              className="flex items-center space-x-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              {copiedWA ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Share2 className="w-4 h-4" />}
              <span>{copiedWA ? 'Rincian Disalin!' : 'Kirim Ringkasan WA'}</span>
            </button>
            <button
              onClick={handlePrintPassbook}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-900 text-white px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Buku Tabungan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
