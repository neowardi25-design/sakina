import React, { useState } from 'react';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
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
  Download,
  Image as ImageIcon,
  Loader2,
  FileDown
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
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
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

  // Helper to generate PDF Blob of the monthly report
  const generateReportPdfBlob = async (): Promise<{ blob: Blob; filename: string } | null> => {
    const reportElem = document.getElementById('printable-report');
    if (!reportElem) return null;

    const canvas = await html2canvas(reportElem, {
      scale: 2.5,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdfWidth = 190; // mm (fits standard A4 width with margins)
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [pdfWidth + 20, pdfHeight + 20],
    });

    pdf.addImage(imgData, 'JPEG', 10, 10, pdfWidth, pdfHeight);
    const blob = pdf.output('blob');
    const monthName = (monthsMap.get(selectedMonth) || selectedMonth).replace(/\s+/g, '_');
    const filename = `Laporan_Pembukuan_${config.nama_majlis.replace(/\s+/g, '_')}_${monthName}.pdf`;

    return { blob, filename };
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const result = await generateReportPdfBlob();
      if (!result) throw new Error('Elemen laporan tidak ditemukan');

      const url = URL.createObjectURL(result.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;
      link.click();
      URL.revokeObjectURL(url);
      showToast('✓ File PDF Laporan berhasil diunduh!');
    } catch (err) {
      console.error('Gagal mengunduh PDF laporan:', err);
      showToast('⚠️ Gagal membuat PDF laporan.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadImage = async () => {
    const reportElem = document.getElementById('printable-report');
    if (!reportElem) return;

    setIsGeneratingImage(true);
    try {
      const canvas = await html2canvas(reportElem, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const monthName = (monthsMap.get(selectedMonth) || selectedMonth).replace(/\s+/g, '_');
      const filename = `Laporan_Pembukuan_${config.nama_majlis.replace(/\s+/g, '_')}_${monthName}.png`;

      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = filename;
      link.click();
      showToast('✓ Gambar laporan berhasil diunduh (PNG)!');
    } catch (err) {
      console.error('Gagal membuat gambar laporan:', err);
      showToast('⚠️ Gagal membuat gambar laporan.');
    } finally {
      setIsGeneratingImage(false);
    }
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

    setIsGeneratingPdf(true);
    try {
      const result = await generateReportPdfBlob();

      // Try Web Share with PDF file if supported
      if (result && typeof navigator !== 'undefined' && navigator.share && navigator.canShare) {
        const pdfFile = new File([result.blob], result.filename, { type: 'application/pdf' });
        
        if (navigator.canShare({ files: [pdfFile] })) {
          try {
            await navigator.share({
              title: `Laporan Pembukuan - ${config.nama_majlis}`,
              text: text,
              files: [pdfFile],
            });
            showToast('✓ Berhasil membagikan PDF ke WhatsApp!');
            setIsGeneratingPdf(false);
            return;
          } catch (shareErr: any) {
            if (shareErr.name === 'AbortError') {
              setIsGeneratingPdf(false);
              return;
            }
          }
        }
      }

      // Fallback: Copy text to clipboard and open WhatsApp
      await navigator.clipboard.writeText(text);
      setCopiedWA(true);
      showToast('✓ Teks laporan tersalin! Membuka WhatsApp...');
      setTimeout(() => setCopiedWA(false), 2500);

      // Auto-trigger PDF download for easy attachment on desktop
      if (result) {
        const url = URL.createObjectURL(result.blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = result.filename;
        link.click();
        URL.revokeObjectURL(url);
      }

      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    } catch (err) {
      console.error('Error share PDF laporan:', err);
      navigator.clipboard.writeText(text).then(() => {
        setCopiedWA(true);
        setTimeout(() => setCopiedWA(false), 2500);
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
      });
    } finally {
      setIsGeneratingPdf(false);
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

        {/* Action Buttons: Cetak, PDF, Gambar (PNG), Share WA (PDF) */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="flex-1 min-w-[80px] px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition border border-slate-200/90 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            title="Cetak Laporan Fisik"
          >
            <Printer className="w-3.5 h-3.5 text-purple-900" />
            <span>Cetak</span>
          </button>

          {/* Download PDF Button */}
          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="flex-1 min-w-[90px] px-2.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-950 text-xs font-semibold transition border border-purple-200/90 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
            title="Download Laporan dalam format PDF"
          >
            {isGeneratingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-900" />
            ) : (
              <FileDown className="w-3.5 h-3.5 text-purple-900" />
            )}
            <span>PDF</span>
          </button>

          {/* Download Image Button */}
          <button
            onClick={handleDownloadImage}
            disabled={isGeneratingImage}
            className="flex-1 min-w-[90px] px-2.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-950 text-xs font-semibold transition border border-purple-200/90 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
            title="Download Laporan dalam format Gambar PNG"
          >
            {isGeneratingImage ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-900" />
            ) : (
              <ImageIcon className="w-3.5 h-3.5 text-purple-900" />
            )}
            <span>PNG</span>
          </button>

          {/* Share WhatsApp Button */}
          <button
            onClick={handleShareWA}
            disabled={isGeneratingPdf}
            className={`flex-1 min-w-[120px] px-3 py-2 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition border cursor-pointer shadow-xs disabled:opacity-50 ${
              copiedWA
                ? 'bg-emerald-700 text-white border-emerald-700'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-2xs'
            }`}
            title="Kirim File PDF Laporan Langsung ke WhatsApp"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                <span>Menyiapkan...</span>
              </>
            ) : copiedWA ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                <span>Tersalin!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-white" />
                <span>Share WA (PDF)</span>
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
