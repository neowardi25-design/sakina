import React, { useState, useEffect } from 'react';
import { Bendahara, MajlisTaklimConfig } from '../types';
import { APP_LOGO, APP_NAME, APP_SUBTITLE } from '../assets/logo';
import { 
  Settings, 
  LogOut,
  Smartphone,
  Maximize2
} from 'lucide-react';

interface HeaderProps {
  config: MajlisTaklimConfig;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeBendahara: Bendahara;
  onOpenBendaharaSwitcher: () => void;
  onOpenNewTransaction: () => void;
  onOpenSettings: () => void;
  isMobileFrame?: boolean;
  onToggleMobileFrame?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  activeTab: _activeTab,
  setActiveTab,
  activeBendahara,
  onOpenBendaharaSwitcher,
  onOpenNewTransaction: _onOpenNewTransaction,
  onOpenSettings,
  isMobileFrame = false,
  onToggleMobileFrame,
}) => {
  // Live clock
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${hours}:${mins}`);

      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const day = String(now.getDate()).padStart(2, '0');
      const month = months[now.getMonth()];
      const year = now.getFullYear();
      setCurrentDate(`${day} ${month} ${year}`);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="bg-purple-900 text-white shadow-md sticky top-0 z-30">
      {/* Main Mobile App Bar Header */}
      <div className="px-3.5 sm:px-4 py-2.5 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div 
          onClick={() => setActiveTab('dashboard')} 
          className="flex items-center space-x-2.5 cursor-pointer group select-none"
        >
          <div className="w-9 h-9 rounded-xl bg-white p-0.5 shadow-sm border border-purple-300/40 group-hover:scale-105 transition-transform overflow-hidden flex items-center justify-center shrink-0">
            <img 
              src={APP_LOGO} 
              alt="Logo SAKINA" 
              className="w-full h-full object-contain rounded-lg"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="leading-tight">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[17px] font-bold tracking-tight text-white font-display">
                {config.app_name || APP_NAME}
              </span>
              <span className="text-[10px] font-medium bg-amber-400/90 text-purple-950 px-1.5 py-0.2 rounded font-sans tracking-wide">
                TABUNGAN
              </span>
            </div>
            <div className="text-[11px] text-purple-200 font-normal truncate max-w-[170px] sm:max-w-[240px]">
              {config.app_subtitle || config.sub_nama || APP_SUBTITLE}
            </div>
          </div>
        </div>

        {/* Right Header Controls: Live Time/Date & Bendahara Switcher */}
        <div className="flex items-center space-x-2">
          {/* Clock & Date Badge */}
          <div className="text-right leading-tight hidden xs:block sm:block mr-1">
            <div className="text-[13px] font-medium text-white tabular-nums tracking-tight">
              {currentTime || '16:42'}
            </div>
            <div className="text-[11px] text-purple-200 font-normal">
              {currentDate || '06 Mei 2026'}
            </div>
          </div>

          {/* Desktop Frame Toggle (if provided) */}
          {onToggleMobileFrame && (
            <button
              onClick={onToggleMobileFrame}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer hidden md:flex items-center justify-center"
              title={isMobileFrame ? 'Tampilan Layar Penuh' : 'Tampilan Bingkai HP'}
            >
              {isMobileFrame ? <Maximize2 className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
            </button>
          )}

          {/* Settings Shortcut */}
          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            title="Pengaturan"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Bendahara Switcher / Logout Button */}
          <button
            onClick={onOpenBendaharaSwitcher}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition border border-white/15 shadow-xs cursor-pointer group"
            title={`Bendahara: ${activeBendahara.nama} (Klik untuk ganti)`}
          >
            <LogOut className="w-4 h-4 text-white group-hover:scale-105 transition-transform" />
          </button>
        </div>
      </div>
    </header>
  );
};
