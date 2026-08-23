import React, { useState } from 'react';
import { MajlisTaklimConfig } from '../types';
import { APP_LOGO, APP_NAME, APP_SUBTITLE } from '../assets/logo';
import {
  Info,
  Heart,
  Sparkles,
  Smartphone,
  FileSpreadsheet,
  Receipt,
  FileText,
  ShieldCheck,
  Phone,
  MessageCircle,
  Copy,
  Check,
  ExternalLink,
  Award,
  Globe,
  Mail,
  Zap,
  Users
} from 'lucide-react';

interface AboutViewProps {
  config: MajlisTaklimConfig;
}

export const AboutView: React.FC<AboutViewProps> = ({ config }) => {
  const [copiedWA, setCopiedWA] = useState(false);

  const DEVELOPER_NAME = 'Arunika Kreatif Media';
  const DEVELOPER_LOGO = 'https://res.cloudinary.com/maswardi/image/upload/v1775745397/akm_yq9a7m.png';
  const DEVELOPER_WA = '085150617732';
  const DEVELOPER_WA_LINK = 'https://wa.me/6285150617732?text=Halo%20Arunika%20Kreatif%20Media,%20saya%20tertarik%20dengan%20Aplikasi%20SAKINA%20Tabungan%20Majlis%20Taklim';

  const handleCopyWA = () => {
    navigator.clipboard.writeText(DEVELOPER_WA);
    setCopiedWA(true);
    setTimeout(() => setCopiedWA(false), 2000);
  };

  const appFeatures = [
    {
      icon: FileSpreadsheet,
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      title: 'Integrasi Google Spreadsheet Live',
      desc: 'Setiap transaksi dan data jamaah tersimpan dan tersinkronisasi otomatis ke Google Sheets Anda secara real-time.'
    },
    {
      icon: Smartphone,
      color: 'bg-purple-50 text-purple-900 border-purple-200',
      title: 'Aplikasi Web & Mobile PWA',
      desc: 'Dapat diinstal langsung di layar utama smartphone Android & iOS layaknya aplikasi native tanpa Play Store.'
    },
    {
      icon: Receipt,
      color: 'bg-amber-50 text-amber-900 border-amber-200',
      title: 'Kuitansi Digital & Kirim WhatsApp',
      desc: 'Cetak struk/nota kuitansi digital berformat rapi dan kirim pesan tanda terima resmi langsung ke nomor WA jamaah.'
    },
    {
      icon: FileText,
      color: 'bg-blue-50 text-blue-900 border-blue-200',
      title: 'Laporan Keuangan & Rekap Saldo',
      desc: 'Laporan kas berkala, buku tabungan per jamaah, serta rincian program kegiatan majlis siap cetak PDF / print thermal.'
    },
    {
      icon: ShieldCheck,
      color: 'bg-teal-50 text-teal-900 border-teal-200',
      title: 'Transparansi & Multi Bendahara',
      desc: 'Mendukung pergantian akun bendahara aktif dengan PIN keamanan untuk menjaga keakuratan dan keterbukaan pembukuan.'
    },
    {
      icon: Zap,
      color: 'bg-rose-50 text-rose-900 border-rose-200',
      title: 'Akses Cepat & Ringan',
      desc: 'Didesain khusus ramah pengguna untuk pengurus majlis taklim dengan antarmuka kasir modern dan responsif.'
    }
  ];

  return (
    <div className="space-y-4 pb-20 max-w-md md:max-w-xl lg:max-w-2xl mx-auto">
      {/* 1. APP HERO CARD */}
      <div className="bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 rounded-3xl p-5 sm:p-6 text-white shadow-lg border border-purple-800/80 relative overflow-hidden">
        {/* Background decorative circles */}
        <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-purple-600/15 blur-2xl pointer-events-none" />
        <div className="absolute -left-10 -top-10 w-36 h-36 rounded-full bg-amber-400/10 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white p-1.5 shadow-md border-2 border-purple-200/50 shrink-0 flex items-center justify-center">
            <img
              src={APP_LOGO}
              alt="Logo SAKINA"
              className="w-full h-full object-contain rounded-xl"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="space-y-1.5 flex-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/90 text-purple-950 text-[11px] font-extrabold tracking-wide">
              <Sparkles className="w-3 h-3 text-purple-950" />
              <span>VERSI RESMI MOBILE</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight">
              {config.app_name || APP_NAME}
            </h1>
            <p className="text-xs sm:text-sm text-purple-200 font-medium">
              {config.app_subtitle || APP_SUBTITLE}
            </p>
            <div className="pt-1 text-[11.5px] text-purple-100/90 leading-relaxed font-normal">
              Sistem informasi pencatatan tabungan, kas, dan rekap simpanan jamaah Majlis Taklim berbasis digital. Dirancang khusus untuk mempermudah bendahara dalam mengelola keuangan pengajian secara rapi, transparan, dan akuntabel.
            </div>
          </div>
        </div>

        {/* Info Pills */}
        <div className="relative z-10 mt-4 pt-4 border-t border-purple-800/60 grid grid-cols-2 sm:grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-purple-900/60 rounded-xl p-2 border border-purple-700/40">
            <span className="text-[10px] text-purple-300 block uppercase font-semibold">Majlis Taklim</span>
            <span className="font-bold text-white truncate block">{config.nama_majlis}</span>
          </div>
          <div className="bg-purple-900/60 rounded-xl p-2 border border-purple-700/40">
            <span className="text-[10px] text-purple-300 block uppercase font-semibold">Tahun Buku</span>
            <span className="font-bold text-white">{config.periode || '2026/2027'}</span>
          </div>
          <div className="bg-purple-900/60 rounded-xl p-2 border border-purple-700/40 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-purple-300 block uppercase font-semibold">Sinkronisasi</span>
            <span className="font-bold text-emerald-300 flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Google Sheets Live
            </span>
          </div>
        </div>
      </div>

      {/* 2. DEVELOPER PROFILE CARD (ARUNIKA KREATIF MEDIA) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Award className="w-5 h-5 text-purple-900" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-display">
            Profil Pengembang Aplikasi
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
          {/* Developer Logo */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-50 p-2 shadow-xs border border-slate-200 shrink-0 flex items-center justify-center overflow-hidden">
            <img
              src={DEVELOPER_LOGO}
              alt="Logo Arunika Kreatif Media"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
              onError={(e) => {
                // fallback if image fail
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>

          <div className="space-y-1 flex-1">
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-900 border border-purple-200 text-[10.5px] font-bold">
              <span>Pengembang Resmi</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 font-display">
              {DEVELOPER_NAME}
            </h3>
            <p className="text-xs text-purple-900 font-semibold">
              Solusi Teknologi, Desain, & Digitalisasi Majlis Taklim & Komunitas
            </p>
            <p className="text-xs text-slate-600 leading-relaxed pt-1">
              Arunika Kreatif Media menghadirkan solusi teknologi digital yang ramah pengguna, modern, dan tepat guna untuk mendukung transparansi dan efisiensi tata kelola administrasi organisasi keagamaan, yayasan, dan usaha kreatif.
            </p>
          </div>
        </div>

        {/* WhatsApp Contact Action Box */}
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 rounded-2xl p-4 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-800 block">
                Kontak Layanan & Bantuan
              </span>
              <div className="text-sm font-bold text-slate-900 font-mono">
                WhatsApp: {DEVELOPER_WA}
              </div>
              <span className="text-[11px] text-emerald-700">
                Hubungi kami untuk kustomisasi, konsultasi, atau kendala teknis.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyWA}
              className="px-3 py-2 bg-white hover:bg-slate-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-95"
              title="Salin Nomor WhatsApp"
            >
              {copiedWA ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Salin Nomor</span>
                </>
              )}
            </button>

            <a
              href={DEVELOPER_WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Chat WhatsApp</span>
              <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
            </a>
          </div>
        </div>
      </div>

      {/* 3. APP KEY FEATURES LIST */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-900" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-display">
              Fitur & Keunggulan SAKINA
            </h2>
          </div>
          <span className="text-[11px] bg-purple-50 text-purple-900 px-2 py-0.5 rounded-full font-bold">
            6 Fitur Utama
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {appFeatures.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 hover:border-purple-200 transition-colors flex items-start gap-3"
              >
                <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${feat.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <h4 className="text-xs font-bold text-slate-900 leading-snug">
                    {feat.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. FOOTER & COPYRIGHT */}
      <div className="text-center space-y-1 pt-2 pb-4 text-xs text-slate-400">
        <p className="font-semibold text-slate-600">
          {config.app_name || APP_NAME} • {config.nama_majlis}
        </p>
        <p className="text-[11px]">
          Dikembangkan dengan penuh dedikasi oleh <span className="font-bold text-purple-900">Arunika Kreatif Media</span>.
        </p>
        <p className="text-[10px] text-slate-400">
          &copy; {new Date().getFullYear()} SAKINA. Hak cipta dilindungi.
        </p>
      </div>
    </div>
  );
};
