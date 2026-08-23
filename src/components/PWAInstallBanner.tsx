import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { APP_LOGO, APP_NAME } from '../assets/logo';

export const PWAInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showHowToModal, setShowHowToModal] = useState(false);

  useEffect(() => {
    // Check if already installed / standalone mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes('android-app://');

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent default mini-infobar
      e.preventDefault();
      setDeferredPrompt(e);
      // Show custom banner
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Also detect appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if user dismissed recently
    const dismissed = localStorage.getItem('sakina_pwa_dismissed');
    if (!dismissed && !isStandalone) {
      // Show guide banner if on mobile
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        setShowBanner(true);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      // If browser doesn't support direct prompt, show quick instruction modal
      setShowHowToModal(true);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('sakina_pwa_dismissed', Date.now().toString());
  };

  if (isInstalled || !showBanner) {
    return null;
  }

  return (
    <>
      <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 text-white px-3.5 py-2.5 shadow-md border-b border-purple-800 flex items-center justify-between gap-3 text-xs animate-in slide-in-from-top duration-300">
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src={APP_LOGO}
            alt={APP_NAME}
            className="w-8 h-8 rounded-lg object-contain bg-white/10 p-0.5 border border-white/20 shrink-0"
            referrerPolicy="no-referrer"
          />
          <div className="min-w-0">
            <div className="font-bold text-slate-100 flex items-center gap-1.5 truncate">
              <span>Pasang Aplikasi SAKINA</span>
              <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-1.5 py-0.2 rounded-full font-semibold">
                Android PWA
              </span>
            </div>
            <p className="text-[11px] text-purple-200 truncate">
              Akses cepat tanpa browser, hemat kuota & offline
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleInstallClick}
            className="bg-amber-500 hover:bg-amber-400 text-purple-950 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install App</span>
          </button>
          <button
            onClick={handleDismiss}
            className="text-purple-300 hover:text-white p-1 rounded-md transition cursor-pointer"
            title="Tutup banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* How to install Modal (Fallback Guide) */}
      {showHowToModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 text-slate-800 shadow-2xl border border-purple-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <img
                  src={APP_LOGO}
                  alt={APP_NAME}
                  className="w-7 h-7 rounded-md object-contain"
                  referrerPolicy="no-referrer"
                />
                <h3 className="font-bold text-sm text-purple-950 font-display">
                  Install SAKINA di Android
                </h3>
              </div>
              <button
                onClick={() => setShowHowToModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600">
              <p className="font-semibold text-slate-800">
                Cara memasang ke layar utama HP Android Anda:
              </p>
              <div className="space-y-2 bg-purple-50/70 p-3 rounded-xl border border-purple-100 text-purple-950">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-900 text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                    1
                  </span>
                  <span>Buka menu browser Chrome (titik tiga ⋮ di kanan atas).</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-900 text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                    2
                  </span>
                  <span>
                    Pilih <strong>"Tambahkan ke Layar Utama"</strong> atau{' '}
                    <strong>"Install Aplikasi"</strong>.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-900 text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                    3
                  </span>
                  <span>
                    Klik <strong>"Install / Tambahkan"</strong>. Ikon SAKINA akan langsung muncul di menu HP Anda!
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowHowToModal(false)}
              className="w-full py-2.5 bg-purple-900 hover:bg-purple-800 text-white font-bold text-xs rounded-xl transition"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
};
