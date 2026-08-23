import React, { useState } from 'react';
import { Anggota, MajlisTaklimConfig, ProgramKegiatan, ProgramSummary, Setoran } from '../types';
import { calculateProgramSummaries } from '../utils/storage';
import { formatDateShort, formatRupiah } from '../utils/formatters';
import {
  Compass,
  Users,
  PlusCircle,
  Calendar,
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  Printer,
  ChevronRight,
  Sparkles,
  Search,
  CheckCircle2,
  PieChart,
  Layers,
  FileText,
  Target,
  Settings
} from 'lucide-react';

interface ProgramHistoryProps {
  setoranList: Setoran[];
  anggotaList: Anggota[];
  config: MajlisTaklimConfig;
  programList?: ProgramKegiatan[];
  onOpenNewTransaction: (memberId?: string, program?: string) => void;
  onOpenReceipt: (tx: Setoran) => void;
  onOpenProgramManagement?: () => void;
}

export const ProgramHistory: React.FC<ProgramHistoryProps> = ({
  setoranList,
  anggotaList,
  config,
  programList,
  onOpenNewTransaction,
  onOpenReceipt,
  onOpenProgramManagement,
}) => {
  const [selectedProgramName, setSelectedProgramName] = useState<string | null>(null);
  const [searchProgram, setSearchProgram] = useState('');

  const programSummaries = calculateProgramSummaries(setoranList, programList);

  const filteredPrograms = programSummaries.filter((p) =>
    p.nama_program.toLowerCase().includes(searchProgram.toLowerCase())
  );

  // Selected program data
  const activeProgram = programSummaries.find((p) => p.nama_program === selectedProgramName);
  const activeProgramTransactions = selectedProgramName
    ? setoranList
        .filter((s) => (s.keterangan_program?.trim() || 'Tabungan Fleksibel / Bebas') === selectedProgramName)
        .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
    : [];

  // Group members participating in active program
  const participantMap = new Map<string, { nama: string; total: number; count: number }>();
  activeProgramTransactions.forEach((tx) => {
    if (!participantMap.has(tx.id_anggota)) {
      participantMap.set(tx.id_anggota, {
        nama: tx.nama_anggota || tx.id_anggota,
        total: 0,
        count: 0,
      });
    }
    const p = participantMap.get(tx.id_anggota)!;
    p.count += 1;
    if (tx.jenis === 'setor') p.total += tx.jumlah;
    else p.total -= tx.jumlah;
  });

  const participantList = Array.from(participantMap.entries()).map(([id, val]) => ({
    id,
    ...val,
  }));

  const handlePrintProgram = () => {
    window.print();
  };

  return (
    <div className="space-y-4 pb-16 max-w-md md:max-w-2xl mx-auto">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER */}
      {/* ========================================================================= */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-2">
        <div>
          <h2 className="text-[16px] sm:text-[18px] font-bold text-slate-900 font-display flex items-center gap-2">
            <Compass className="w-5 h-5 text-purple-900" />
            <span>Program Kegiatan</span>
          </h2>
          <p className="text-[11.5px] text-slate-500 font-normal mt-0.5">
            {programSummaries.length} agenda kegiatan majlis taklim
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          {onOpenProgramManagement && (
            <button
              onClick={onOpenProgramManagement}
              title="Kelola Program di Pengaturan"
              className="p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-purple-50 hover:text-purple-900 transition cursor-pointer text-xs font-semibold flex items-center gap-1"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Kelola Program</span>
            </button>
          )}
          <button
            onClick={() => onOpenNewTransaction(undefined, programSummaries.length > 0 ? programSummaries[0].nama_program : undefined)}
            className="bg-purple-900 hover:bg-purple-800 text-white px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Setor Program</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SEARCH BAR */}
      {/* ========================================================================= */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama kegiatan ziarah / rihlah..."
            value={searchProgram}
            onChange={(e) => setSearchProgram(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-[13px] font-normal text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-hidden transition"
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. PROGRAM LIST CARDS */}
      {/* ========================================================================= */}
      <div className="space-y-2.5">
        {filteredPrograms.map((prog, idx) => {
          const isSelected = selectedProgramName === prog.nama_program;
          const percentage =
            prog.target_dana && prog.target_dana > 0
              ? Math.min(100, Math.round((prog.saldo_bersih / prog.target_dana) * 100))
              : null;

          return (
            <div
              key={idx}
              className={`bg-white rounded-2xl p-4 border transition cursor-pointer shadow-xs ${
                isSelected
                  ? 'border-purple-900 ring-2 ring-purple-900/10'
                  : 'border-slate-200/80 hover:border-purple-300'
              }`}
              onClick={() => setSelectedProgramName(isSelected ? null : prog.nama_program)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-900 border border-purple-200 flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-xs sm:text-[13.5px] font-bold text-slate-900 leading-snug font-display">
                        {prog.nama_program}
                      </h3>
                      {prog.status && (
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase ${
                            prog.status === 'selesai'
                              ? 'bg-slate-100 text-slate-700 border border-slate-300'
                              : prog.status === 'draft'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {prog.status}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 font-normal flex-wrap">
                      <span className="flex items-center gap-0.5 text-purple-900 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md font-medium">
                        <Users className="w-3 h-3" />
                        {prog.jumlah_anggota} Jamaah
                      </span>
                      <span className="text-slate-300">•</span>
                      <span>{prog.jumlah_transaksi}x setoran</span>
                      {prog.tanggal_pelaksanaan && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="flex items-center gap-0.5 text-slate-600">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {prog.tanggal_pelaksanaan}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] uppercase font-medium text-slate-400 block tracking-[0.5px]">
                    Saldo Terkumpul
                  </span>
                  <div className="text-xs sm:text-[14px] font-bold font-mono text-emerald-950 tracking-tight tabular-nums mt-0.5">
                    {formatRupiah(prog.saldo_bersih)}
                  </div>
                  {prog.target_dana ? (
                    <span className="text-[10px] text-slate-400 font-mono block">
                      Target: {formatRupiah(prog.target_dana)}
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Target Progress Bar */}
              {percentage !== null && (
                <div className="mt-2.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[10.5px] font-medium text-slate-600 mb-1">
                    <span>Pencapaian Target</span>
                    <span className="font-mono font-bold text-purple-900">{percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-purple-900 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Progress Summary Strip */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-normal">
                <span className="text-slate-500">
                  Setoran Masuk: <strong className="font-mono text-emerald-900 font-bold tabular-nums">{formatRupiah(prog.total_dana_masuk)}</strong>
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenNewTransaction(undefined, prog.nama_program);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 font-medium text-[11px] flex items-center gap-1 transition cursor-pointer"
                >
                  <PlusCircle className="w-3 h-3" />
                  <span>Setor ke Program Ini</span>
                </button>
              </div>

              {/* Collapsible Details: Participants and Log */}
              {isSelected && (
                <div
                  className="mt-3.5 pt-3.5 border-t border-purple-100 bg-purple-50/40 -mx-4 -mb-4 p-3.5 rounded-b-2xl space-y-2.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  {prog.deskripsi && (
                    <p className="text-[11.5px] text-slate-700 bg-white p-2.5 rounded-xl border border-purple-100 italic">
                      "{prog.deskripsi}"
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 font-display">
                      Daftar Jamaah ({participantList.length} Orang)
                    </span>
                    <button
                      onClick={handlePrintProgram}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 text-[11px] font-medium flex items-center gap-1 shadow-2xs hover:bg-slate-50 cursor-pointer"
                    >
                      <Printer className="w-3 h-3" />
                      <span>Cetak Rekap</span>
                    </button>
                  </div>

                  {/* Participant Chips */}
                  {participantList.length === 0 ? (
                    <div className="text-center py-3 text-[11px] text-slate-500 bg-white rounded-xl border border-slate-100">
                      Belum ada setoran masuk untuk program ini.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {participantList.map((p) => (
                        <div
                          key={p.id}
                          className="bg-white p-2.5 rounded-xl border border-slate-200/80 flex items-center justify-between shadow-2xs"
                        >
                          <div className="truncate mr-2">
                            <div className="text-xs font-semibold text-slate-800 truncate font-display">
                              {p.nama}
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono tabular-nums">
                              {p.count}x setor
                            </span>
                          </div>
                          <div className="text-xs font-bold font-mono text-emerald-950 shrink-0 tabular-nums">
                            {formatRupiah(p.total)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
