import React, { useState } from 'react';
import html2canvas from 'html2canvas-pro';
import { Anggota, Bendahara, MajlisTaklimConfig, RekapAnggota, Setoran } from '../types';
import { formatDateIndo, formatDateShort, formatMonthYear, formatRupiah } from '../utils/formatters';
import { APP_LOGO, APP_NAME, APP_SUBTITLE } from '../assets/logo';
import {
  FileText,
  Calendar,
  Printer,
  Share2,
  CheckCircle2,
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  Users,
  Compass,
  Loader2
} from 'lucide-react';

interface MonthlyReportProps {
  setoranList: Setoran[];
  anggotaList: Anggota[];
  rekapList: RekapAnggota[];
  config: MajlisTaklimConfig;
  activeBendahara: Bendahara;
}

export const MonthlyReport: React.FC<MonthlyReportProps> = ({
  setoranList,
  anggotaList,
  rekapList,
  config,
  activeBendahara,
}) => {
  // Available months from setoran data
  const monthsMap = new Map<string, string>();
  setoranList.forEach((s) => {
    try {
      const d = new Date(s.tanggal);
      if (!isNaN(d.getTime())) {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = formatMonthYear(s.tanggal);
        monthsMap.set(key, label);
      }
    } catch {
      // ignore
    }
  });

  const availableMonths = Array.from(monthsMap.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  const defaultSelectedMonth = availableMonths.length > 0 ? availableMonths[0][0] : '2026-08';

  const [selectedMonth, setSelectedMonth] = useState<string>(defaultSelectedMonth);
  const [copiedWA, setCopiedWA] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusToast, setStatusToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setStatusToast(msg);
    setTimeout(() => setStatusToast(null), 3000);
  };

  // Filter transactions for this month
  const currentMonthTransactions = setoranList.filter((s) => s.tanggal.startsWith(selectedMonth));

  // Calculate prior balance (saldo awal bulan)
  const priorTransactions = setoranList.filter((s) => s.tanggal < `${selectedMonth}-01`);
  let saldoAwal = 0;
  priorTransactions.forEach((tx) => {
    if (tx.jenis === 'setor') saldoAwal += tx.jumlah;
    else saldoAwal -= tx.jumlah;
  });

  // Current month totals
  let pemasukanBulanIni = 0;
  let pengeluaranBulanIni = 0;
  currentMonthTransactions.forEach((tx) => {
    if (tx.jenis === 'setor') pemasukanBulanIni += tx.jumlah;
    else pengeluaranBulanIni += tx.jumlah;
  });

  const saldoAkhir = saldoAwal + pemasukanBulanIni - pengeluaranBulanIni;

  // Monthly program breakdown
  const programBreakdown = new Map<string, number>();
  currentMonthTransactions.forEach((tx) => {
    const prog = tx.keterangan_program?.trim() || 'Tabungan Fleksibel / Bebas';
    const curr = programBreakdown.get(prog) || 0;
    if (tx.jenis === 'setor') programBreakdown.set(prog, curr + tx.jumlah);
  });

  const handlePrint = () => {
    window.print();
  };

  // Helper to generate image blob of the report
  const generateReportImageBlob = async (): Promise<{ blob: Blob; filename: string } | null> => {
    const reportElem = document.getElementById('printable-report');
    if (!reportElem) return null;

    const canvas = await html2canvas(reportElem, {
      scale: 2.5,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          resolve(null);
          return;
        }
        const monthName = (monthsMap.get(selectedMonth) || selectedMonth).replace(/\s+/g, '_');
        const filename = `Laporan_Pembukuan_${config.nama_majlis.replace(/\s+/g, '_')}_${monthName}.png`;
        resolve({ blob, filename });
      }, 'image/png');
    });
  };

  const handleShareWA = async () => {
    const monthLabel = monthsMap.get(selectedMonth) || selectedMonth;
    const text = `*LAPORAN PEMBUKUAN ${APP_NAME.toUpperCase()}*
*${config.nama_majlis.toUpperCase()}*
*Periode: ${monthLabel}*
---------------------------------------
• *Saldo Awal Bulan* : ${formatRupiah(saldoAwal)}
• *Total Setoran Masuk (+)* : ${formatRupiah(pemasukanBulanIni)} (${currentMonthTransactions.filter((t) => t.jenis === 'setor').length}x)
• *Total Penarikan (-)*     : ${formatRupiah(pengeluaranBulanIni)} (${currentMonthTransactions.filter((t) => t.jenis !== 'setor').length}x)
---------------------------------------
*SISA SALDO AKHIR BULAN:*
*${formatRupiah(saldoAkhir)}*
---------------------------------------
*Rincian Alokasi Program Bulan Ini:*
${
  Array.from(programBreakdown.entries())
    .map(([prog, amt]) => `- ${prog}: ${formatRupiah(amt)}`)
    .join('\n') || '- Belum ada data setoran'
}
---------------------------------------
_Dibuat oleh: ${config.nama_bendahara || activeBendahara.nama} (${config.jabatan_bendahara || activeBendahara.peran || 'Bendahara'})_
_Mengetahui: ${config.nama_ketua || 'Ketua Majlis'} (${config.jabatan_ketua || 'Ketua Majlis'})_
_Tanggal Cetak: ${formatDateIndo(new Date().toISOString().split('T')[0])}_`;

    setIsProcessing(true);
    try {
      const result = await generateReportImageBlob();

      // Try Web Share with image file if supported
      if (result && typeof navigator !== 'undefined' && navigator.share && navigator.canShare) {
        const imageFile = new File([result.blob], result.filename, { type: 'image/png' });
        
        if (navigator.canShare({ files: [imageFile] })) {
          try {
            await navigator.share({
              title: `Laporan Pembukuan - ${config.nama_majlis}`,
              text: text,
              files: [imageFile],
            });
            showToast('✓ Berhasil membagikan bukti gambar laporan ke WhatsApp!');
            setIsProcessing(false);
            return;
          } catch (shareErr: any) {
            if (shareErr.name === 'AbortError') {
              setIsProcessing(false);
              return;
            }
            console.warn('Share error fallback:', shareErr);
          }
        }
      }

      // Fallback: Download image and copy text to clipboard for WhatsApp Web
      if (result) {
        const url = URL.createObjectURL(result.blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = result.filename;
        link.click();
        URL.revokeObjectURL(url);
      }

      await navigator.clipboard.writeText(text);
      setCopiedWA(true);
      showToast('✓ Gambar laporan diunduh & teks tersalin! Membuka WhatsApp...');
      setTimeout(() => setCopiedWA(false), 2500);

      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    } catch (err) {
      console.error('Error share gambar laporan:', err);
      navigator.clipboard.writeText(text).then(() => {
        setCopiedWA(true);
        setTimeout(() => setCopiedWA(false), 2500);
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4 pb-16 max-w-md md:max-w-2xl mx-auto">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & CONTROLS */}
      {/* ========================================================================= */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-[16px] sm:text-[18px] font-bold text-slate-900 font-display flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-900" />
              <span>Laporan Pembukuan</span>
            </h2>
            <p className="text-[11.5px] text-slate-500 font-normal mt-0.5">
              Laporan bulanan siap cetak/PDF, simpan gambar (PNG), & kirim ke WhatsApp
            </p>
          </div>

          {/* Month Selector */}
          <div className="relative sm:w-48">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-hidden appearance-none cursor-pointer"
            >
              {availableMonths.map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Action Buttons: Cetak & Share WA (Gambar) */}
        <div className="flex items-center gap-2.5 pt-2 border-t border-slate-100">
          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition border border-slate-200/90 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            title="Cetak Laporan Fisik"
          >
            <Printer className="w-4 h-4 text-purple-900" />
            <span>Cetak</span>
          </button>

          {/* Share WhatsApp Button */}
          <button
            onClick={handleShareWA}
            disabled={isProcessing}
            className="flex-1 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-xs disabled:opacity-50 bg-emerald-600 hover:bg-emerald-700 text-white"
            title="Kirim Bukti Gambar Laporan Langsung ke WhatsApp"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Menyiapkan Gambar...</span>
              </>
            ) : copiedWA ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Tersalin!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-white" />
                <span>Share WA (Gambar)</span>
              </>
            )}
          </button>
        </div>

        {/* Toast Feedback */}
        {statusToast && (
          <div className="p-2 bg-purple-900 text-white text-center text-xs font-medium rounded-xl animate-in fade-in">
            {statusToast}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. FINANCIAL STATEMENT SHEET (Clean Printable & Mobile card) */}
      {/* ========================================================================= */}
      <div id="printable-report" className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
        {/* Letterhead */}
        <div className="text-center border-b pb-3.5 border-slate-100">
          <div className="flex items-center justify-center gap-2.5 mb-1.5">
            <img 
              src={APP_LOGO} 
              alt="Logo SAKINA" 
              className="w-9 h-9 object-contain rounded-lg"
              referrerPolicy="no-referrer"
            />
            <div className="text-left">
              <div className="text-[16px] font-bold tracking-tight text-purple-950 font-display leading-tight">
                {config.app_name || APP_NAME}
              </div>
              <div className="text-[10px] text-slate-500 font-medium leading-tight">
                {config.app_subtitle || APP_SUBTITLE}
              </div>
            </div>
          </div>
          <h3 className="text-sm sm:text-[14.5px] font-bold text-slate-900 font-display tracking-tight uppercase">
            {config.nama_majlis}
          </h3>
          <p className="text-[11.5px] text-slate-500 font-normal mt-0.5">
            Laporan Tabungan Program Jamaah • Periode: <strong className="text-slate-800 font-semibold">{monthsMap.get(selectedMonth) || selectedMonth}</strong>
          </p>
        </div>

        {/* Financial Flow Cards */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Saldo Awal */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-[0.5px] block">
              Saldo Awal Bulan
            </span>
            <div className="text-xs sm:text-[13.5px] font-bold font-mono text-slate-800 mt-1 tabular-nums">
              {formatRupiah(saldoAwal)}
            </div>
          </div>

          {/* Sisa Saldo Akhir */}
          <div className="bg-purple-950 p-3 rounded-xl border border-purple-900 text-white">
            <span className="text-[10px] font-medium text-purple-200 uppercase tracking-[0.5px] block">
              Saldo Akhir Kas
            </span>
            <div className="text-xs sm:text-[13.5px] font-bold font-mono text-white mt-1 tabular-nums">
              {formatRupiah(saldoAkhir)}
            </div>
          </div>

          {/* Total Masuk */}
          <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200/80">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-emerald-800 uppercase tracking-[0.5px]">
                Total Masuk (+)
              </span>
              <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="text-xs sm:text-[13.5px] font-bold font-mono text-emerald-950 mt-1 tabular-nums">
              +{formatRupiah(pemasukanBulanIni)}
            </div>
            <span className="text-[10px] text-emerald-700 font-normal mt-0.5 block">
              {currentMonthTransactions.filter((t) => t.jenis === 'setor').length} transaksi
            </span>
          </div>

          {/* Total Keluar */}
          <div className="bg-rose-50 p-3 rounded-xl border border-rose-200/80">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-rose-800 uppercase tracking-[0.5px]">
                Total Keluar (-)
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <div className="text-xs sm:text-[13.5px] font-bold font-mono text-rose-950 mt-1 tabular-nums">
              -{formatRupiah(pengeluaranBulanIni)}
            </div>
            <span className="text-[10px] text-rose-700 font-normal mt-0.5 block">
              {currentMonthTransactions.filter((t) => t.jenis !== 'setor').length} transaksi
            </span>
          </div>
        </div>

        {/* Breakdown per Program */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-[0.5px] text-slate-800 mb-2 font-display">
            Rincian Alokasi Kegiatan Bulan Ini
          </h4>
          <div className="space-y-1.5">
            {Array.from(programBreakdown.entries()).map(([prog, amt], i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs font-normal"
              >
                <span className="font-medium text-slate-800">{prog}</span>
                <span className="font-mono font-bold text-emerald-900 tabular-nums">{formatRupiah(amt)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Signatures for Print */}
        <div className="pt-4 border-t border-slate-100 grid grid-cols-2 text-center text-xs">
          <div>
            <div className="text-slate-400 text-[10.5px] font-normal">Mengetahui,</div>
            <div className="font-bold text-slate-800 mt-1 font-display">
              {config.nama_ketua || 'H. Muhammad Syafi\'i'}
            </div>
            <div className="text-[10px] text-slate-500 font-normal">
              {config.jabatan_ketua || 'Ketua Majlis'}
            </div>
          </div>
          <div>
            <div className="text-slate-400 text-[10.5px] font-normal">Dibuat Oleh,</div>
            <div className="font-bold text-slate-800 mt-1 font-display">
              {config.nama_bendahara || activeBendahara.nama}
            </div>
            <div className="text-[10px] text-slate-500 font-normal">
              {config.jabatan_bendahara || activeBendahara.peran || 'Bendahara Utama'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
