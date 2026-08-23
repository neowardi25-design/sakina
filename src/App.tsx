import React, { useState, useEffect } from 'react';
import { Anggota, Bendahara, MajlisTaklimConfig, ProgramKegiatan, RekapAnggota, Setoran } from './types';
import {
  loadAnggota,
  saveAnggota,
  loadSetoran,
  saveSetoran,
  loadBendahara,
  saveBendahara,
  loadActiveBendahara,
  saveActiveBendahara,
  loadProgramKegiatan,
  saveProgramKegiatan,
  loadConfig,
  saveConfig,
  calculateRekap,
  resetAllDataToDefault,
} from './utils/storage';
import {
  fetchFromGoogleSheets,
  pushMemberToGoogleSheets,
  pushTransactionToGoogleSheets,
  pushConfigToGoogleSheets,
} from './utils/googleSheetsApi';
import { Header } from './components/Header';
import { BottomNavBar } from './components/BottomNavBar';
import { Dashboard } from './components/Dashboard';
import { MemberManagement } from './components/MemberManagement';
import { TransactionList } from './components/TransactionList';
import { ProgramHistory } from './components/ProgramHistory';
import { MonthlyReport } from './components/MonthlyReport';
import { AboutView } from './components/AboutView';
import { TransactionModal } from './components/TransactionModal';
import { MemberDetailModal } from './components/MemberDetailModal';
import { ReceiptModal } from './components/ReceiptModal';
import { AdminSwitcherModal } from './components/AdminSwitcherModal';
import { SettingsModal } from './components/SettingsModal';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { Smartphone, Maximize2, Sparkles, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  // --- STATE ---
  const [config, setConfig] = useState<MajlisTaklimConfig>(loadConfig);
  const [anggotaList, setAnggotaList] = useState<Anggota[]>(loadAnggota);
  const [setoranList, setSetoranList] = useState<Setoran[]>(loadSetoran);
  const [programList, setProgramList] = useState<ProgramKegiatan[]>(loadProgramKegiatan);
  const [bendaharaList, setBendaharaList] = useState<Bendahara[]>(loadBendahara);
  const [activeBendahara, setActiveBendahara] = useState<Bendahara>(loadActiveBendahara);
  const [rekapList, setRekapList] = useState<RekapAnggota[]>(() =>
    calculateRekap(anggotaList, setoranList)
  );

  // Sync state with Google Sheets
  const [isSyncing, setIsSyncing] = useState<boolean>(true);
  const [syncStatus, setSyncStatus] = useState<{ message: string; type: 'loading' | 'success' | 'warning' } | null>({
    message: 'Menyinkronkan data dari Google Spreadsheet...',
    type: 'loading',
  });

  // Active Tab: dashboard | anggota | transaksi | program | laporan | tentang
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Mobile Device Frame view option (for desktop display)
  const [isMobileFrame, setIsMobileFrame] = useState<boolean>(true);

  // Modals
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txDefaultMemberId, setTxDefaultMemberId] = useState<string | undefined>(undefined);
  const [txDefaultProgram, setTxDefaultProgram] = useState<string | undefined>(undefined);

  const [selectedMemberDetail, setSelectedMemberDetail] = useState<Anggota | null>(null);
  const [receiptTx, setReceiptTx] = useState<Setoran | null>(null);
  const [isAdminSwitcherOpen, setIsAdminSwitcherOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // --- RE-CALCULATE REKAP ON DATA CHANGE ---
  useEffect(() => {
    const updatedRekap = calculateRekap(anggotaList, setoranList);
    setRekapList(updatedRekap);
  }, [anggotaList, setoranList]);

  // Helper to extract and apply 100% data from Google Spreadsheet
  const applySpreadsheetData = (data: NonNullable<import('./utils/googleSheetsApi').SyncResult['data']>) => {
    const freshAnggota = data.anggota || [];
    const freshSetoran = data.setoran || [];
    
    // 1. Save Members & Transactions
    handleSaveAnggota(freshAnggota);
    handleSaveSetoran(freshSetoran);

    // 2. Save Config
    let updatedConfig = config;
    if (data.config) {
      updatedConfig = {
        ...config,
        ...data.config,
        last_sync_time: new Date().toISOString(),
      };
      handleSaveConfig(updatedConfig, false);
    }

    // 3. Dynamically Extract Programs from 100% Spreadsheet Data
    const rawProgramNames = Array.from(
      new Set(
        freshSetoran
          .map((s) => s.keterangan_program?.trim())
          .filter((p): p is string => Boolean(p && p.length > 0 && !/^\d+$/.test(p)))
      )
    );

    const spreadsheetPrograms: ProgramKegiatan[] = rawProgramNames.map((pName, idx) => {
      const existing = programList.find((p) => p.nama_program.toLowerCase() === pName.toLowerCase());
      return {
        id_program: existing?.id_program || `PROG-${String(idx + 1).padStart(3, '0')}`,
        nama_program: pName,
        target_dana: existing?.target_dana || 0,
        tanggal_pelaksanaan: existing?.tanggal_pelaksanaan || '',
        deskripsi: existing?.deskripsi || `Program ${pName}`,
        status: existing?.status || 'aktif',
      };
    });

    if (spreadsheetPrograms.length > 0) {
      handleSaveProgramList(spreadsheetPrograms);
    }

    // 4. Dynamically Extract Bendahara / Officers from 100% Spreadsheet Data
    const recordedByNames = Array.from(
      new Set(
        freshSetoran
          .map((s) => s.dicatat_oleh?.trim())
          .filter((b): b is string => Boolean(b && b.length > 0))
      )
    );

    const mainBendaharaName = updatedConfig.nama_bendahara?.trim();
    if (mainBendaharaName && !recordedByNames.includes(mainBendaharaName)) {
      recordedByNames.unshift(mainBendaharaName);
    }

    if (recordedByNames.length > 0) {
      const colors = ['bg-emerald-700', 'bg-teal-700', 'bg-purple-700', 'bg-indigo-700', 'bg-amber-700'];
      const dynamicBendaharaList: Bendahara[] = recordedByNames.map((nama, idx) => ({
        id: `BND-${String(idx + 1).padStart(2, '0')}`,
        nama,
        peran: idx === 0 ? (updatedConfig.jabatan_bendahara || 'Bendahara Utama') : `Bendahara ${idx + 1}`,
        avatarColor: colors[idx % colors.length],
      }));

      handleSaveBendaharaList(dynamicBendaharaList);
      
      // Update active bendahara if current is not in the list
      if (!dynamicBendaharaList.some((b) => b.nama.toLowerCase() === activeBendahara.nama.toLowerCase())) {
        handleSetActiveBendahara(dynamicBendaharaList[0]);
      }
    }
  };

  // --- AUTO SYNC ON APP START (100% SPREADSHEET DATA) ---
  useEffect(() => {
    let isSubscribed = true;

    async function syncSpreadsheetOnStart() {
      setIsSyncing(true);
      setSyncStatus({ message: 'Menghubungkan ke Google Spreadsheet...', type: 'loading' });

      try {
        const scriptUrl = config.apps_script_url || 'https://script.google.com/macros/s/AKfycbxQoyJ19Pev9Rj3_wDQQIBmxXW1W6vWi3SN2aZ1XrtFFaMdSFlPdegeV8AYqv9Ppo_v/exec';
        const result = await fetchFromGoogleSheets(scriptUrl);

        if (isSubscribed) {
          if (result.success && result.data) {
            applySpreadsheetData(result.data);

            const memberCount = result.data.anggota?.length || 0;
            const txCount = result.data.setoran?.length || 0;

            setSyncStatus({
              message: `✓ 100% Data Spreadsheet Terhubung (${memberCount} Jamaah, ${txCount} Transaksi)`,
              type: 'success',
            });
          } else {
            setSyncStatus({
              message: result.message || 'Menggunakan data lokal tersimpan.',
              type: 'warning',
            });
          }
        }
      } catch (err: any) {
        if (isSubscribed) {
          setSyncStatus({
            message: 'Mode Offline: Memuat dari penyimpanan lokal.',
            type: 'warning',
          });
        }
      } finally {
        if (isSubscribed) {
          setIsSyncing(false);
          // Auto hide banner after 6 seconds
          setTimeout(() => {
            if (isSubscribed) setSyncStatus(null);
          }, 6000);
        }
      }
    }

    syncSpreadsheetOnStart();

    return () => {
      isSubscribed = false;
    };
  }, []);

  // Manual Trigger to refresh from Google Sheets
  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncStatus({ message: 'Menyinkronkan data terbaru...', type: 'loading' });
    try {
      const scriptUrl = config.apps_script_url || 'https://script.google.com/macros/s/AKfycbxQoyJ19Pev9Rj3_wDQQIBmxXW1W6vWi3SN2aZ1XrtFFaMdSFlPdegeV8AYqv9Ppo_v/exec';
      const result = await fetchFromGoogleSheets(scriptUrl);
      if (result.success && result.data) {
        applySpreadsheetData(result.data);
        setSyncStatus({
          message: `✓ Data Berhasil Disinkronkan 100% (${result.data.anggota?.length || 0} Jamaah, ${result.data.setoran?.length || 0} Transaksi)`,
          type: 'success',
        });
      } else {
        setSyncStatus({ message: result.message || 'Gagal sinkron data', type: 'warning' });
      }
    } catch (e) {
      setSyncStatus({ message: 'Gagal menghubungi Google Sheets', type: 'warning' });
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatus(null), 5000);
    }
  };

  // --- PERSISTENCE EFFECT ---
  const handleSaveAnggota = (newList: Anggota[]) => {
    setAnggotaList(newList);
    saveAnggota(newList);
  };

  const handleSaveSetoran = (newList: Setoran[]) => {
    setSetoranList(newList);
    saveSetoran(newList);
  };

  const handleSaveConfig = (newCfg: MajlisTaklimConfig, syncToSheets: boolean = true) => {
    setConfig(newCfg);
    saveConfig(newCfg);

    // Sync activeBendahara if nama_bendahara was updated in settings
    if (newCfg.nama_bendahara && newCfg.nama_bendahara.trim()) {
      const trimmedBendahara = newCfg.nama_bendahara.trim();
      const updatedBendahara: Bendahara = {
        ...activeBendahara,
        nama: trimmedBendahara,
        peran: newCfg.jabatan_bendahara?.trim() || activeBendahara.peran || 'Bendahara Utama',
      };
      setActiveBendahara(updatedBendahara);
      saveActiveBendahara(updatedBendahara);

      const updatedList = bendaharaList.map((b) =>
        b.id === activeBendahara.id
          ? { ...b, nama: trimmedBendahara, peran: newCfg.jabatan_bendahara?.trim() || b.peran }
          : b
      );
      setBendaharaList(updatedList);
      saveBendahara(updatedList);
    }

    // Auto-push updated config to Google Sheets if Apps Script URL is provided
    if (syncToSheets && newCfg.apps_script_url && newCfg.apps_script_url.trim().startsWith('http')) {
      pushConfigToGoogleSheets(newCfg, newCfg.apps_script_url).then((res) => {
        if (res.success) {
          console.log('✓ Profil & Config berhasil diperbarui di Google Spreadsheet (Sheet Config).');
        } else {
          console.warn('Gagal sinkron config ke Google Spreadsheet:', res.message);
        }
      }).catch((err) => {
        console.warn('Error saat mengirim config ke Google Spreadsheet:', err);
      });
    }
  };

  const handleSaveBendaharaList = (newList: Bendahara[]) => {
    setBendaharaList(newList);
    saveBendahara(newList);
  };

  const handleSetActiveBendahara = (b: Bendahara) => {
    setActiveBendahara(b);
    saveActiveBendahara(b);
  };

  const handleSaveProgramList = (newList: ProgramKegiatan[]) => {
    setProgramList(newList);
    saveProgramKegiatan(newList);
  };

  const handleAddProgram = (newProg: ProgramKegiatan) => {
    const updated = [newProg, ...programList];
    handleSaveProgramList(updated);
  };

  const handleUpdateProgram = (
    oldName: string,
    updatedProg: ProgramKegiatan,
    updateTransactions: boolean = true
  ) => {
    const updatedPrograms = programList.map((p) =>
      p.id_program === updatedProg.id_program ? updatedProg : p
    );
    handleSaveProgramList(updatedPrograms);

    if (updateTransactions && oldName && oldName !== updatedProg.nama_program) {
      const updatedSetoran = setoranList.map((s) => {
        if (s.keterangan_program?.trim() === oldName.trim()) {
          return {
            ...s,
            keterangan_program: updatedProg.nama_program,
          };
        }
        return s;
      });
      handleSaveSetoran(updatedSetoran);
    }
  };

  const handleDeleteProgram = (id: string, programName: string) => {
    const updated = programList.filter((p) => p.id_program !== id);
    handleSaveProgramList(updated);
  };

  // --- ACTIONS ---
  const handleAddMember = (newMember: Anggota) => {
    const updated = [newMember, ...anggotaList];
    handleSaveAnggota(updated);

    // Auto-sync with Google Sheets in background if enabled
    if (config.auto_sync_sheets !== false && config.apps_script_url) {
      pushMemberToGoogleSheets(newMember, config.apps_script_url).catch((err) =>
        console.warn('Sync member error:', err)
      );
    }
  };

  const handleUpdateMember = (updatedMember: Anggota) => {
    const updated = anggotaList.map((m) =>
      m.id_anggota === updatedMember.id_anggota ? updatedMember : m
    );
    handleSaveAnggota(updated);
    if (selectedMemberDetail?.id_anggota === updatedMember.id_anggota) {
      setSelectedMemberDetail(updatedMember);
    }
  };

  const handleToggleMemberStatus = (id: string) => {
    const updated = anggotaList.map((m) => {
      if (m.id_anggota === id) {
        return {
          ...m,
          status: (m.status === 'aktif' ? 'nonaktif' : 'aktif') as 'aktif' | 'nonaktif',
        };
      }
      return m;
    });
    handleSaveAnggota(updated);
  };

  const handleSaveNewTransaction = (newTx: Setoran) => {
    const updated = [newTx, ...setoranList];
    handleSaveSetoran(updated);
    // Show receipt immediately
    setReceiptTx(newTx);

    // Auto-sync with Google Sheets in background if enabled
    if (config.auto_sync_sheets !== false && config.apps_script_url) {
      pushTransactionToGoogleSheets(newTx, config.apps_script_url).catch((err) =>
        console.warn('Sync transaction error:', err)
      );
    }
  };

  const handleDataFromSheets = (
    newAnggota: Anggota[],
    newSetoran: Setoran[],
    newCfg?: Partial<MajlisTaklimConfig>
  ) => {
    handleSaveAnggota(newAnggota || []);
    handleSaveSetoran(newSetoran || []);
    if (newCfg) {
      const mergedConfig = {
        ...config,
        ...newCfg,
        last_sync_time: new Date().toISOString(),
      };
      handleSaveConfig(mergedConfig);
    }
  };

  const handleDeleteTransaction = (id: string) => {
    const updated = setoranList.filter((s) => s.id_setoran !== id);
    handleSaveSetoran(updated);
  };

  const handleResetData = () => {
    resetAllDataToDefault();
    setConfig(loadConfig());
    setAnggotaList([]);
    setSetoranList([]);
    setProgramList(loadProgramKegiatan());
    setBendaharaList(loadBendahara());
    setActiveBendahara(loadActiveBendahara());
  };

  const handleImportBackup = (imported: any) => {
    if (imported.config) handleSaveConfig(imported.config);
    if (imported.anggota) handleSaveAnggota(imported.anggota);
    if (imported.setoran) handleSaveSetoran(imported.setoran);
    if (imported.programs) handleSaveProgramList(imported.programs);
    if (imported.bendahara) handleSaveBendaharaList(imported.bendahara);
  };

  const handleOpenTransactionModal = (memberId?: string, program?: string) => {
    setTxDefaultMemberId(memberId);
    setTxDefaultProgram(program);
    setIsTxModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-800 flex flex-col items-center justify-start font-sans selection:bg-amber-400 selection:text-indigo-950">
      {/* Top Desktop Bar (when viewed on desktop) */}
      <div className="w-full bg-slate-950 text-slate-400 py-1.5 px-4 text-xs hidden md:flex items-center justify-between border-b border-slate-800 z-50">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-semibold text-slate-300">
            SAKINA Mobile App • Google Sheets Sync
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400 text-[11px]">100% Data Spreadsheet Live</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-purple-900/60 hover:bg-purple-800 text-purple-200 text-xs font-medium transition cursor-pointer border border-purple-700/50 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Tarik Spreadsheet</span>
          </button>

          <button
            onClick={() => setIsMobileFrame(!isMobileFrame)}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer"
          >
            {isMobileFrame ? (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Mode Lebar</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
                <span>Bingkai HP</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Container Wrapper */}
      <div
        className={`w-full flex-1 flex flex-col transition-all duration-300 ${
          isMobileFrame
            ? 'max-w-md my-0 md:my-6 md:rounded-[40px] md:shadow-2xl md:ring-12 md:ring-slate-800 md:border md:border-slate-700 bg-slate-100 overflow-hidden relative'
            : 'max-w-4xl bg-slate-100 min-h-screen'
        }`}
      >
        {/* PWA Android Install Banner */}
        <PWAInstallBanner />

        {/* Sync Status Banner */}
        {syncStatus && (
          <div
            className={`px-3 py-1.5 text-xs flex items-center justify-between border-b transition-all ${
              syncStatus.type === 'loading'
                ? 'bg-purple-50 text-purple-900 border-purple-100'
                : syncStatus.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-100'
                : 'bg-amber-50 text-amber-900 border-amber-100'
            }`}
          >
            <div className="flex items-center gap-1.5 truncate">
              {syncStatus.type === 'loading' && <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-700 shrink-0" />}
              {syncStatus.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
              {syncStatus.type === 'warning' && <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
              <span className="font-medium text-[11px] truncate">{syncStatus.message}</span>
            </div>
            <button
              onClick={() => setSyncStatus(null)}
              className="text-[10px] opacity-60 hover:opacity-100 ml-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Top Header */}
        <Header
          config={config}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          activeBendahara={activeBendahara}
          onOpenBendaharaSwitcher={() => setIsAdminSwitcherOpen(true)}
          onOpenNewTransaction={() => handleOpenTransactionModal()}
          onOpenSettings={() => setIsSettingsOpen(true)}
          isMobileFrame={isMobileFrame}
          onToggleMobileFrame={() => setIsMobileFrame(!isMobileFrame)}
        />

        {/* Content Body */}
        <main className="flex-1 w-full px-3.5 py-4 overflow-y-auto max-h-[calc(100vh-140px)] md:max-h-[760px]">
          {activeTab === 'dashboard' && (
            <Dashboard
              config={config}
              anggotaList={anggotaList}
              setoranList={setoranList}
              rekapList={rekapList}
              programList={programList}
              activeBendahara={activeBendahara}
              onOpenNewTransaction={handleOpenTransactionModal}
              onOpenNewMember={() => setActiveTab('anggota')}
              onOpenMemberDetail={(m) => setSelectedMemberDetail(m)}
              onOpenReceipt={(tx) => setReceiptTx(tx)}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'anggota' && (
            <MemberManagement
              anggotaList={anggotaList}
              rekapList={rekapList}
              setoranList={setoranList}
              onAddMember={handleAddMember}
              onUpdateMember={handleUpdateMember}
              onToggleStatus={handleToggleMemberStatus}
              onOpenMemberDetail={(m) => setSelectedMemberDetail(m)}
              onOpenNewTransaction={(mId) => handleOpenTransactionModal(mId)}
            />
          )}

          {activeTab === 'transaksi' && (
            <TransactionList
              setoranList={setoranList}
              anggotaList={anggotaList}
              namaMajlis={config.nama_majlis}
              onOpenNewTransaction={() => handleOpenTransactionModal()}
              onOpenReceipt={(tx) => setReceiptTx(tx)}
              onDeleteTransaction={handleDeleteTransaction}
            />
          )}

          {activeTab === 'program' && (
            <ProgramHistory
              setoranList={setoranList}
              anggotaList={anggotaList}
              config={config}
              programList={programList}
              onOpenNewTransaction={handleOpenTransactionModal}
              onOpenReceipt={(tx) => setReceiptTx(tx)}
              onOpenProgramManagement={() => setIsSettingsOpen(true)}
            />
          )}

          {activeTab === 'laporan' && (
            <MonthlyReport
              setoranList={setoranList}
              anggotaList={anggotaList}
              rekapList={rekapList}
              config={config}
              activeBendahara={activeBendahara}
            />
          )}

          {activeTab === 'tentang' && (
            <AboutView
              config={config}
            />
          )}
        </main>

        {/* Bottom Navigation Dock */}
        <BottomNavBar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenNewTransaction={() => handleOpenTransactionModal()}
        />
      </div>

      {/* --- POPUP MODALS --- */}
      {/* 1. Modal Input Setoran / Penarikan */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        anggotaList={anggotaList}
        setoranList={setoranList}
        programList={programList}
        activeBendahara={activeBendahara}
        defaultMemberId={txDefaultMemberId}
        defaultProgram={txDefaultProgram}
        onSave={handleSaveNewTransaction}
      />

      {/* 2. Modal Detail Buku Tabungan Jamaah */}
      <MemberDetailModal
        member={selectedMemberDetail}
        setoranList={setoranList}
        config={config}
        onClose={() => setSelectedMemberDetail(null)}
        onOpenNewTransaction={(mId) => {
          setSelectedMemberDetail(null);
          handleOpenTransactionModal(mId);
        }}
        onOpenReceipt={(tx) => setReceiptTx(tx)}
      />

      {/* 3. Modal Kuitansi / Bukti Setoran Resmi */}
      <ReceiptModal
        transaction={receiptTx}
        config={config}
        onClose={() => setReceiptTx(null)}
      />

      {/* 4. Modal Switcher Bendahara Aktif */}
      <AdminSwitcherModal
        isOpen={isAdminSwitcherOpen}
        onClose={() => setIsAdminSwitcherOpen(false)}
        bendaharaList={bendaharaList}
        activeBendahara={activeBendahara}
        onSelectBendahara={handleSetActiveBendahara}
        onAddBendahara={(newB) => handleSaveBendaharaList([...bendaharaList, newB])}
      />

      {/* 5. Modal Pengaturan */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onSaveConfig={handleSaveConfig}
        programList={programList}
        onAddProgram={handleAddProgram}
        onUpdateProgram={handleUpdateProgram}
        onDeleteProgram={handleDeleteProgram}
        onResetData={handleResetData}
        fullData={{
          config,
          anggota: anggotaList,
          setoran: setoranList,
          programs: programList,
          bendahara: bendaharaList,
        }}
        onImportBackup={handleImportBackup}
      />
    </div>
  );
}

