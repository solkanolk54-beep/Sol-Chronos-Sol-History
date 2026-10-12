/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { RegionSelector } from './components/RegionSelector';
import { MapStage } from './components/MapStage';
import { TimelineBar } from './components/TimelineBar';
import { SpectralAnalyticsPanel } from './components/SpectralAnalyticsPanel';
import { PostGisTerminalModal } from './components/PostGisTerminalModal';
import { OfflineResilienceModal } from './components/OfflineResilienceModal';
import { SovereignReportModal } from './components/SovereignReportModal';
import { REGIONS_DATA } from './data/regionsData';
import { RegionHotspot, SpectralBand, ParcelInspection, Language } from './types';
import { toggleLowBandwidthMode, getOfflineStats } from './utils/offlineStorage';
import { 
  Database, 
  Layers, 
  Activity, 
  WifiOff, 
  ShieldCheck, 
  Terminal, 
  TrendingUp, 
  Compass, 
  Info,
  Calendar,
  AlertTriangle
} from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'map' | 'analytics' | 'postgis' | 'offline' | 'report'>('map');
  const [selectedRegion, setSelectedRegion] = useState<RegionHotspot>(REGIONS_DATA[0]);
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [spectralBand, setSpectralBand] = useState<SpectralBand>('natural');
  const [selectedParcel, setSelectedParcel] = useState<ParcelInspection | null>(null);
  const [language, setLanguage] = useState<Language>('ar');
  const [lowBandwidth, setLowBandwidth] = useState<boolean>(() => getOfflineStats().lowBandwidthModeActive);

  // Modal open states
  const [isPostGisModalOpen, setIsPostGisModalOpen] = useState<boolean>(false);
  const [isOfflineModalOpen, setIsOfflineModalOpen] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);

  // Sync document direction with language
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  // Handle region switch: reset year if not available
  const handleSelectRegion = (region: RegionHotspot) => {
    setSelectedRegion(region);
    setSelectedParcel(null);
    if (!region.historicalYears.includes(currentYear)) {
      setCurrentYear(region.historicalYears[region.historicalYears.length - 1]);
    }
  };

  // Find active scene and baseline scene
  const activeScene = 
    selectedRegion.scenes.find((s) => s.year === currentYear) || 
    selectedRegion.scenes[selectedRegion.scenes.length - 1];

  const baselineScene = selectedRegion.scenes[0];

  const handleToggleLowBandwidth = () => {
    const next = toggleLowBandwidthMode(lowBandwidth);
    setLowBandwidth(next);
  };

  // Open modals based on nav tab selection
  const handleNavTabChange = (tab: 'map' | 'analytics' | 'postgis' | 'offline' | 'report') => {
    if (tab === 'postgis') {
      setIsPostGisModalOpen(true);
    } else if (tab === 'offline') {
      setIsOfflineModalOpen(true);
    } else if (tab === 'report') {
      setIsReportModalOpen(true);
    } else {
      setCurrentTab(tab);
    }
  };

  const isAr = language === 'ar';

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* 1. Header (Follows Top Bar Contract) */}
      <Header
        currentTab={currentTab}
        setCurrentTab={handleNavTabChange}
        language={language}
        setLanguage={setLanguage}
        lowBandwidth={lowBandwidth}
        onToggleLowBandwidth={handleToggleLowBandwidth}
        onOpenReport={() => setIsReportModalOpen(true)}
      />

      {/* 2. Region Hotspots Bar */}
      <RegionSelector
        selectedRegion={selectedRegion}
        onSelectRegion={handleSelectRegion}
        language={language}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 flex flex-col">
        {currentTab === 'map' && (
          <>
            {/* Interactive Satellite Stage with Split-Swipe & Multi-spectral Composites */}
            <MapStage
              region={selectedRegion}
              currentYear={currentYear}
              activeScene={activeScene}
              baselineScene={baselineScene}
              spectralBand={spectralBand}
              setSpectralBand={setSpectralBand}
              selectedParcel={selectedParcel}
              onSelectParcel={setSelectedParcel}
              language={language}
              lowBandwidth={lowBandwidth}
            />

            {/* 40-Year Temporal Scrubber & Playback Engine */}
            <TimelineBar
              region={selectedRegion}
              currentYear={currentYear}
              onSelectYear={setCurrentYear}
              activeScene={activeScene}
              language={language}
            />

            {/* Integrated Spectral Analytics Section */}
            <SpectralAnalyticsPanel
              region={selectedRegion}
              currentYear={currentYear}
              activeScene={activeScene}
              baselineScene={baselineScene}
              selectedParcel={selectedParcel}
              onClearParcel={() => setSelectedParcel(null)}
              language={language}
            />
          </>
        )}

        {currentTab === 'analytics' && (
          <div className="flex-1 p-4 max-w-7xl mx-auto w-full">
            <SpectralAnalyticsPanel
              region={selectedRegion}
              currentYear={currentYear}
              activeScene={activeScene}
              baselineScene={baselineScene}
              selectedParcel={selectedParcel}
              onClearParcel={() => setSelectedParcel(null)}
              language={language}
            />
          </div>
        )}
      </main>

      {/* Sovereign Footnote */}
      <footer className="border-t border-slate-800/80 bg-[#080d15] px-6 py-4 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-emerald-400 font-mono font-medium">SOL-CHRONOS DZ</span>
          <span aria-hidden="true">·</span>
          <span>
            {isAr 
              ? 'منظومة سيادية للرصد التاريخي والمكاني للأمن الغذائي والمائي في إفريقيا' 
              : 'Sovereign Spatio-Temporal Baseline Platform for Africa'}
          </span>
        </div>

        <div className="flex items-center gap-4 font-mono text-[11px] text-slate-400">
          <span>POSTGIS 32BF</span>
          <span aria-hidden="true">·</span>
          <span>LANDSAT C2 & SENTINEL L2A</span>
          <span aria-hidden="true">·</span>
          <span>SHA-256 SOVEREIGN AUDIT</span>
        </div>
      </footer>

      {/* Modals for Advanced System Features */}
      <PostGisTerminalModal
        isOpen={isPostGisModalOpen}
        onClose={() => setIsPostGisModalOpen(false)}
        language={language}
      />

      <OfflineResilienceModal
        isOpen={isOfflineModalOpen}
        onClose={() => setIsOfflineModalOpen(false)}
        language={language}
        lowBandwidth={lowBandwidth}
        onToggleLowBandwidth={handleToggleLowBandwidth}
      />

      <SovereignReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        region={selectedRegion}
        currentYear={currentYear}
        activeScene={activeScene}
        baselineScene={baselineScene}
        selectedParcel={selectedParcel}
        language={language}
      />
    </div>
  );
}
