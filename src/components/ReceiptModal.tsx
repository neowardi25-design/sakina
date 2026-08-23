import React, { useState } from 'react';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import { MajlisTaklimConfig, Setoran } from '../types';
import { formatDateIndo, formatRupiah, generateWhatsAppMessage } from '../utils/formatters';
import { APP_LOGO, APP_NAME, APP_SUBTITLE } from '../assets/logo';
import { Printer, Share2, Check, X, ShieldCheck, HeartHandshake, Image as ImageIcon, Loader2, FileText, Download } from 'lucide-react';

interface ReceiptModalProps {
  transaction: Setoran | null;
  config: MajlisTaklimConfig;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ transaction, config, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [statusToast, setStatusToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setStatusToast(msg);
    setTimeout(() => setStatusToast(null), 3000);
  };

  if (!transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  // Helper to generate jsPDF instance from the receipt DOM element
  const generatePdfBlob = async (): Promise<{ blob: Blob; filename: string } | null> => {
    const receiptElem = document.getElementById('printable-receipt');
    if (!receiptElem) return null;

    const canvas = await html2canvas(receiptElem, {
      scale: 2.5,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdfWidth = 90; // mm
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [pdfWidth + 8, pdfHeight + 8],
    });

    pdf.addImage(imgData, 'JPEG', 4, 4, pdfWidth, pdfHeight);
    const blob = pdf.output('blob');
    const safeName = (transaction.nama_anggota || 'jamaah').replace(/\s+/g, '_');
    const filename = `Kwitansi_${transaction.id_setoran}_${safeName}.pdf`;

    return { blob, filename };
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const result = await generatePdfBlob();
      if (!result) throw new Error('Elemen kwitansi tidak ditemukan');

      const url = URL.createObjectURL(result.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;
      link.click();
      URL.revokeObjectURL(url);
      showToast('✓ File PDF Kwitansi berhasil diunduh!');
    } catch (err) {
      console.error('Gagal mengunduh PDF:', err);
      showToast('⚠️ Gagal membuat PDF kwitansi.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadImage = async () => {
    const receiptElem = document.getElementById('printable-receipt');
    if (!receiptElem) return;

    setIsGeneratingImage(true);
    try {
      const canvas = await html2canvas(receiptElem, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const filename = `Kwitansi_${transaction.id_setoran}_${(transaction.nama_anggota || 'jamaah').replace(/\s+/g, '_')}.png`;
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = filename;
      link.click();
      showToast('✓ Gambar PNG berhasil diunduh!');
    } catch (err) {
      console.error('Gagal membuat gambar kwitansi:', err);
      showToast('⚠️ Gagal membuat gambar kwitansi.');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleShareWA = async () => {
    const text = generateWhatsAppMessage({
      namaMajlis: `${APP_NAME} - ${config.nama_majlis}`,
      namaAnggota: transaction.nama_anggota || transaction.id_anggota,
      idAnggota: transaction.id_anggota,
      jenisTransaksi: transaction.jenis,
      jumlah: transaction.jumlah,
      saldoSetelah: transaction.saldo_setelah,
      tanggal: transaction.tanggal,
      program: transaction.keterangan_program,
      bendahara: transaction.dicatat_oleh,
      idTransaksi: transaction.id_setoran,
    });

    setIsGeneratingPdf(true);
    try {
      const result = await generatePdfBlob();

      // Check if navigator.share with files is supported (mobile & modern browsers)
      if (result && typeof navigator !== 'undefined' && navigator.share && navigator.canShare) {
        const pdfFile = new File([result.blob], result.filename, { type: 'application/pdf' });
        
        if (navigator.canShare({ files: [pdfFile] })) {
          try {
            await navigator.share({
              title: `Kwitansi SAKINA - ${transaction.id_setoran}`,
              text: text,
              files: [pdfFile],
            });
            showToast('✓ Berhasil membagikan PDF ke WhatsApp!');
            setIsGeneratingPdf(false);
            return;
          } catch (shareErr: any) {
            if (shareErr.name === 'AbortError') {
              // User cancelled share dialog
              setIsGeneratingPdf(false);
              return;
            }
          }
        }
      }

      // Fallback: Copy text to clipboard and open WhatsApp
      await navigator.clipboard.writeText(text);
      setCopied(true);
      showToast('✓ Teks tersalin! Membuka WhatsApp...');
      setTimeout(() => setCopied(false), 2500);

      // Auto-trigger PDF download on fallback desktop so user has the PDF ready to attach
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
      console.error('Error saat share PDF:', err);
      // Last-resort fallback
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const isSetor = transaction.jenis === 'setor';
  const isTarik = transaction.jenis === 'tarik';

  // Sanitize numeric artifacts if data came from misaligned columns
  const isNumericString = (val?: any) => {
    if (val === undefined || val === null) return true;
    const str = String(val).trim();
    return str.length > 0 && /^\d+$/.test(str);
  };

  const cleanProgram = !transaction.keterangan_program || isNumericString(transaction.keterangan_program)
    ? 'Tabungan Fleksibel / Umum'
    : transaction.keterangan_program;

  const cleanDicatatOleh = !transaction.dicatat_oleh || isNumericString(transaction.dicatat_oleh)
    ? (config.nama_bendahara || 'Bendahara Majlis')
    : transaction.dicatat_oleh;

  const cleanNamaPenyetor = transaction.nama_anggota || transaction.id_anggota || 'Jamaah';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-purple-950 text-white px-3.5 py-3 sm:px-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-xs sm:text-sm font-display">Bukti Transaksi SAKINA</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-purple-900 text-purple-200 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Area - Compact & Polished */}
        <div id="printable-receipt" className="p-3 sm:p-4 bg-slate-50 border-b border-dashed border-slate-300">
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/90 shadow-2xs text-slate-800 space-y-2.5">
            {/* Header Kuitansi with Logo */}
            <div className="text-center pb-2.5 border-b border-slate-100">
              <div className="flex items-center justify-center gap-2 mb-1">
                <img 
                  src={APP_LOGO} 
                  alt="Logo SAKINA" 
                  className="w-8 h-8 object-contain rounded-lg"
                  referrerPolicy="no-referrer"
                />
                <div className="text-left">
                  <div className="text-sm sm:text-base font-bold tracking-tight text-purple-950 font-display leading-tight">
                    {config.app_name || APP_NAME}
                  </div>
                  <div className="text-[9.5px] text-slate-500 font-medium leading-tight">
                    {config.app_subtitle || APP_SUBTITLE}
                  </div>
                </div>
              </div>

              <h2 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wide font-display mt-0.5">
                {config.nama_majlis}
              </h2>
              <p className="text-[10.5px] text-slate-500 font-normal leading-snug">{config.alamat}</p>
              <p className="text-[10px] text-slate-400 font-normal">Kontak: {config.no_kontak}</p>
            </div>

            {/* Title & No Transaksi */}
            <div className="py-1.5 text-center border-b border-dashed border-slate-100">
              <span
                className={`inline-block px-2.5 py-0.5 rounded-md text-[10.5px] font-bold uppercase tracking-wider ${
                  isSetor
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : isTarik
                    ? 'bg-amber-50 text-amber-900 border border-amber-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {isSetor ? 'BUKTI SETORAN' : isTarik ? 'BUKTI PENARIKAN' : 'BUKTI REFUND'}
              </span>
              <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                No: <span className="font-semibold text-slate-700">{transaction.id_setoran}</span>
              </div>
            </div>

            {/* Transaction Data */}
            <div className="space-y-1.5 text-[11.5px]">
              <div className="flex justify-between py-0.5 border-b border-slate-100/80">
                <span className="text-slate-500 font-normal">Tanggal:</span>
                <span className="font-medium text-slate-800">
                  {formatDateIndo(transaction.tanggal, false)} {transaction.waktu ? `(${transaction.waktu} WIB)` : ''}
                </span>
              </div>

              <div className="flex justify-between py-0.5 border-b border-slate-100/80">
                <span className="text-slate-500 font-normal">Nama Jamaah:</span>
                <span className="font-bold text-slate-900 text-right font-display">
                  {cleanNamaPenyetor}
                </span>
              </div>

              <div className="flex justify-between py-0.5 border-b border-slate-100/80">
                <span className="text-slate-500 font-normal">ID Anggota:</span>
                <span className="font-mono font-medium text-slate-700">{transaction.id_anggota}</span>
              </div>

              <div className="flex justify-between py-0.5 border-b border-slate-100/80">
                <span className="text-slate-500 font-normal">Keterangan Program:</span>
                <span className="font-semibold text-emerald-800 text-right max-w-[200px] truncate">
                  {cleanProgram}
                </span>
              </div>

              {transaction.catatan && (
                <div className="flex justify-between py-0.5 border-b border-slate-100/80">
                  <span className="text-slate-500 font-normal">Catatan:</span>
                  <span className="italic text-slate-600 text-right max-w-[200px] font-normal truncate">
                    {transaction.catatan}
                  </span>
                </div>
              )}

              {/* Amount Box */}
              <div className="my-2 p-2.5 bg-emerald-50/90 rounded-lg border border-emerald-200 text-center">
                <div className="text-[10.5px] text-emerald-800 font-medium">
                  {isSetor ? 'Jumlah Setoran Diterima:' : 'Jumlah Penarikan/Penggunaan:'}
                </div>
                <div className="text-lg sm:text-xl font-bold text-emerald-950 mt-0.5 tabular-nums font-display">
                  {formatRupiah(transaction.jumlah)}
                </div>
              </div>

              {/* Saldo Akhir */}
              <div className="p-2 bg-slate-100/90 rounded-lg flex justify-between items-center text-[11px]">
                <span className="text-slate-600 font-medium">Sisa Saldo Tabungan:</span>
                <span className="text-xs sm:text-sm font-bold text-slate-900 tabular-nums font-display">
                  {formatRupiah(transaction.saldo_setelah)}
                </span>
              </div>
            </div>

            {/* Signature Area without horizontal line over text */}
            <div className="pt-2.5 mt-1 border-t border-dashed border-slate-200 grid grid-cols-2 gap-2 text-center">
              <div className="px-1">
                <div className="text-[10px] text-slate-400 font-medium">Penyetor / Jamaah</div>
                <div className="mt-1 text-[11.5px] font-bold text-slate-800 font-display">
                  ( {cleanNamaPenyetor} )
                </div>
              </div>
              <div className="px-1">
                <div className="text-[10px] text-slate-400 font-medium">Dicatat Oleh</div>
                <div className="mt-1 text-[11.5px] font-bold text-slate-800 font-display">
                  ( {cleanDicatatOleh} )
                </div>
              </div>
            </div>

            <div className="text-center pt-1 text-[9.5px] text-slate-400 italic">
              "Tabungan jamaah amanah, berkah untuk semua program kegiatan bersama."
            </div>
          </div>
        </div>

        {/* Status Toast */}
        {statusToast && (
          <div className="mx-3.5 mt-2.5 p-2 bg-purple-900 text-white text-center text-xs font-medium rounded-xl animate-in fade-in">
            {statusToast}
          </div>
        )}

        {/* Modal Actions */}
        <div className="p-3.5 bg-white flex flex-wrap items-center gap-2 justify-end">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 min-w-[90px] flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 px-2.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shadow-2xs"
            title="Cetak Resi Fisik"
          >
            <Printer className="w-3.5 h-3.5 text-purple-900" />
            <span>Cetak</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="flex-1 min-w-[100px] flex items-center justify-center gap-1.5 bg-purple-50 hover:bg-purple-100 text-purple-950 border border-purple-200 px-2.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shadow-2xs disabled:opacity-50"
            title="Unduh File PDF Kwitansi"
          >
            {isGeneratingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-900" />
            ) : (
              <FileText className="w-3.5 h-3.5 text-purple-900" />
            )}
            <span>PDF</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadImage}
            disabled={isGeneratingImage}
            className="flex-1 min-w-[100px] flex items-center justify-center gap-1.5 bg-purple-50 hover:bg-purple-100 text-purple-950 border border-purple-200 px-2.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shadow-2xs disabled:opacity-50"
            title="Simpan Bukti Transaksi dalam bentuk Gambar PNG"
          >
            {isGeneratingImage ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-900" />
            ) : (
              <ImageIcon className="w-3.5 h-3.5 text-purple-900" />
            )}
            <span>PNG</span>
          </button>

          <button
            type="button"
            onClick={handleShareWA}
            disabled={isGeneratingPdf}
            className="flex-1 min-w-[120px] flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shadow-xs disabled:opacity-50"
            title="Bagikan Kwitansi PDF Langsung ke WhatsApp"
          >
            {isGeneratingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
            ) : copied ? (
              <Check className="w-3.5 h-3.5 text-white" />
            ) : (
              <Share2 className="w-3.5 h-3.5 text-white" />
            )}
            <span>{isGeneratingPdf ? 'Menyiapkan...' : copied ? 'Tersalin!' : 'Share WA (PDF)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
