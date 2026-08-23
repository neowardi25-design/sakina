import React from 'react';
import { 
  Home, 
  ReceiptText, 
  Plus, 
  Users, 
  FileText,
  Compass,
  FileSpreadsheet
} from 'lucide-react';

interface BottomNavBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenNewTransaction: () => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewTransaction,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Beranda', icon: Home },
    { id: 'transaksi', label: 'Transaksi', icon: ReceiptText },
    { id: 'plus', label: 'Setor', icon: Plus, isAction: true },
    { id: 'anggota', label: 'Jamaah', icon: Users },
    { id: 'laporan', label: 'Laporan', icon: FileText },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg px-2 py-1.5 transition-all">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          if (item.isAction) {
            return (
              <button
                key={item.id}
                onClick={onOpenNewTransaction}
                className="relative -top-5 flex flex-col items-center group cursor-pointer"
                title="Catat Setoran Baru"
              >
                <div className="w-12 h-12 rounded-full bg-purple-900 hover:bg-purple-800 text-white flex items-center justify-center shadow-md shadow-purple-900/30 group-hover:scale-105 group-active:scale-95 transition-all border-2 border-white">
                  <Plus className="w-6 h-6 stroke-[2.5]" />
                </div>
                <span className="text-[10px] font-semibold text-purple-900 -mt-0.5">
                  Setor
                </span>
              </button>
            );
          }

          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'text-purple-900 font-semibold'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <div
                className={`p-1 rounded-lg transition-colors ${
                  isActive ? 'bg-purple-50 text-purple-900 scale-105' : ''
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[11px] mt-0.5 tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
