import React, { useState } from 'react';
import { Bendahara } from '../types';
import { UserCheck, Plus, Check, X, Shield, Phone } from 'lucide-react';

interface AdminSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  bendaharaList: Bendahara[];
  activeBendahara: Bendahara;
  onSelectBendahara: (b: Bendahara) => void;
  onAddBendahara: (newB: Bendahara) => void;
}

export const AdminSwitcherModal: React.FC<AdminSwitcherModalProps> = ({
  isOpen,
  onClose,
  bendaharaList,
  activeBendahara,
  onSelectBendahara,
  onAddBendahara,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [nama, setNama] = useState('');
  const [peran, setPeran] = useState('Bendahara');
  const [noHp, setNoHp] = useState('');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) return;

    const newB: Bendahara = {
      id: `BND-${String(bendaharaList.length + 1).padStart(2, '0')}`,
      nama: nama.trim(),
      peran: peran.trim(),
      no_hp: noHp.trim() || undefined,
      avatarColor: 'bg-teal-700',
    };

    onAddBendahara(newB);
    onSelectBendahara(newB);
    setIsAdding(false);
    setNama('');
    setNoHp('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-purple-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <UserCheck className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base font-display">Pilih Bendahara yang Bertugas</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-purple-800 text-purple-200 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-[12px] text-slate-500 font-normal">
            Setiap setoran dan penarikan yang dicatat akan otomatis menyertakan nama bendahara yang aktif saat ini.
          </p>

          {/* List of Bendahara */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {bendaharaList.map((b) => {
              const isActive = b.id === activeBendahara.id;
              return (
                <div
                  key={b.id}
                  onClick={() => {
                    onSelectBendahara(b);
                    onClose();
                  }}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                    isActive
                      ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-500/30'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-xs font-display">
                      {b.nama.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-xs sm:text-sm font-display">{b.nama}</div>
                      <div className="text-[11px] text-slate-500 font-normal">{b.peran}</div>
                    </div>
                  </div>

                  {isActive ? (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                      <Check className="w-3.5 h-3.5" />
                      <span>Aktif</span>
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400 font-medium">Pilih &rarr;</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add New Bendahara Form / Toggle */}
          {!isAdding ? (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full py-2.5 border border-dashed border-slate-300 hover:border-emerald-500 text-slate-600 hover:text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Pengurus / Bendahara Lain</span>
            </button>
          ) : (
            <form onSubmit={handleAdd} className="p-3.5 bg-slate-50 rounded-xl border border-slate-300 space-y-3">
              <h4 className="font-bold text-slate-800 text-xs">Tambah Bendahara Baru</h4>

              <div>
                <input
                  type="text"
                  placeholder="Nama Lengkap Bendahara..."
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Peran (misal: Bendahara 2)"
                  value={peran}
                  onChange={(e) => setPeran(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-hidden"
                />
                <input
                  type="text"
                  placeholder="No. WhatsApp (opsional)"
                  value={noHp}
                  onChange={(e) => setNoHp(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg"
                >
                  Simpan & Pilih
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
