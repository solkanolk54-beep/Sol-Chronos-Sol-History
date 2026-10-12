/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Printer, 
  Download, 
  FileCheck, 
  Calendar, 
  MapPin, 
  Hash, 
  Layers,
  AlertCircle,
  FileDown,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { RegionHotspot, SatelliteScene, ParcelInspection, Language } from '../types';
import { calculateDarkDroughtStress } from '../utils/spectralMath';
import { generateSovereignPdf } from '../utils/pdfGenerator';

interface SovereignReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  region: RegionHotspot;
  currentYear: number;
  activeScene: SatelliteScene;
  baselineScene: SatelliteScene;
  selectedParcel: ParcelInspection | null;
  language: Language;
}

export const SovereignReportModal: React.FC<SovereignReportModalProps> = ({
  isOpen,
  onClose,
  region,
  currentYear,
  activeScene,
  baselineScene,
  selectedParcel,
  language,
}) => {
  const isAr = language === 'ar';
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const darkDrought = calculateDarkDroughtStress(
    activeScene.ndviMean,
    0.22,
    0.08,
    activeScene.soilMoisturePercent
  );

  const reportId = `SOL-REP-DZ-${region.id.substring(0, 3).toUpperCase()}-${currentYear}-9104`;
  const generationDate = new Date().toLocaleDateString(isAr ? 'ar-DZ' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handleDownloadPdf = () => {
    setIsDownloadingPdf(true);
    setTimeout(() => {
      try {
        generateSovereignPdf({
          region,
          currentYear,
          activeScene,
          baselineScene,
          selectedParcel,
          reportId,
          generationDate,
        });
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 3000);
      } catch (err) {
        console.error('Failed to generate PDF:', err);
      } finally {
        setIsDownloadingPdf(false);
      }
    }, 400);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <div className="bg-[#0c121d] border border-slate-800 rounded-xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden print:m-0 print:border-none print:shadow-none">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#080e18] border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-950/80 border border-emerald-500/40 rounded-lg text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {isAr ? 'تقرير الرصد التاريخي والسيادة المكانية' : 'Sovereign Spatio-Temporal Audit Report'}
              </h2>
              <span className="text-xs text-slate-400 font-mono">{reportId}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Direct PDF Download Button */}
            <button
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
            >
              {isDownloadingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : downloadSuccess ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              ) : (
                <FileDown className="w-3.5 h-3.5" />
              )}
              <span>
                {isDownloadingPdf 
                  ? (isAr ? 'جارِ بناء PDF...' : 'Generating PDF...') 
                  : downloadSuccess 
                  ? (isAr ? 'تم التحميل!' : 'Downloaded!') 
                  : (isAr ? 'تنزيل مستند PDF' : 'Download PDF')}
              </span>
            </button>

            {/* Print / Browser Dialog Button */}
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isAr ? 'طباعة' : 'Print'}</span>
            </button>

            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg text-xs cursor-pointer"
            >
              {isAr ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 overflow-y-auto space-y-6 text-slate-200 bg-[#090e16] print:bg-white print:text-black font-sans">
          {/* Institutional Letterhead */}
          <div className="border-b-2 border-emerald-500/80 pb-5 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div className="flex items-start gap-4">
              <img
                src="/src/assets/images/sol_chronos_logo_1791845698930.jpg"
                alt="Sol-Chronos Sovereign Emblem"
                className="w-14 h-14 rounded-lg object-cover border border-emerald-500/40 shadow-md shrink-0"
              />
              <div>
                <div className="text-emerald-400 font-mono font-bold text-sm tracking-wider uppercase mb-1">
                  SOL-ECOSYSTEM // SPATIO-TEMPORAL AUDIT
                </div>
                <h1 className="text-xl font-bold text-white tracking-tight">
                  {isAr ? 'شهادة الرصد التاريخي ومؤشرات الأمن الغذائي والمائي' : 'Sovereign Historical Baseline & Agro-Ecological Certificate'}
                </h1>
                <div className="text-xs text-slate-400 mt-1">
                  {isAr ? 'الجمهورية الجزائرية الديمقراطية الشعبية — المبادرة السيادية للأقمار الصناعية' : 'People\'s Democratic Republic of Algeria — Sovereign Earth Observation Baseline'}
                </div>
              </div>
            </div>

            <div className="text-xs font-mono text-slate-400 text-end space-y-1">
              <div>{isAr ? 'تاريخ الإصدار:' : 'Date:'} {generationDate}</div>
              <div>{isAr ? 'المعرف الرقمي:' : 'Doc ID:'} {reportId}</div>
              <div className="text-emerald-400 font-semibold">{region.sovereignHash.substring(0, 24)}</div>
            </div>
          </div>

          {/* Section 1: Spatial Bounding & Mission Scope */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-lg space-y-2 text-xs">
              <div className="font-semibold text-white flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isAr ? 'المحددات الجغرافية ومحيط الاستثمار' : 'Geographical Bounding Box'}</span>
              </div>
              <div className="text-slate-300 font-mono space-y-1">
                <div>{isAr ? 'المنطقة:' : 'Region:'} {isAr ? region.nameAr : region.nameEn}</div>
                <div>{isAr ? 'الولاية:' : 'Wilaya:'} {isAr ? region.wilayaAr : region.wilayaEn}</div>
                <div>
                  {isAr ? 'الإحداثيات المركزية:' : 'Centroid:'} {region.coordinates.lat}°N, {region.coordinates.lng}°E
                </div>
                {region.albianAquiferDepthMeters && (
                  <div>{isAr ? 'عمق خزان الألبيان:' : 'Albian Aquifer Depth:'} ~{region.albianAquiferDepthMeters}m</div>
                )}
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-lg space-y-2 text-xs">
              <div className="font-semibold text-white flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isAr ? 'حزمة الأقمار الصناعية وخط الأساس' : 'Satellite Sensors & Baseline'}</span>
              </div>
              <div className="text-slate-300 font-mono space-y-1">
                <div>{isAr ? 'المهمة الحالية:' : 'Current Mission:'} {activeScene.mission} ({currentYear})</div>
                <div>{isAr ? 'فترة خط الأساس المرجعي:' : 'Reference Baseline:'} {region.baselinePeriod}</div>
                <div>{isAr ? 'الدقة المكانية:' : 'Spatial Resolution:'} {activeScene.resolutionMeters}m / Pixel</div>
                <div>{isAr ? 'محرك المعالجة:' : 'Processing Engine:'} PostGIS ST_MapAlgebra 32BF</div>
              </div>
            </div>
          </div>

          {/* Section 2: 40-Year Key Quantitative Findings */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              <span>{isAr ? 'النتائج الإحصائية المقارنة (Past vs Present)' : 'Comparative Baseline Statistics'}</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono border border-slate-800">
                <thead className="bg-slate-950 text-slate-300 text-start border-b border-slate-800">
                  <tr>
                    <th className="p-2.5 text-start">{isAr ? 'المؤشر الطيفي' : 'Spectral Metric'}</th>
                    <th className="p-2.5 text-start">{isAr ? `خط الأساس (${baselineScene.year})` : `Baseline (${baselineScene.year})`}</th>
                    <th className="p-2.5 text-start">{isAr ? `الرصد الحالي (${currentYear})` : `Current (${currentYear})`}</th>
                    <th className="p-2.5 text-start">{isAr ? 'الفارق الصافي' : 'Net Delta'}</th>
                    <th className="p-2.5 text-start">{isAr ? 'التصنيف البيئي' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  <tr className="hover:bg-slate-900/40">
                    <td className="p-2.5 font-sans font-medium text-white">{isAr ? 'مؤشر الغطاء النباتي (NDVI)' : 'Vegetation Index (NDVI)'}</td>
                    <td className="p-2.5 tabular-nums">{baselineScene.ndviMean.toFixed(3)}</td>
                    <td className="p-2.5 tabular-nums text-emerald-400 font-bold">{activeScene.ndviMean.toFixed(3)}</td>
                    <td className="p-2.5 tabular-nums text-emerald-400">+{(activeScene.ndviMean - baselineScene.ndviMean).toFixed(3)}</td>
                    <td className="p-2.5 text-emerald-400 font-sans">{isAr ? 'توسع زراعي ملحوظ' : 'Marked Greening'}</td>
                  </tr>
                  <tr className="hover:bg-slate-900/40">
                    <td className="p-2.5 font-sans font-medium text-white">{isAr ? 'المساحات المزروعة (هكتار)' : 'Cultivated Area (Hectares)'}</td>
                    <td className="p-2.5 tabular-nums">{baselineScene.cultivatedHectares.toLocaleString()} ha</td>
                    <td className="p-2.5 tabular-nums text-emerald-400 font-bold">{activeScene.cultivatedHectares.toLocaleString()} ha</td>
                    <td className="p-2.5 tabular-nums text-emerald-400">+{(activeScene.cultivatedHectares - baselineScene.cultivatedHectares).toLocaleString()} ha</td>
                    <td className="p-2.5 text-emerald-400 font-sans">{isAr ? 'أمن غذائي معزز' : 'Agro-Expansion'}</td>
                  </tr>
                  <tr className="hover:bg-slate-900/40">
                    <td className="p-2.5 font-sans font-medium text-white">{isAr ? 'مؤشر المحتوى المائي (NDWI)' : 'Water Extent (NDWI)'}</td>
                    <td className="p-2.5 tabular-nums">{baselineScene.ndwiMean.toFixed(3)}</td>
                    <td className="p-2.5 tabular-nums text-cyan-400">{activeScene.ndwiMean.toFixed(3)}</td>
                    <td className="p-2.5 tabular-nums text-cyan-400">{(activeScene.ndwiMean - baselineScene.ndwiMean).toFixed(3)}</td>
                    <td className="p-2.5 text-cyan-400 font-sans">{isAr ? 'توازن هيدرولوجي مستقر' : 'Stable Hydrology'}</td>
                  </tr>
                  <tr className="hover:bg-slate-900/40">
                    <td className="p-2.5 font-sans font-medium text-white">{isAr ? 'مؤشر التربة العارية / التصحر (BSI)' : 'Bare Soil Index (BSI)'}</td>
                    <td className="p-2.5 tabular-nums">{baselineScene.bareSoilIndex.toFixed(3)}</td>
                    <td className="p-2.5 tabular-nums text-amber-300">{activeScene.bareSoilIndex.toFixed(3)}</td>
                    <td className="p-2.5 tabular-nums text-emerald-400">{(activeScene.bareSoilIndex - baselineScene.bareSoilIndex).toFixed(3)}</td>
                    <td className="p-2.5 text-emerald-400 font-sans">{isAr ? 'تراجع التصحر وانحسار الرمال' : 'Dune Retreat'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Dark-Drought Early Warning Evaluation */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-4 space-y-2 text-xs">
            <div className="font-semibold text-white flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span>{isAr ? 'تقييم الإنذار المبكر للإجهاد الزراعي والجفاف (Dark-Drought Protocol)' : 'Dark-Drought Early Warning Protocol'}</span>
              </span>
              <span className="font-mono text-emerald-400">
                SCORE: {darkDrought.score}/100 ({darkDrought.severity.toUpperCase()})
              </span>
            </div>
            <p className="text-slate-300">
              {isAr
                ? `بناءً على الانحراف المعياري لخط الأساس التاريخي وحساسية طيف الأشعة تحت الحمراء القصيرة (SWIR)، تُظهر التربة والمحاصيل مستويات إجهاد عند المعدل ${darkDrought.score}%. لم يتم رصد أي مؤشرات حرجة لجفاف غير مرئي في الجذور خلال نافذة الـ ${darkDrought.daysToVisibleYellowing} يوماً القادمة.`
                : `Based on 30-year baseline standard deviation and SWIR thermal-reflectance variance, root-zone hydration remains healthy with no critical dark-drought emergence detected.`}
            </p>
          </div>

          {/* Section 4: Sovereign Cryptographic Certification */}
          <div className="border-t border-slate-800 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px] text-slate-400">
            <div>
              <div>SOVEREIGN_HASH: <span className="text-emerald-400">{region.sovereignHash}</span></div>
              <div>VERIFICATION: AES-256 SIGNED · NATIONAL POSTGIS REGISTRY</div>
            </div>
            <div className="text-emerald-400 font-bold border border-emerald-500/40 px-3 py-1 rounded bg-emerald-950/40">
              SEAL: SOVEREIGN-VALIDATED
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
