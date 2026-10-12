/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldCheck, Wifi, WifiOff, Terminal, FileCheck, Layers } from 'lucide-react';
import { Language } from '../types';

interface HeaderProps {
  currentTab: 'map' | 'analytics' | 'postgis' | 'offline' | 'report';
  setCurrentTab: (tab: 'map' | 'analytics' | 'postgis' | 'offline' | 'report') => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  lowBandwidth: boolean;
  onToggleLowBandwidth: () => void;
  onOpenReport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  language,
  setLanguage,
  lowBandwidth,
  onToggleLowBandwidth,
  onOpenReport,
}) => {
  const isAr = language === 'ar';

  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-[#0a0f18] border-b border-slate-800/80 sticky top-0 z-50">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <a
          href="#dashboard"
          onClick={(e) => {
            e.preventDefault();
            setCurrentTab('map');
          }}
          className="text-lg font-bold tracking-tight text-white flex items-center gap-2.5 whitespace-nowrap group"
        >
          <img
            src="/src/assets/images/sol_chronos_logo_1791845698930.jpg"
            alt="Sol-Chronos Logo"
            className="w-7 h-7 rounded-md object-cover border border-emerald-500/30 group-hover:border-emerald-400 transition-colors shadow-sm"
          />
          <span className="font-mono text-emerald-400 font-semibold">SOL-CHRONOS</span>
          <span className="text-slate-400 text-sm font-normal">
            {isAr ? 'التحليل الزمني المكاني' : 'Spatio-Temporal Baseline'}
          </span>
        </a>
      </div>

      {/* Zone 2: 4-5 clean single-line text navigation links */}
      <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-300">
        <button
          onClick={() => setCurrentTab('map')}
          className={`hover:text-white transition-colors whitespace-nowrap cursor-pointer pb-0.5 ${
            currentTab === 'map' ? 'text-emerald-400 font-semibold border-b-2 border-emerald-500' : 'text-slate-400'
          }`}
        >
          {isAr ? 'الخريطة التفاعلية والزمن' : 'Interactive Map & Time'}
        </button>

        <button
          onClick={() => setCurrentTab('analytics')}
          className={`hover:text-white transition-colors whitespace-nowrap cursor-pointer pb-0.5 ${
            currentTab === 'analytics' ? 'text-emerald-400 font-semibold border-b-2 border-emerald-500' : 'text-slate-400'
          }`}
        >
          {isAr ? 'محرك التحليل الطيفي' : 'Spectral Analytics Engine'}
        </button>

        <button
          onClick={() => setCurrentTab('postgis')}
          className={`hover:text-white transition-colors whitespace-nowrap cursor-pointer pb-0.5 ${
            currentTab === 'postgis' ? 'text-emerald-400 font-semibold border-b-2 border-emerald-500' : 'text-slate-400'
          }`}
        >
          {isAr ? 'معمل PostGIS والتغذية' : 'PostGIS Ingestion Lab'}
        </button>

        <button
          onClick={() => setCurrentTab('offline')}
          className={`hover:text-white transition-colors whitespace-nowrap cursor-pointer pb-0.5 flex items-center gap-1.5 ${
            currentTab === 'offline' ? 'text-emerald-400 font-semibold border-b-2 border-emerald-500' : 'text-slate-400'
          }`}
        >
          {lowBandwidth ? <WifiOff className="w-3.5 h-3.5 text-amber-400" /> : <Wifi className="w-3.5 h-3.5 text-slate-400" />}
          {isAr ? 'المرونة والتخزين الميداني' : 'Edge Resilience Cache'}
        </button>
      </nav>

      {/* Zone 3: 1 primary action + minimal utility toggles */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Low-Bandwidth Mode Quick Switcher */}
        <button
          onClick={onToggleLowBandwidth}
          title={isAr ? 'تفعيل وضع الاتصال الضعيف / البيانات الميدانية' : 'Toggle Low-Bandwidth Mode'}
          className={`px-2.5 py-1.5 text-xs font-mono rounded-md border transition-colors flex items-center gap-1.5 ${
            lowBandwidth
              ? 'bg-amber-950/40 border-amber-500/50 text-amber-300'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          {lowBandwidth ? <WifiOff className="w-3.5 h-3.5 text-amber-400" /> : <Wifi className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{lowBandwidth ? (isAr ? 'نطاق منخفض' : 'Low-BW Mode') : (isAr ? 'وضع متصل' : 'Broadband')}</span>
        </button>

        {/* Language switch */}
        <button
          onClick={() => setLanguage(isAr ? 'en' : 'ar')}
          className="px-2.5 py-1.5 text-xs font-mono rounded-md border border-slate-800 bg-slate-900 text-slate-300 hover:text-white transition-colors"
        >
          {isAr ? 'EN' : 'عربي'}
        </button>

        {/* Primary Sovereign Report Action */}
        <button
          onClick={onOpenReport}
          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-sm shadow-emerald-900/30"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{isAr ? 'التقرير السيادي' : 'Sovereign Dossier'}</span>
        </button>
      </div>
    </header>
  );
};
