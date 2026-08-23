import React, { useState } from 'react';
import { Anggota, Bendahara, MajlisTaklimConfig, ProgramKegiatan, RekapAnggota, Setoran } from '../types';
import { formatDateIndo, formatDateShort, formatNumber, formatRupiah } from '../utils/formatters';
import { calculateProgramSummaries } from '../utils/storage';
import {
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  Users,
  Calendar,
  Compass,
  Info,
  PlusCircle,
  ReceiptText,
  Printer,
  ChevronRight,
  Sparkles,
  TrendingUp,
  UserCheck,
  AlertTriangle,
  Clock,
  ShoppingBag,
  ShoppingCart,
  Package,
  Boxes,
  BarChart3,
  Truck,
  ShoppingBasket,
  Banknote,
  Tags,
  History,
  Shield,
  Search,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

interface DashboardProps {
  config: MajlisTaklimConfig;
  anggotaList: Anggota[];
  setoranList: Setoran[];
  rekapList: RekapAnggota[];
  programList?: ProgramKegiatan[];
  activeBendahara: Bendahara;
  onOpenNewTransaction: (memberId?: string, program?: string) => void;
  onOpenNewMember: () => void;
  onOpenMemberDetail: (member: Anggota) => void;
  onOpenReceipt: (tx: Setoran) => void;
  onNavigateTab: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  config,
  anggotaList,
  setoranList,
  rekapList,
  programList,
  activeBendahara,
  onOpenNewTransaction,
  onOpenNewMember,
  onOpenMemberDetail,
  onOpenReceipt,
  onNavigateTab,
}) => {
  const [showChart, setShowChart] = useState(false);

  // Aggregate Calculations
  const totalKasSaldo = rekapList.reduce((acc, curr) => acc + curr.saldo_berjalan, 0);
  const totalSetoranMasuk = rekapList.reduce((acc, curr) => acc + curr.total_setor, 0);
  const totalPenarikan = rekapList.reduce((acc, curr) => acc + curr.total_tarik + curr.total_refund, 0);
  const anggotaAktifCount = anggotaList.filter((m) => m.status === 'aktif').length;

  // Current Month calculations
  const now = new Date();
  const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthTransactions = setoranList.filter((s) => s.tanggal.startsWith(currentMonthPrefix));
  
  let pemasukanBulanIni = 0;
  let pengeluaranBulanIni = 0;
  currentMonthTransactions.forEach((tx) => {
    if (tx.jenis === 'setor') pemasukanBulanIni += tx.jumlah;
    else pengeluaranBulanIni += tx.jumlah;
  });

  // Program summaries
  const programSummaries = calculateProgramSummaries(setoranList, programList);
  const mainProgram = programSummaries.length > 0 ? programSummaries[0] : null;

  // Monthly trend calculation
  const monthlyDataMap = new Map<string, { monthKey: string; monthLabel: string; setor: number; tarik: number }>();
  const monthsIndo = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  
  setoranList.forEach((tx) => {
    try {
      const d = new Date(tx.tanggal);
      if (!isNaN(d.getTime())) {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = `${monthsIndo[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
        
        if (!monthlyDataMap.has(key)) {
          monthlyDataMap.set(key, { monthKey: key, monthLabel: label, setor: 0, tarik: 0 });
        }
        const item = monthlyDataMap.get(key)!;
        if (tx.jenis === 'setor') {
          item.setor += tx.jumlah;
        } else {
          item.tarik += tx.jumlah;
        }
      }
    } catch {
      // ignore
    }
  });

  const chartData = Array.from(monthlyDataMap.values()).sort((a, b) => a.monthKey.localeCompare(b.monthKey));

  // Recent transactions (last 6)
  const recentTransactions = [...setoranList]
    .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
    .slice(0, 6);

  // Top Savers (Members with highest balances)
  const topSavers = [...rekapList]
    .filter((r) => r.saldo_berjalan > 0)
    .sort((a, b) => b.saldo_berjalan - a.saldo_berjalan)
    .slice(0, 4);

  // 12 Menu Launcher Items with cohesive purple brand styling
  const menuItems = [
    {
      id: 'kasir_setor',
      label: 'Kasir / Setor',
      icon: ShoppingCart,
      badge: 'Baru',
      action: () => onOpenNewTransaction(),
    },
    {
      id: 'buku_tabungan',
      label: 'Buku Tabungan',
      icon: Package,
      action: () => onNavigateTab('anggota'),
    },
    {
      id: 'program',
      label: 'Program',
      icon: Boxes,
      badge: `${programSummaries.length}`,
      action: () => onNavigateTab('program'),
    },
    {
      id: 'statistik',
      label: 'Statistik',
      icon: BarChart3,
      action: () => setShowChart(!showChart),
    },
    {
      id: 'jamaah',
      label: 'Jamaah',
      icon: Users,
      badge: `${anggotaAktifCount}`,
      action: () => onNavigateTab('anggota'),
    },
    {
      id: 'tarik_dana',
      label: 'Tarik Dana',
      icon: ShoppingBag,
      action: () => onOpenNewTransaction(undefined, undefined),
    },
    {
      id: 'bendahara',
      label: 'Bendahara',
      icon: Truck,
      action: () => onNavigateTab('laporan'),
    },
    {
      id: 'laporan',
      label: 'Laporan',
      icon: ShoppingBasket,
      action: () => onNavigateTab('laporan'),
    },
    {
      id: 'tentang',
      label: 'Tentang',
      icon: Info,
      action: () => onNavigateTab('tentang'),
    },
    {
      id: 'kuitansi',
      label: 'Kuitansi',
      icon: Banknote,
      action: () => {
        if (recentTransactions.length > 0) {
          onOpenReceipt(recentTransactions[0]);
        } else {
          onNavigateTab('transaksi');
        }
      },
    },
    {
      id: 'cetak_rekap',
      label: 'Cetak Rekap',
      icon: Tags,
      action: () => onNavigateTab('laporan'),
    },
    {
      id: 'riwayat',
      label: 'Riwayat',
      icon: History,
      action: () => onNavigateTab('transaksi'),
    },
  ];

  return (
    <div className="space-y-3.5 pb-20 max-w-md md:max-w-xl lg:max-w-2xl mx-auto">
      {/* ========================================================================= */}
      {/* 1. TOP METRIC BENTO CARDS */}
      {/* ========================================================================= */}

      {/* Row 1: Dual Top Cards (Emerald Positive + Rose Negative) */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        {/* Card 1 (Kas Terkumpul - Positive Green / Emerald) */}
        <div 
          onClick={() => onNavigateTab('transaksi')}
          className="bg-emerald-900 rounded-2xl p-3 sm:p-3.5 text-white shadow-xs relative overflow-hidden flex flex-col justify-between cursor-pointer hover:bg-emerald-950 transition-colors active:scale-98 min-h-[92px] border border-emerald-800"
        >
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[10.5px] font-bold text-emerald-200 uppercase tracking-wider truncate">
              Kas Terkumpul
            </span>
            <div className="w-6 h-6 rounded-lg bg-emerald-800/90 text-emerald-100 flex items-center justify-center shrink-0">
              <ArrowDownRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
          </div>
          <div className="text-[15px] sm:text-[17px] font-bold text-white tracking-tight tabular-nums font-mono leading-tight">
            {formatRupiah(totalKasSaldo)}
          </div>
          <div className="text-[11px] text-emerald-200/90 font-medium flex items-center gap-1.5 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span className="truncate">{anggotaAktifCount} Jamaah Aktif</span>
          </div>
        </div>

        {/* Card 2 (Pengeluaran - Negative Rose / Red) */}
        <div 
          onClick={() => onNavigateTab('transaksi')}
          className="bg-rose-900 rounded-2xl p-3 sm:p-3.5 text-white shadow-xs relative overflow-hidden flex flex-col justify-between cursor-pointer hover:bg-rose-950 transition-colors active:scale-98 min-h-[92px] border border-rose-800"
        >
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[10.5px] font-bold text-rose-200 uppercase tracking-wider truncate">
              Pengeluaran
            </span>
            <div className="w-6 h-6 rounded-lg bg-rose-800/90 text-rose-100 flex items-center justify-center shrink-0">
              <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
          </div>
          <div className="text-[15px] sm:text-[17px] font-bold text-white tracking-tight tabular-nums font-mono leading-tight">
            {formatRupiah(totalPenarikan)}
          </div>
          <div className="text-[11px] text-rose-200/90 font-medium flex items-center gap-1.5 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
            <span className="truncate">Tarik / Penyaluran</span>
          </div>
        </div>
      </div>

      {/* Row 2: Full Width Purple Brand Card (Program Kegiatan) */}
      <div 
        onClick={() => onNavigateTab('program')}
        className="bg-purple-900 rounded-2xl p-3 sm:p-3.5 text-white shadow-xs flex items-center gap-3 cursor-pointer hover:bg-purple-950 transition-colors active:scale-98 border border-purple-800"
      >
        <div className="w-8 h-8 rounded-xl bg-purple-800 text-purple-100 flex items-center justify-center shrink-0">
          <Calendar className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0 leading-snug">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10.5px] font-bold text-purple-200 uppercase tracking-wider truncate">
              Program Ziarah / Kegiatan
            </span>
            <span className="text-[10px] bg-purple-800 text-purple-100 px-2 py-0.5 rounded-full font-medium shrink-0">
              {programSummaries.length} program
            </span>
          </div>
          <div className="text-[13.5px] sm:text-[14px] font-bold text-white mt-0.5 truncate font-display tracking-tight">
            {mainProgram ? mainProgram.nama_program : 'Ziarah Wali Songo 2026'}
          </div>
          <div className="text-[11px] text-purple-200/90 font-normal mt-0.5 truncate">
            {mainProgram
              ? `${mainProgram.jumlah_anggota} Jamaah • Terkumpul ${formatRupiah(mainProgram.saldo_bersih)}`
              : 'Siap didaftarkan'}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-purple-300 shrink-0" />
      </div>

      {/* Row 3: Full Width Card (Setoran Masuk Bulan Ini) */}
      <div 
        onClick={() => onNavigateTab('transaksi')}
        className="bg-white rounded-2xl p-3 sm:p-3.5 text-slate-900 shadow-xs flex items-center gap-3 cursor-pointer hover:bg-purple-50/40 transition-colors active:scale-98 border border-slate-200/80"
      >
        <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-900 flex items-center justify-center shrink-0 border border-purple-100">
          <ShoppingBag className="w-4 h-4 text-purple-900" />
        </div>
        <div className="flex-1 min-w-0 leading-snug">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider truncate">
              Setoran Masuk Bulan Ini
            </span>
            <span className="text-[10.5px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-full tabular-nums border border-emerald-200 shrink-0">
              +{formatRupiah(pemasukanBulanIni)}
            </span>
          </div>
          <div className="text-[13.5px] sm:text-[14px] font-bold text-slate-900 mt-0.5 truncate font-display tracking-tight">
            {currentMonthTransactions.length} Setoran Masuk
          </div>
          <div className="text-[11px] text-slate-500 font-normal mt-0.5 truncate">
            Tercatat oleh {activeBendahara.nama.split(' ')[0]}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
      </div>

      {/* ========================================================================= */}
      {/* 2. MENU UTAMA (MAIN MENU 3-COLUMN APP ICON LAUNCHER GRID) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-3.5 sm:p-4 shadow-xs border border-slate-200/80">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[14px] font-bold text-slate-900 tracking-tight font-display">
            Menu Utama
          </h2>
          <span className="text-[10.5px] font-semibold text-purple-900 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
            Fitur Tabungan
          </span>
        </div>

        {/* 3x4 Grid of App Launcher Icons (Unified Purple Brand Theme) */}
        <div className="grid grid-cols-3 gap-y-3.5 gap-x-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={item.action}
                className="flex flex-col items-center justify-center text-center group cursor-pointer active:scale-95 transition-transform select-none"
              >
                {/* Squircle App Icon in unified purple styling */}
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-900 border border-purple-100 flex items-center justify-center shadow-2xs group-hover:bg-purple-100 group-hover:border-purple-200 transition-all">
                    <Icon className="w-5 h-5 stroke-[2] text-purple-900" />
                  </div>
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 bg-purple-900 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full border-2 border-white shadow-2xs">
                      {item.badge}
                    </span>
                  )}
                </div>

                {/* Icon Label underneath */}
                <span className="text-[11px] font-medium text-slate-700 mt-1.5 tracking-tight group-hover:text-purple-900 transition-colors leading-snug">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. OPTIONAL STATISTICAL TREND GRAPH */}
      {/* ========================================================================= */}
      {showChart && (
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-purple-900" />
              <h3 className="font-bold text-slate-900 text-[15px] font-display">
                Grafik Arus Tabungan Bulanan
              </h3>
            </div>
            <button
              onClick={() => setShowChart(false)}
              className="text-[12px] text-slate-400 hover:text-slate-600 font-medium cursor-pointer"
            >
              Tutup
            </button>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="monthLabel" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis
                  tickFormatter={(val) => `${val / 1000000}Jt`}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                <Tooltip
                  formatter={(val: any) => formatRupiah(Number(val))}
                  labelStyle={{ fontWeight: '600' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Bar dataKey="setor" name="Setoran (+)" fill="#047857" radius={[4, 4, 0, 0]} />
                <Bar dataKey="tarik" name="Penarikan (-)" fill="#be123c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. RECENT TRANSACTIONS TICKER (Mutasi Terakhir) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-purple-900" />
            <h3 className="font-bold text-slate-900 text-[15px] font-display">
              Mutasi Setoran Terkini
            </h3>
          </div>
          <button
            onClick={() => onNavigateTab('transaksi')}
            className="text-[12px] text-purple-900 hover:text-purple-950 font-semibold flex items-center gap-0.5 cursor-pointer"
          >
            <span>Lihat Semua</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {recentTransactions.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-900 border border-purple-100 flex items-center justify-center mx-auto">
                <History className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-slate-700">Belum Ada Transaksi Tercatat</p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                Data akan otomatis terisi saat setoran dicatat atau disinkronkan dari Google Spreadsheet.
              </p>
              <button
                type="button"
                onClick={() => onOpenNewTransaction()}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-900 hover:bg-purple-800 text-white rounded-lg text-xs font-bold transition shadow-2xs"
              >
                <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Catat Setoran Pertama</span>
              </button>
            </div>
          ) : (
            recentTransactions.map((tx) => (
              <div
                key={tx.id_setoran}
                onClick={() => onOpenReceipt(tx)}
                className="py-2.5 flex items-center justify-between hover:bg-slate-50 rounded-xl px-2 transition cursor-pointer"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                      tx.jenis === 'setor'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {tx.jenis === 'setor' ? '+' : '-'}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 text-[13px] font-display truncate">
                      {tx.nama_anggota || tx.id_anggota}
                    </div>
                    <div className="text-[11.5px] text-slate-500 font-normal truncate max-w-[150px] sm:max-w-[200px] leading-snug">
                      {tx.keterangan_program || 'Tabungan Fleksibel'} • {formatDateShort(tx.tanggal)}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div
                    className={`font-bold text-[13px] sm:text-[14px] tabular-nums font-mono ${
                      tx.jenis === 'setor' ? 'text-emerald-800' : 'text-rose-800'
                    }`}
                  >
                    {tx.jenis === 'setor' ? '+' : '-'}{formatRupiah(tx.jumlah)}
                  </div>
                  <span className="text-[10.5px] text-slate-400 font-normal block">
                    Kuitansi &rarr;
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. TOP SAVERS (JAMAAH TERRAJIN MENABUNG) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-purple-900" />
            <h3 className="font-bold text-slate-900 text-[15px] font-display">
              Saldo Tabungan Tertinggi
            </h3>
          </div>
          <button
            onClick={() => onNavigateTab('anggota')}
            className="text-[12px] text-purple-900 hover:text-purple-950 font-semibold cursor-pointer"
          >
            Daftar Jamaah &rarr;
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {topSavers.map((saver, idx) => {
            const memberObj = anggotaList.find((m) => m.id_anggota === saver.id_anggota);
            return (
              <div
                key={saver.id_anggota}
                onClick={() => memberObj && onOpenMemberDetail(memberObj)}
                className="bg-slate-50 hover:bg-purple-50/50 p-3 rounded-xl border border-slate-200/70 cursor-pointer transition flex flex-col justify-between"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-900 font-bold text-[10.5px] flex items-center justify-center shrink-0">
                    {idx + 1}
                  </div>
                  <span className="font-medium text-slate-800 text-[12px] truncate">
                    {saver.nama.split(' ')[0]} {saver.nama.split(' ')[1] || ''}
                  </span>
                </div>
                <div className="mt-2 text-right">
                  <span className="text-[10.5px] text-slate-500 block font-normal">Saldo:</span>
                  <span className="text-[13px] font-bold text-emerald-800 tabular-nums font-mono">
                    {formatRupiah(saver.saldo_berjalan)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
