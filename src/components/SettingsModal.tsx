import React, { useState } from 'react';
import { MajlisTaklimConfig, ProgramKegiatan } from '../types';
import { APP_LOGO, APP_NAME, APP_SUBTITLE } from '../assets/logo';
import { formatRupiah } from '../utils/formatters';
import { generateProgramId } from '../utils/storage';
import { pushConfigToGoogleSheets, APPS_SCRIPT_TEMPLATE } from '../utils/googleSheetsApi';
import {
  Settings,
  X,
  Building,
  CheckCircle2,
  FileSpreadsheet,
  Compass,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Target,
  FileText,
  AlertTriangle,
  RotateCcw,
  Download,
  Upload,
  ArrowLeft,
  UserCheck,
  Send,
  Copy,
  Check,
  Code,
  Loader2,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: MajlisTaklimConfig;
  onSaveConfig: (cfg: MajlisTaklimConfig) => void;
  programList: ProgramKegiatan[];
  onAddProgram: (program: ProgramKegiatan) => void;
  onUpdateProgram: (oldName: string, updatedProgram: ProgramKegiatan, updateTransactions?: boolean) => void;
  onDeleteProgram: (id: string, programName: string) => void;
  onResetData?: () => void;
  fullData?: any;
  onImportBackup?: (importedData: any) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  programList,
  onAddProgram,
  onUpdateProgram,
  onDeleteProgram,
  onResetData,
  fullData,
  onImportBackup,
}) => {
  // Navigation Tabs: 'profil' | 'program' | 'spreadsheet'
  const [activeSubTab, setActiveSubTab] = useState<'profil' | 'program' | 'spreadsheet'>('profil');
  const [formData, setFormData] = useState<MajlisTaklimConfig>({ ...config });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('Pengaturan berhasil disimpan!');

  // Push Config to Google Sheets State
  const [isPushingConfig, setIsPushingConfig] = useState(false);
  const [pushConfigStatus, setPushConfigStatus] = useState<{ message: string; type: 'success' | 'error' | 'loading' } | null>(null);
  const [showScriptCode, setShowScriptCode] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  // Program Management State
  const [isEditingProgram, setIsEditingProgram] = useState(false);
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);
  const [editingOldName, setEditingOldName] = useState<string>('');
  const [programForm, setProgramForm] = useState<Partial<ProgramKegiatan>>({
    nama_program: '',
    target_dana: undefined,
    tanggal_pelaksanaan: '',
    deskripsi: '',
    status: 'aktif',
  });
  const [updateTxWhenRename, setUpdateTxWhenRename] = useState(true);
  const [programDeleteConfirm, setProgramDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [programError, setProgramError] = useState('');

  if (!isOpen) return null;

  const showNotification = (msg: string) => {
    setSuccessMessage(msg);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 3500);
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(formData);
    showNotification('Profil & identitas majlis berhasil disimpan!');

    if (formData.apps_script_url && formData.apps_script_url.trim().startsWith('http')) {
      setIsPushingConfig(true);
      setPushConfigStatus({ message: 'Menyimpan & menimpa data di sheet Config Spreadsheet...', type: 'loading' });
      try {
        const res = await pushConfigToGoogleSheets(formData, formData.apps_script_url);
        if (res.success) {
          setPushConfigStatus({ message: '✓ Data profil berhasil disimpan ke Sheet "Config" Google Spreadsheet!', type: 'success' });
          showNotification('✓ Profil tersimpan & sheet Config di Google Sheets berhasil ditimpa!');
        } else {
          setPushConfigStatus({ message: `⚠️ ${res.message}`, type: 'error' });
        }
      } catch (err: any) {
        setPushConfigStatus({ message: `⚠️ Gagal sinkron ke Sheets: ${err?.message || 'Koneksi gagal'}`, type: 'error' });
      } finally {
        setIsPushingConfig(false);
      }
    }
  };

  const handlePushConfigNow = async () => {
    if (!formData.apps_script_url || !formData.apps_script_url.trim().startsWith('http')) {
      alert('Silakan masukkan URL Web App Google Apps Script terlebih dahulu.');
      return;
    }
    setIsPushingConfig(true);
    setPushConfigStatus({ message: 'Mengirim dan menimpa sheet Config di Google Spreadsheet...', type: 'loading' });
    try {
      onSaveConfig(formData);
      const res = await pushConfigToGoogleSheets(formData, formData.apps_script_url);
      if (res.success) {
        setPushConfigStatus({ message: '✓ Sukses! Data profil & pengurus berhasil menimpa sheet "Config" di Spreadsheet.', type: 'success' });
        showNotification('✓ Sheet Config di Spreadsheet berhasil ditimpa dengan profil baru!');
      } else {
        setPushConfigStatus({ message: `⚠️ ${res.message}`, type: 'error' });
      }
    } catch (err: any) {
      setPushConfigStatus({ message: `⚠️ Gagal: ${err?.message || 'Terjadi kesalahan koneksi'}`, type: 'error' });
    } finally {
      setIsPushingConfig(false);
    }
  };

  const handleCopyScriptCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_TEMPLATE).then(() => {
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2500);
      showNotification('Kode Apps Script berhasil disalin ke clipboard!');
    });
  };

  // Program Handlers
  const handleOpenAddProgram = () => {
    setIsEditingProgram(true);
    setEditingProgramId(null);
    setEditingOldName('');
    setProgramForm({
      nama_program: '',
      target_dana: undefined,
      tanggal_pelaksanaan: '',
      deskripsi: '',
      status: 'aktif',
    });
    setProgramError('');
  };

  const handleOpenEditProgram = (prog: ProgramKegiatan) => {
    setIsEditingProgram(true);
    setEditingProgramId(prog.id_program);
    setEditingOldName(prog.nama_program);
    setProgramForm({
      nama_program: prog.nama_program,
      target_dana: prog.target_dana,
      tanggal_pelaksanaan: prog.tanggal_pelaksanaan || '',
      deskripsi: prog.deskripsi || '',
      status: prog.status || 'aktif',
    });
    setProgramError('');
  };

  const handleSaveProgramForm = (e: React.FormEvent) => {
    e.preventDefault();
    setProgramError('');

    if (!programForm.nama_program || !programForm.nama_program.trim()) {
      setProgramError('Nama kegiatan/program wajib diisi.');
      return;
    }

    const trimmedName = programForm.nama_program.trim();

    // Check duplicate name
    const isDuplicate = programList.some(
      (p) => p.nama_program.toLowerCase() === trimmedName.toLowerCase() && p.id_program !== editingProgramId
    );
    if (isDuplicate) {
      setProgramError(`Program dengan nama "${trimmedName}" sudah ada.`);
      return;
    }

    if (editingProgramId) {
      // Update
      const updated: ProgramKegiatan = {
        id_program: editingProgramId,
        nama_program: trimmedName,
        target_dana: programForm.target_dana ? Number(programForm.target_dana) : undefined,
        tanggal_pelaksanaan: programForm.tanggal_pelaksanaan || undefined,
        deskripsi: programForm.deskripsi?.trim() || undefined,
        status: (programForm.status as 'aktif' | 'selesai' | 'draft') || 'aktif',
      };
      onUpdateProgram(editingOldName, updated, updateTxWhenRename);
      showNotification(`Program "${trimmedName}" berhasil diperbarui.`);
    } else {
      // Add
      const newProgram: ProgramKegiatan = {
        id_program: generateProgramId(programList),
        nama_program: trimmedName,
        target_dana: programForm.target_dana ? Number(programForm.target_dana) : undefined,
        tanggal_pelaksanaan: programForm.tanggal_pelaksanaan || undefined,
        deskripsi: programForm.deskripsi?.trim() || undefined,
        status: (programForm.status as 'aktif' | 'selesai' | 'draft') || 'aktif',
      };
      onAddProgram(newProgram);
      showNotification(`Program "${trimmedName}" berhasil ditambahkan.`);
    }

    setIsEditingProgram(false);
  };

  const handleConfirmDeleteProgram = () => {
    if (programDeleteConfirm) {
      onDeleteProgram(programDeleteConfirm.id, programDeleteConfirm.name);
      showNotification(`Program "${programDeleteConfirm.name}" telah dihapus.`);
      setProgramDeleteConfirm(null);
    }
  };

  // Backup handlers
  const handleExportJSON = () => {
    if (!fullData) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(fullData, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadAnchor.setAttribute('download', `BACKUP_SAKINA_MAJLIS_${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showNotification('File backup JSON berhasil diunduh.');
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && onImportBackup) {
          onImportBackup(parsed);
          showNotification('Data backup berhasil dipulihkan!');
        }
      } catch (err) {
        alert('Gagal membaca file backup JSON: format tidak valid.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-purple-900 text-white p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-purple-200" />
            <h3 className="font-bold text-base font-display">Pengaturan & Kelola Majlis</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-purple-800 text-purple-200 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-Tab Navigation Bar - 3 Equal Segmented Cards */}
        <div className="p-2 bg-slate-100/90 border-b border-slate-200 shrink-0">
          <div className="grid grid-cols-3 gap-1 sm:gap-2">
            {/* 1. Profil */}
            <button
              type="button"
              onClick={() => {
                setActiveSubTab('profil');
                setIsEditingProgram(false);
              }}
              className={`flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-1 sm:px-2.5 text-[11.5px] sm:text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeSubTab === 'profil'
                  ? 'bg-purple-900 text-white shadow-sm ring-1 ring-purple-950'
                  : 'bg-white text-slate-700 hover:text-purple-900 hover:bg-slate-50 border border-slate-200/80 shadow-2xs'
              }`}
            >
              <Building className={`w-3.5 h-3.5 shrink-0 ${activeSubTab === 'profil' ? 'text-purple-200' : 'text-purple-900'}`} />
              <span>Profil</span>
            </button>

            {/* 2. Program */}
            <button
              type="button"
              onClick={() => {
                setActiveSubTab('program');
                setIsEditingProgram(false);
              }}
              className={`flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-1 sm:px-2.5 text-[11.5px] sm:text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeSubTab === 'program'
                  ? 'bg-purple-900 text-white shadow-sm ring-1 ring-purple-950'
                  : 'bg-white text-slate-700 hover:text-purple-900 hover:bg-slate-50 border border-slate-200/80 shadow-2xs'
              }`}
            >
              <Compass className={`w-3.5 h-3.5 shrink-0 ${activeSubTab === 'program' ? 'text-purple-200' : 'text-purple-900'}`} />
              <span>Program</span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold leading-none shrink-0 ${
                  activeSubTab === 'program'
                    ? 'bg-purple-800 text-purple-100 border border-purple-700'
                    : 'bg-purple-100 text-purple-900'
                }`}
              >
                {programList.length}
              </span>
            </button>

            {/* 3. Spreadsheet */}
            <button
              type="button"
              onClick={() => {
                setActiveSubTab('spreadsheet');
                setIsEditingProgram(false);
              }}
              className={`flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-1 sm:px-2.5 text-[11.5px] sm:text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeSubTab === 'spreadsheet'
                  ? 'bg-purple-900 text-white shadow-sm ring-1 ring-purple-950'
                  : 'bg-white text-slate-700 hover:text-purple-900 hover:bg-slate-50 border border-slate-200/80 shadow-2xs'
              }`}
            >
              <FileSpreadsheet className={`w-3.5 h-3.5 shrink-0 ${activeSubTab === 'spreadsheet' ? 'text-purple-200' : 'text-purple-900'}`} />
              <span>Spreadsheet</span>
            </button>
          </div>
        </div>

        {/* Global Toast / Success alert */}
        {savedSuccess && (
          <div className="mx-4 mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        {/* Modal Body Container */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {/* ========================================================================= */}
          {/* TAB 1: PROFIL & IDENTITAS MAJLIS */}
          {/* ========================================================================= */}
          {activeSubTab === 'profil' && (
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              {/* Logo Display Card */}
              <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 flex items-center gap-3.5">
                <div className="w-14 h-14 bg-white rounded-xl p-1 shadow-xs border border-purple-200 flex items-center justify-center shrink-0">
                  <img 
                    src={APP_LOGO} 
                    alt="Logo SAKINA" 
                    className="w-full h-full object-contain rounded-lg"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[15px] font-bold text-purple-950 font-display">
                      {formData.app_name || APP_NAME}
                    </span>
                    <span className="text-[9.5px] font-semibold bg-purple-900 text-white px-1.5 py-0.2 rounded">
                      RESMI
                    </span>
                  </div>
                  <div className="text-[11.5px] text-purple-800 font-medium truncate mt-0.5">
                    {formData.app_subtitle || APP_SUBTITLE}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Simpanan Anggota Kegiatan Majlis Taklim
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Aplikasi
                  </label>
                  <input
                    type="text"
                    value={formData.app_name || 'SAKINA'}
                    onChange={(e) => setFormData({ ...formData, app_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Singkatan / Logo Teks
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    value={formData.logo_teks || 'SAKINA'}
                    onChange={(e) => setFormData({ ...formData, logo_teks: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold uppercase focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kepanjangan / Sub-Judul Aplikasi
                </label>
                <input
                  type="text"
                  value={formData.app_subtitle || 'Simpanan Anggota Kegiatan Majlis Taklim'}
                  onChange={(e) => setFormData({ ...formData, app_subtitle: e.target.value, sub_nama: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Majlis Taklim
                </label>
                <input
                  type="text"
                  value={formData.nama_majlis}
                  onChange={(e) => setFormData({ ...formData, nama_majlis: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Keterangan / Sub-Judul Majlis
                </label>
                <input
                  type="text"
                  value={formData.sub_nama}
                  onChange={(e) => setFormData({ ...formData, sub_nama: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alamat Lengkap / Lokasi Majlis
                </label>
                <input
                  type="text"
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kontak Pengurus / HP
                  </label>
                  <input
                    type="text"
                    value={formData.no_kontak}
                    onChange={(e) => setFormData({ ...formData, no_kontak: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Singkatan Logo (2-4 huruf)
                  </label>
                  <input
                    type="text"
                    maxLength={5}
                    value={formData.logo_teks}
                    onChange={(e) => setFormData({ ...formData, logo_teks: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold uppercase focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Section: Pengurus & Penandatangan Dokumen (Kwitansi & Laporan) */}
              <div className="pt-3 border-t border-slate-200 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-purple-950 font-display">
                  <UserCheck className="w-4 h-4 text-purple-900" />
                  <span>Pengurus & Penandatangan Dokumen (Kwitansi & Laporan)</span>
                </div>
                <p className="text-[11px] text-slate-500 font-normal -mt-1">
                  Nama Ketua dan Bendahara yang diinput di sini akan otomatis dimuat pada tanda tangan <strong>Kwitansi Transaksi</strong> dan lembar pengesahan <strong>Laporan Pembukuan</strong>.
                </p>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                  {/* Ketua Majlis */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nama Ketua Majlis Taklim
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: H. Muhammad Syafi'i"
                        value={formData.nama_ketua || ''}
                        onChange={(e) => setFormData({ ...formData, nama_ketua: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        Tercantum di tanda tangan <em>"Mengetahui, Ketua Majlis"</em>
                      </span>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Jabatan / Gelar Ketua
                      </label>
                      <input
                        type="text"
                        placeholder="Ketua Majlis Taklim"
                        value={formData.jabatan_ketua || ''}
                        onChange={(e) => setFormData({ ...formData, jabatan_ketua: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Bendahara Utama */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2.5 border-t border-slate-200/60">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nama Bendahara Utama / Petugas
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Ustadzah Hj. Fatimah Azzahra"
                        value={formData.nama_bendahara || ''}
                        onChange={(e) => setFormData({ ...formData, nama_bendahara: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        Tercantum di tanda tangan <em>"Dicatat Oleh / Dibuat Oleh"</em>
                      </span>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Jabatan Bendahara
                      </label>
                      <input
                        type="text"
                        placeholder="Bendahara Utama"
                        value={formData.jabatan_bendahara || ''}
                        onChange={(e) => setFormData({ ...formData, jabatan_bendahara: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-900 hover:bg-purple-800 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  Simpan Profil
                </button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: KELOLA PROGRAM & KEGIATAN (TAMBAH, EDIT, HAPUS) */}
          {/* ========================================================================= */}
          {activeSubTab === 'program' && (
            <div className="space-y-4">
              {!isEditingProgram ? (
                <>
                  {/* Top Bar with Add Program Button */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Daftar Program Kegiatan
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Kelola agenda ziarah, santunan, dan kegiatan tabungan jamaah.
                      </p>
                    </div>
                    <button
                      onClick={handleOpenAddProgram}
                      className="bg-purple-900 hover:bg-purple-800 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Tambah Kegiatan</span>
                    </button>
                  </div>

                  {/* Delete Confirmation Alert */}
                  {programDeleteConfirm && (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-2 animate-in fade-in">
                      <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>Konfirmasi Hapus Program?</span>
                      </div>
                      <p className="text-[11.5px] text-rose-700">
                        Yakin ingin menghapus program <strong className="font-semibold text-rose-950">"{programDeleteConfirm.name}"</strong>? Data histori setoran lama tetap tersimpan.
                      </p>
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          onClick={() => setProgramDeleteConfirm(null)}
                          className="px-3 py-1 rounded-lg border border-slate-300 text-slate-700 text-xs font-medium bg-white hover:bg-slate-100 cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          onClick={handleConfirmDeleteProgram}
                          className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
                        >
                          Ya, Hapus
                        </button>
                      </div>
                    </div>
                  )}

                  {/* List of Programs */}
                  {programList.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-300 p-4">
                      <Compass className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                      <p className="text-xs font-semibold text-slate-700">Belum ada program kegiatan</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Klik tombol "Tambah Kegiatan" di atas untuk membuat program baru.</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {programList.map((prog, idx) => (
                        <div
                          key={prog.id_program || idx}
                          className="p-3 bg-white rounded-xl border border-slate-200 hover:border-purple-200 shadow-2xs transition flex items-start justify-between gap-2.5"
                        >
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-slate-900 font-display">
                                {prog.nama_program}
                              </span>
                              <span
                                className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full capitalize ${
                                  prog.status === 'selesai'
                                    ? 'bg-slate-100 text-slate-700 border border-slate-300'
                                    : prog.status === 'draft'
                                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                }`}
                              >
                                {prog.status || 'aktif'}
                              </span>
                            </div>

                            {/* Target & Tanggal Info */}
                            <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                              {prog.target_dana ? (
                                <span className="flex items-center gap-1 font-mono font-medium text-purple-900">
                                  <Target className="w-3 h-3 text-purple-700" />
                                  Target: {formatRupiah(prog.target_dana)}
                                </span>
                              ) : null}
                              {prog.tanggal_pelaksanaan ? (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-slate-400" />
                                  {prog.tanggal_pelaksanaan}
                                </span>
                              ) : null}
                            </div>

                            {/* Deskripsi */}
                            {prog.deskripsi && (
                              <p className="text-[11px] text-slate-600 line-clamp-2 italic">
                                {prog.deskripsi}
                              </p>
                            )}
                          </div>

                          {/* Action Buttons: Edit & Delete */}
                          <div className="flex items-center gap-1 shrink-0 pt-0.5">
                            <button
                              onClick={() => handleOpenEditProgram(prog)}
                              title="Edit Program"
                              className="p-1.5 rounded-lg text-slate-600 hover:text-purple-900 hover:bg-purple-50 transition cursor-pointer border border-slate-200"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setProgramDeleteConfirm({ id: prog.id_program, name: prog.nama_program })}
                              title="Hapus Program"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer border border-slate-200"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                /* Add / Edit Form */
                <form onSubmit={handleSaveProgramForm} className="space-y-3.5 animate-in fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <button
                      type="button"
                      onClick={() => setIsEditingProgram(false)}
                      className="text-xs font-semibold text-slate-600 hover:text-purple-900 flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Kembali ke Daftar</span>
                    </button>
                    <span className="text-xs font-bold text-purple-900">
                      {editingProgramId ? 'Edit Program Kegiatan' : 'Tambah Program Baru'}
                    </span>
                  </div>

                  {programError && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>{programError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nama Kegiatan / Program <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Ziarah Wali Songo 2026"
                      value={programForm.nama_program || ''}
                      onChange={(e) => setProgramForm({ ...programForm, nama_program: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Target Dana (Opsional)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">Rp</span>
                        <input
                          type="number"
                          placeholder="25000000"
                          value={programForm.target_dana || ''}
                          onChange={(e) =>
                            setProgramForm({
                              ...programForm,
                              target_dana: e.target.value ? Number(e.target.value) : undefined,
                            })
                          }
                          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Status Program
                      </label>
                      <select
                        value={programForm.status || 'aktif'}
                        onChange={(e) =>
                          setProgramForm({
                            ...programForm,
                            status: e.target.value as 'aktif' | 'selesai' | 'draft',
                          })
                        }
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                      >
                        <option value="aktif">Aktif (Bisa Setor)</option>
                        <option value="selesai">Selesai (Arsip)</option>
                        <option value="draft">Draft (Rencana)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Estimasi Tanggal Pelaksanaan (Opsional)
                    </label>
                    <input
                      type="date"
                      value={programForm.tanggal_pelaksanaan || ''}
                      onChange={(e) => setProgramForm({ ...programForm, tanggal_pelaksanaan: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Deskripsi / Catatan Kegiatan
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Tulis rute, tujuan ziarah, atau ketentuan program..."
                      value={programForm.deskripsi || ''}
                      onChange={(e) => setProgramForm({ ...programForm, deskripsi: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    />
                  </div>

                  {editingProgramId && (
                    <label className="flex items-center gap-2 p-2.5 bg-purple-50/70 border border-purple-200 rounded-xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={updateTxWhenRename}
                        onChange={(e) => setUpdateTxWhenRename(e.target.checked)}
                        className="w-4 h-4 text-purple-900 rounded-sm border-slate-300 focus:ring-purple-900"
                      />
                      <span className="text-[11.5px] text-purple-950 font-medium leading-tight">
                        Sinkronkan nama baru ke semua riwayat setoran transaksi lama
                      </span>
                    </label>
                  )}

                  <div className="pt-2 flex items-center justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingProgram(false)}
                      className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-purple-900 hover:bg-purple-800 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                    >
                      {editingProgramId ? 'Simpan Perubahan' : 'Tambahkan Program'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: GOOGLE SPREADSHEET & CADANGAN DATA */}
          {/* ========================================================================= */}
          {activeSubTab === 'spreadsheet' && (
            <div className="space-y-4">
              {/* Google Apps Script Integration */}
              <div className="space-y-3 pb-3 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-purple-900" />
                    <span>Integrasi Google Spreadsheet</span>
                  </h4>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    Online 2-Way Sync
                  </span>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    URL Web App Google Apps Script
                  </label>
                  <input
                    type="url"
                    value={formData.apps_script_url || ''}
                    onChange={(e) => setFormData({ ...formData, apps_script_url: e.target.value })}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:ring-1 focus:ring-purple-900 focus:outline-hidden"
                  />
                  <span className="text-[10.5px] text-slate-500 mt-1 block">
                    Menyinkronkan transaksi, anggota, dan profil majlis langsung ke spreadsheet Anda.
                  </span>
                </div>

                <label className="flex items-center gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.auto_sync_sheets !== false}
                    onChange={(e) => setFormData({ ...formData, auto_sync_sheets: e.target.checked })}
                    className="w-4 h-4 text-purple-900 rounded-sm border-slate-300 focus:ring-purple-900"
                  />
                  <span className="text-xs text-slate-700 font-medium">
                    Otomatis kirim setiap transaksi baru & perubahan profil ke Google Spreadsheet
                  </span>
                </label>

                {/* Real-time Push Config Status Feedback */}
                {pushConfigStatus && (
                  <div
                    className={`p-2.5 rounded-xl text-xs flex items-center gap-2 animate-in fade-in ${
                      pushConfigStatus.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : pushConfigStatus.type === 'loading'
                        ? 'bg-purple-50 text-purple-900 border border-purple-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {pushConfigStatus.type === 'loading' ? (
                      <Loader2 className="w-4 h-4 animate-spin shrink-0 text-purple-700" />
                    ) : pushConfigStatus.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                    )}
                    <span className="font-medium">{pushConfigStatus.message}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handlePushConfigNow}
                    disabled={isPushingConfig}
                    className="px-3.5 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-950 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isPushingConfig ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Kirim & Timpa Sheet Config Sekarang</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onSaveConfig(formData);
                      showNotification('URL Web App Google Apps Script disimpan!');
                    }}
                    className="px-4 py-1.5 rounded-xl bg-purple-900 text-white text-xs font-bold shadow-xs hover:bg-purple-800 transition cursor-pointer"
                  >
                    Simpan URL Script
                  </button>
                </div>
              </div>

              {/* Code Apps Script Accordion */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowScriptCode(!showScriptCode)}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-800 hover:text-purple-900 cursor-pointer"
                  >
                    <Code className="w-4 h-4 text-purple-900" />
                    <span>Kode Google Apps Script Backend (v2.0)</span>
                    {showScriptCode ? (
                      <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyScriptCode}
                    className="px-2.5 py-1 bg-white hover:bg-purple-50 border border-slate-300 text-slate-700 hover:text-purple-900 text-[11px] font-bold rounded-lg flex items-center gap-1 shadow-2xs transition cursor-pointer"
                  >
                    {copiedScript ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Kode</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-[10.5px] text-slate-500 font-normal">
                  Pastikan kode Apps Script di spreadsheet Anda sudah mendukung fungsi <code>update_config</code> agar perubahan profil otomatis menimpa sheet <strong>Config</strong>.
                </p>

                {showScriptCode && (
                  <div className="mt-2 animate-in fade-in">
                    <pre className="p-2.5 bg-slate-900 text-slate-200 rounded-lg text-[10px] font-mono overflow-x-auto max-h-48 leading-relaxed">
                      {APPS_SCRIPT_TEMPLATE}
                    </pre>
                  </div>
                )}
              </div>

              {/* Backup & Restore Data */}
              <div className="space-y-3 pb-3 border-b border-slate-200">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-purple-900" />
                  <span>Cadangan & Pemulihan Data (JSON)</span>
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleExportJSON}
                    className="p-3 bg-slate-50 hover:bg-purple-50 border border-slate-200 rounded-xl flex flex-col items-center justify-center gap-1.5 transition text-center cursor-pointer group"
                  >
                    <Download className="w-5 h-5 text-purple-900 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-slate-800">Unduh Backup JSON</span>
                    <span className="text-[10px] text-slate-500">Simpan ke HP / Laptop</span>
                  </button>

                  <label className="p-3 bg-slate-50 hover:bg-purple-50 border border-slate-200 rounded-xl flex flex-col items-center justify-center gap-1.5 transition text-center cursor-pointer group">
                    <Upload className="w-5 h-5 text-purple-900 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-slate-800">Pulihkan dari File JSON</span>
                    <span className="text-[10px] text-slate-500">Restore file cadangan</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileImport}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Reset to Demo Data */}
              {onResetData && (
                <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-rose-900 font-bold text-xs">
                      <RotateCcw className="w-4 h-4 text-rose-600" />
                      <span>Reset ke Data Awal Demo</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('PERINGATAN: Semua data anggota dan transaksi akan dikosongkan/direset ke awal. Lanjutkan?')) {
                          onResetData();
                          showNotification('Data telah direset ke awal.');
                          onClose();
                        }
                      }}
                      className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                    >
                      Reset Data
                    </button>
                  </div>
                  <p className="text-[10.5px] text-rose-700">
                    Menghapus data input lokal dan mengembalikan konfigurasi dasar.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
