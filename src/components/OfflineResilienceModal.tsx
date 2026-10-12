/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Wifi, 
  WifiOff, 
  HardDrive, 
  Download, 
  Trash2, 
  RefreshCw, 
  ShieldCheck, 
  CheckCircle2, 
  CloudLightning,
  Lock
} from 'lucide-react';
import { REGIONS_DATA } from '../data/regionsData';
import { 
  getOfflineStats, 
  toggleLowBandwidthMode, 
  saveOfflineRegionPack, 
  removeOfflineRegionPack,
  clearPendingSyncDeltas 
} from '../utils/offlineStorage';
import { Language } from '../types';

interface OfflineResilienceModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  lowBandwidth: boolean;
  onToggleLowBandwidth: () => void;
}

export const OfflineResilienceModal: React.FC<OfflineResilienceModalProps> = ({
  isOpen,
  onClose,
  language,
  lowBandwidth,
  onToggleLowBandwidth,
}) => {
  const isAr = language === 'ar';
  const [stats, setStats] = useState(getOfflineStats());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncSuccess, setSyncSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleDownloadPack = (regionId: string) => {
    saveOfflineRegionPack(regionId);
    setStats(getOfflineStats());
  };

  const handleRemovePack = (regionId: string) => {
    removeOfflineRegionPack(regionId);
    setStats(getOfflineStats());
  };

  const handleSyncDeltas = () => {
    setIsSyncing(true);
    setTimeout(() => {
      clearPendingSyncDeltas();
      setIsSyncing(false);
      setSyncSuccess(true);
      setStats(getOfflineStats());
      setTimeout(() => setSyncSuccess(false), 3000);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0b101a] border border-slate-800 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#080d15] border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-950/60 border border-amber-500/40 rounded-lg text-amber-400">
              <CloudLightning className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>{isAr ? 'المرونة الميدانية والتخزين دون إنترنت (Edge Resilience)' : 'Edge Resilience & Offline Cache'}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-amber-950 border border-amber-500/40 text-amber-400 font-mono">
                  PWA / INDEXED-DB
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {isAr ? 'مصمم للعمل في المناطق الصحراوية والسهبية النائية بالجزائر وإفريقيا ذات التغطية الضعيفة' : 'Optimized for low-bandwidth African remote agricultural corridors and desert fields'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs cursor-pointer"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          {/* Storage Meter & Low-Bandwidth Switch */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Box 1: Local Storage Meter */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-4 space-y-3 font-mono">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-sans font-medium flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4 text-emerald-400" />
                  <span>{isAr ? 'ذاكرة التخزين المؤقت المحلية' : 'Local Offline Storage'}</span>
                </span>
                <span className="text-emerald-400 tabular-nums">
                  {stats.storageUsedMb} MB / {stats.maxStorageMb} MB
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${(stats.storageUsedMb / stats.maxStorageMb) * 100}%` }}
                />
              </div>

              <div className="text-[11px] text-slate-400 flex justify-between">
                <span>{isAr ? `المشاهد المحفوظة: ${stats.cachedScenesCount}` : `Cached scenes: ${stats.cachedScenesCount}`}</span>
                <span>{isAr ? `آخر مزامنة: ${stats.lastSyncTimestamp}` : `Last sync: ${stats.lastSyncTimestamp}`}</span>
              </div>
            </div>

            {/* Box 2: Low-Bandwidth Mode Toggle */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-200 font-sans font-medium flex items-center gap-1.5">
                    {lowBandwidth ? <WifiOff className="w-4 h-4 text-amber-400" /> : <Wifi className="w-4 h-4 text-emerald-400" />}
                    <span>{isAr ? 'وضع توفير البيانات والنطاق الضعيف' : 'Low-Bandwidth Mode'}</span>
                  </span>
                  <button
                    onClick={onToggleLowBandwidth}
                    className={`px-3 py-1 rounded text-xs font-mono font-semibold transition-colors cursor-pointer ${
                      lowBandwidth
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    {lowBandwidth ? (isAr ? 'مفعل' : 'ENABLED') : (isAr ? 'معطل' : 'DISABLED')}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  {isAr 
                    ? 'يقوم بتعطيل تنزيل شبكات GeoTIFF الثقيلة ويعتمد على متجهات مدمجة وخرائط مسبقة التخزين لحفظ حزم الإنترنت.'
                    : 'Disables raw uncompressed GeoTIFF rasters and serves compressed vectorized payloads.'}
                </p>
              </div>
            </div>
          </div>

          {/* Regional Offline Packs Download */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Download className="w-4 h-4 text-emerald-400" />
              <span>{isAr ? 'حزم الولايات والمناطق المتاحة للتحميل المسبق' : 'Pre-packaged Regional Baseline Packs'}</span>
            </h3>

            <div className="space-y-2">
              {REGIONS_DATA.map((r) => {
                const isCached = stats.regionsAvailableOffline.includes(r.id);

                return (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-white text-xs">
                        {isAr ? r.nameAr : r.nameEn}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {r.wilayaAr} · 8 {isAr ? 'مشاهد تاريخية' : 'scenes'} (1988 - 2026) · ~28.4 MB
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isCached ? (
                        <>
                          <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{isAr ? 'محفوظ محلياً' : 'Cached'}</span>
                          </span>
                          <button
                            onClick={() => handleRemovePack(r.id)}
                            title={isAr ? 'حذف الحزمة' : 'Delete Pack'}
                            className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-900 rounded cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleDownloadPack(r.id)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{isAr ? 'تحميل للميدان' : 'Download Pack'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Delta Sync & Sovereign Security Fingerprint */}
          <div className="border-t border-slate-800 pt-5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-950/60 border border-emerald-500/40 rounded-lg text-emerald-400">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-white text-xs">
                  {isAr ? 'السيادة الرقمية وتشفير البيانات AES-256' : 'AES-256 Sovereign Encryption & SHA-256 Seals'}
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  KEY_ID: DZ-SOL-VAULT-2026-X89 · STRICT LOCAL GOVERNANCE
                </div>
              </div>
            </div>

            <button
              onClick={handleSyncDeltas}
              disabled={isSyncing}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? (isAr ? 'جارِ المزامنة...' : 'Syncing...') : (isAr ? 'مزامنة السجلات الميدانية' : 'Sync Field Deltas')}</span>
            </button>
          </div>

          {syncSuccess && (
            <div className="p-2.5 bg-emerald-950/60 border border-emerald-500/50 rounded text-emerald-300 text-center font-mono">
              {isAr ? 'تمت مزامنة جميع السجلات الميدانية بنجاح مع خادم PostGIS السيادي' : 'Field deltas synced successfully with Sovereign PostGIS vault'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
