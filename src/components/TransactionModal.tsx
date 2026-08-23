import React, { useState, useEffect } from 'react';
import { Anggota, Bendahara, ProgramKegiatan, Setoran, TransactionType } from '../types';
import { getMemberBalance, getDistinctPrograms, generateSetoranId } from '../utils/storage';
import { formatRupiah } from '../utils/formatters';
import { 
  X, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  Calendar,
  User,
  Tag,
  FileText
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  anggotaList: Anggota[];
  setoranList: Setoran[];
  programList?: ProgramKegiatan[];
  activeBendahara: Bendahara;
  defaultMemberId?: string;
  defaultProgram?: string;
  onSave: (newTx: Setoran) => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  anggotaList,
  setoranList,
  programList,
  activeBendahara,
  defaultMemberId,
  defaultProgram,
  onSave,
}) => {
  const [memberId, setMemberId] = useState<string>(defaultMemberId || '');
  const [jenis, setJenis] = useState<TransactionType>('setor');
  const [jumlah, setJumlah] = useState<number | ''>('');
  const [keteranganProgram, setKeteranganProgram] = useState<string>(defaultProgram || '');
  const [tanggal, setTanggal] = useState<string>(new Date().toISOString().split('T')[0]);
  const [catatan, setCatatan] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const activeMembers = anggotaList.filter((m) => m.status === 'aktif');
  const programOptions = getDistinctPrograms(setoranList, programList);

  useEffect(() => {
    if (defaultMemberId) {
      setMemberId(defaultMemberId);
    } else if (activeMembers.length > 0 && !memberId) {
      setMemberId(activeMembers[0].id_anggota);
    }
  }, [defaultMemberId, activeMembers, memberId]);

  useEffect(() => {
    if (defaultProgram) {
      setKeteranganProgram(defaultProgram);
    }
  }, [defaultProgram]);

  if (!isOpen) return null;

  const selectedMember = anggotaList.find((m) => m.id_anggota === memberId);
  const currentBalance = selectedMember ? getMemberBalance(selectedMember.id_anggota, setoranList) : 0;
  const numJumlah = typeof jumlah === 'number' ? jumlah : 0;

  // Calculate new balance
  let simulatedBalance = currentBalance;
  if (jenis === 'setor') {
    simulatedBalance = currentBalance + numJumlah;
  } else if (jenis === 'tarik' || jenis === 'refund') {
    simulatedBalance = currentBalance - numJumlah;
  }

  // Quick preset nominals mulai Rp 5.000, Rp 10.000 dan kelipatannya sampai Rp 100.000
  const presets = [
    5000, 
    10000, 
    20000, 
    30000, 
    40000, 
    50000, 
    60000, 
    70000, 
    80000, 
    90000, 
    100000
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!memberId) {
      setErrorMsg('Silakan pilih anggota terlebih dahulu.');
      return;
    }

    if (!numJumlah || numJumlah <= 0) {
      setErrorMsg('Jumlah nominal harus lebih dari Rp 0.');
      return;
    }

    if ((jenis === 'tarik' || jenis === 'refund') && numJumlah > currentBalance) {
      setErrorMsg(`Penarikan gagal: Saldo anggota saat ini (${formatRupiah(currentBalance)}) tidak mencukupi.`);
      return;
    }

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newTransaction: Setoran = {
      id_setoran: generateSetoranId(),
      id_anggota: memberId,
      nama_anggota: selectedMember?.nama || memberId,
      tanggal: tanggal || new Date().toISOString().split('T')[0],
      waktu: currentTime,
      jenis: jenis,
      jumlah: numJumlah,
      saldo_setelah: simulatedBalance,
      keterangan_program: keteranganProgram.trim() || 'Tabungan Fleksibel / Umum',
      dicatat_oleh: activeBendahara.nama,
      catatan: catatan.trim() || undefined,
    };

    // Confetti effect for deposit
    if (jenis === 'setor') {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch (err) {
        // ignore in non-browser
      }
    }

    onSave(newTransaction);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-purple-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-800 text-purple-100 flex items-center justify-center font-bold border border-purple-700">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg font-display">Catat Transaksi Tabungan</h3>
              <p className="text-[12px] text-purple-200 font-normal">
                Dicatat oleh: <span className="font-semibold text-white">{activeBendahara.nama}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-purple-800 text-purple-200 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Error message */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-[12px] text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Jenis Transaksi Switcher */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-[0.5px] mb-1.5">
              Jenis Transaksi
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setJenis('setor')}
                className={`py-2.5 px-3 rounded-xl border flex items-center justify-center space-x-2 text-xs sm:text-sm font-semibold transition cursor-pointer ${
                  jenis === 'setor'
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs ring-2 ring-emerald-400/50'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <ArrowDownCircle className="w-4 h-4 text-emerald-300" />
                <span>Setor Tabungan (+)</span>
              </button>

              <button
                type="button"
                onClick={() => setJenis('tarik')}
                className={`py-2.5 px-3 rounded-xl border flex items-center justify-center space-x-2 text-xs sm:text-sm font-semibold transition cursor-pointer ${
                  jenis === 'tarik'
                    ? 'bg-rose-700 text-white border-rose-700 shadow-xs ring-2 ring-rose-400/50'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <ArrowUpCircle className="w-4 h-4 text-rose-300" />
                <span>Tarik / Pakai (-)</span>
              </button>
            </div>
          </div>

          {/* Pilih Anggota */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-[0.5px] mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>Nama Anggota / Jamaah</span>
            </label>
            <select
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
              required
            >
              <option value="" disabled>-- Pilih Nama Anggota --</option>
              {anggotaList.map((m) => (
                <option key={m.id_anggota} value={m.id_anggota}>
                  {m.nama} ({m.id_anggota}) - {m.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                </option>
              ))}
            </select>

            {/* Member balance indicator box */}
            {selectedMember && (
              <div className="mt-2 p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-emerald-800 font-medium block">
                    Saldo Tabungan Saat Ini:
                  </span>
                  <span className="text-sm font-bold text-emerald-950 tabular-nums font-mono">
                    {formatRupiah(currentBalance)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10.5px] text-slate-500 block font-normal">No. HP</span>
                  <span className="text-xs font-medium text-slate-700">{selectedMember.no_hp || '-'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Nominal Input */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-[0.5px] mb-1.5">
              Jumlah Nominal (Rp)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 font-bold text-sm">
                Rp
              </span>
              <input
                type="number"
                min="1000"
                step="1000"
                value={jumlah === '' ? '' : jumlah}
                onChange={(e) => setJumlah(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Contoh: 100000"
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-hidden tabular-nums font-mono"
                required
              />
            </div>

            {/* Preset buttons */}
            <div className="mt-2 space-y-1.5">
              <div className="flex items-center justify-between text-[10.5px] text-slate-500">
                <span>Pilihan Cepat Nominal:</span>
                {typeof jumlah === 'number' && jumlah > 0 && (
                  <button
                    type="button"
                    onClick={() => setJumlah('')}
                    className="text-purple-800 hover:underline font-semibold cursor-pointer"
                  >
                    Reset Input
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {presets.map((val) => {
                  const isSelected = jumlah === val;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setJumlah(val)}
                      className={`px-2.5 py-1.5 text-xs rounded-lg border transition font-semibold cursor-pointer tabular-nums font-mono shadow-2xs ${
                        isSelected
                          ? 'bg-purple-900 text-white border-purple-900 ring-2 ring-purple-400/40 shadow-xs'
                          : 'bg-slate-50 hover:bg-purple-50 text-slate-700 hover:text-purple-900 border-slate-200'
                      }`}
                    >
                      +{formatRupiah(val).replace(',00', '')}
                    </button>
                  );
                })}
                {jenis === 'tarik' && currentBalance > 0 && (
                  <button
                    type="button"
                    onClick={() => setJumlah(currentBalance)}
                    className="px-2.5 py-1.5 text-xs bg-rose-50 hover:bg-rose-100 text-rose-900 rounded-lg border border-rose-200 transition font-semibold cursor-pointer tabular-nums font-mono"
                  >
                    Tarik Semua ({formatRupiah(currentBalance)})
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Keterangan Program */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-[0.5px] mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-500" />
              <span>Keterangan Program (Opsional)</span>
            </label>
            <input
              type="text"
              list="program-options-list"
              value={keteranganProgram}
              onChange={(e) => setKeteranganProgram(e.target.value)}
              placeholder="Contoh: Ziarah Wali Songo 2026, Wisata Religi, dll."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
            />
            <datalist id="program-options-list">
              {programOptions.map((opt, i) => (
                <option key={i} value={opt} />
              ))}
            </datalist>
            <p className="text-[11px] text-slate-500 mt-1 font-normal">
              *Tandai jika dana tabungan ini ditujukan atau digunakan untuk kegiatan tertentu.
            </p>
          </div>

          {/* Tanggal & Catatan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-[0.5px] mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Tanggal</span>
              </label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:outline-hidden font-normal"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-[0.5px] mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Catatan Tambahan</span>
              </label>
              <input
                type="text"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Misal: Titipan via Bu Nur"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:outline-hidden font-normal"
              />
            </div>
          </div>

          {/* Saldo Simulation Preview */}
          <div className="p-3.5 bg-slate-900 text-white rounded-xl flex items-center justify-between shadow-inner">
            <div>
              <span className="text-[11px] text-slate-400 block font-normal">
                Estimasi Saldo Setelah Transaksi:
              </span>
              <div className="flex items-center space-x-2">
                <span className={`text-[20px] sm:text-[22px] font-bold tabular-nums font-mono ${simulatedBalance < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {formatRupiah(simulatedBalance)}
                </span>
                {simulatedBalance < 0 && (
                  <span className="text-xs bg-rose-950 text-rose-300 px-2 py-0.5 rounded-full border border-rose-800 font-bold">
                    Saldo Minus!
                  </span>
                )}
              </div>
            </div>
            <div className="text-right text-[11px] text-slate-400 font-normal">
              Perubahan: <span className={`tabular-nums font-bold font-mono ${jenis === 'setor' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {jenis === 'setor' ? '+' : '-'}{formatRupiah(numJumlah)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs sm:text-sm font-semibold transition cursor-pointer"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={simulatedBalance < 0 || !numJumlah}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md flex items-center space-x-2 transition cursor-pointer ${
                simulatedBalance < 0 || !numJumlah
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-purple-900 hover:bg-purple-800 text-white active:scale-95'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan Transaksi</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
