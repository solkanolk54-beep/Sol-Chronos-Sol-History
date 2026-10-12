/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  TrendingUp, 
  Droplets, 
  AlertTriangle, 
  Activity, 
  Calendar, 
  MapPin, 
  Layers, 
  CheckCircle2, 
  HelpCircle,
  Database
} from 'lucide-react';
import { RegionHotspot, SatelliteScene, ParcelInspection, Language } from '../types';
import { calculateDarkDroughtStress } from '../utils/spectralMath';

interface SpectralAnalyticsPanelProps {
  region: RegionHotspot;
  currentYear: number;
  activeScene: SatelliteScene;
  baselineScene: SatelliteScene;
  selectedParcel: ParcelInspection | null;
  onClearParcel: () => void;
  language: Language;
}

export const SpectralAnalyticsPanel: React.FC<SpectralAnalyticsPanelProps> = ({
  region,
  currentYear,
  activeScene,
  baselineScene,
  selectedParcel,
  onClearParcel,
  language,
}) => {
  const isAr = language === 'ar';
  const [activeChartMetric, setActiveChartMetric] = useState<'ndvi' | 'ndwi' | 'hectares' | 'stress'>('ndvi');

  // Calculate Dark-Drought metric
  const darkDrought = calculateDarkDroughtStress(
    activeScene.ndviMean,
    0.22, // 30-year regional mean
    0.08, // regional standard deviation
    activeScene.soilMoisturePercent
  );

  // Growth percentages since baseline
  const ndviGrowth = Number((((activeScene.ndviMean - baselineScene.ndviMean) / (baselineScene.ndviMean || 0.05)) * 100).toFixed(1));
  const hectGrowth = Number((((activeScene.cultivatedHectares - baselineScene.cultivatedHectares) / (baselineScene.cultivatedHectares || 100)) * 100).toFixed(1));

  // Prepare chart coordinates for SVG sparkline
  const chartPoints = region.scenes.map((s, idx) => {
    let val = s.ndviMean;
    if (activeChartMetric === 'ndwi') val = (s.ndwiMean + 1) / 2; // normalize -1..1 to 0..1
    if (activeChartMetric === 'hectares') val = s.cultivatedHectares / 50000;
    if (activeChartMetric === 'stress') val = s.darkDroughtStressScore / 100;

    const x = (idx / (region.scenes.length - 1)) * 480 + 20;
    const y = 140 - Math.min(130, Math.max(10, val * 120));
    return { x, y, raw: s };
  });

  const svgPathD = chartPoints.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');

  return (
    <div className="bg-[#090e17] p-6 space-y-6">
      {/* 1. Header & Parcel Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mb-1">
            <span>{isAr ? 'محرك السلاسل الزمنية الطيفية' : 'Spectral Time-Series Engine'}</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-400">PostGIS ST_SummaryStats</span>
            <span aria-hidden="true">·</span>
            <span>1984 - 2026</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {isAr ? region.nameAr : region.nameEn}
          </h2>
        </div>

        {/* Parcel Selected Callout */}
        {selectedParcel ? (
          <div className="flex items-center gap-3 bg-emerald-950/40 border border-emerald-500/40 px-3.5 py-2 rounded-lg text-xs font-mono">
            <div>
              <span className="text-emerald-300 font-sans font-semibold">
                {isAr ? selectedParcel.parcelNameAr : selectedParcel.parcelNameEn}
              </span>
              <div className="text-slate-400 text-[11px]">
                {selectedParcel.areaHectares} ha · NDVI {selectedParcel.currentNdvi} ({selectedParcel.ndviTrendPercent > 0 ? '+' : ''}{selectedParcel.ndviTrendPercent}%)
              </div>
            </div>
            <button
              onClick={onClearParcel}
              className="text-slate-400 hover:text-white underline cursor-pointer"
            >
              {isAr ? 'إلغاء التحديد' : 'Deselect'}
            </button>
          </div>
        ) : (
          <div className="text-xs text-slate-400 font-mono">
            {isAr ? 'انقر على أي دائرة محورية بالخريطة للتفاصيل' : 'Click any pivot on map for parcel drilldown'}
          </div>
        )}
      </div>

      {/* 2. Top Metric KPI Strip (Science Reference Standard) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1: NDVI Mean */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-4">
          <div className="text-xs font-mono uppercase text-slate-400 tracking-wider flex items-center justify-between">
            <span>{isAr ? 'متوسط مؤشر الغطاء النباتي' : 'MEAN VEGETATION (NDVI)'}</span>
            <span className="text-emerald-400 text-[10px]">[-1.0 .. +1.0]</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold text-white tabular-nums">
              {activeScene.ndviMean.toFixed(3)}
            </span>
            <span className={`text-xs font-mono tabular-nums ${ndviGrowth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {ndviGrowth >= 0 ? '+' : ''}{ndviGrowth}%
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-mono">
            {isAr ? `خط الأساس (${baselineScene.year}): ${baselineScene.ndviMean.toFixed(3)}` : `Baseline (${baselineScene.year}): ${baselineScene.ndviMean.toFixed(3)}`}
          </div>
        </div>

        {/* Metric 2: Cultivated Acreage */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-4">
          <div className="text-xs font-mono uppercase text-slate-400 tracking-wider flex items-center justify-between">
            <span>{isAr ? 'المساحة المزروعة الكلية' : 'CULTIVATED FOOTPRINT'}</span>
            <span className="text-emerald-400 text-[10px]">HA</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold text-white tabular-nums">
              {activeScene.cultivatedHectares.toLocaleString()}
            </span>
            <span className="text-xs font-mono text-slate-400 uppercase">ha</span>
          </div>
          <div className="mt-1 text-[11px] text-emerald-400 font-mono">
            {isAr ? `نمو تراكمي: +${hectGrowth}%` : `Cumulative Growth: +${hectGrowth}%`}
          </div>
        </div>

        {/* Metric 3: NDWI / Water Index */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-4">
          <div className="text-xs font-mono uppercase text-slate-400 tracking-wider flex items-center justify-between">
            <span>{isAr ? 'مؤشر المحتوى المائي' : 'WATER EXTENT (NDWI)'}</span>
            <span className="text-cyan-400 text-[10px]">[-1.0 .. +1.0]</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold text-white tabular-nums">
              {activeScene.ndwiMean.toFixed(3)}
            </span>
            <span className="text-xs font-mono text-cyan-400 tabular-nums">
              {activeScene.soilMoisturePercent}% {isAr ? 'رطوبة' : 'moist'}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-mono">
            {isAr ? `المسطحات السطحية: ${activeScene.waterSurfaceHectares} هكتار` : `Surface: ${activeScene.waterSurfaceHectares} ha`}
          </div>
        </div>

        {/* Metric 4: Dark-Drought Early Warning Score */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-4">
          <div className="text-xs font-mono uppercase text-slate-400 tracking-wider flex items-center justify-between">
            <span>{isAr ? 'مؤشر الإنذار المبكر للجفاف' : 'DARK-DROUGHT RISK'}</span>
            <span className={`text-[10px] font-mono ${
              darkDrought.severity === 'severe' ? 'text-rose-400' :
              darkDrought.severity === 'elevated' ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {darkDrought.severity.toUpperCase()}
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold text-white tabular-nums">
              {darkDrought.score}
            </span>
            <span className="text-xs font-mono text-slate-400">/ 100</span>
          </div>
          <div className="mt-1 text-[11px] text-amber-300 font-mono">
            {isAr ? `تنبؤ اصفرار الأوراق: خلال ${darkDrought.daysToVisibleYellowing} يوم` : `Canopy stress lead: ${darkDrought.daysToVisibleYellowing}d`}
          </div>
        </div>
      </div>

      {/* 3. Main Chart & Time-Series Inspector */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">
              {isAr ? 'منحنى التطور التاريخي متعدد العقود (1988 - 2026)' : 'Multi-Decadal Satellite Trajectory (1988 - 2026)'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isAr ? 'مقارنة القيم الطيفية المستخرجة من Landsat TM/ETM+/OLI و Sentinel-2 L2A' : 'Spectral values harmonized across Landsat TM/ETM+/OLI & Sentinel-2 L2A'}
            </p>
          </div>

          {/* Metric Selector Segmented Controls */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setActiveChartMetric('ndvi')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                activeChartMetric === 'ndvi' ? 'bg-emerald-600 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              NDVI
            </button>
            <button
              onClick={() => setActiveChartMetric('ndwi')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                activeChartMetric === 'ndwi' ? 'bg-emerald-600 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              NDWI
            </button>
            <button
              onClick={() => setActiveChartMetric('hectares')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                activeChartMetric === 'hectares' ? 'bg-emerald-600 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              {isAr ? 'المساحة' : 'Acreage'}
            </button>
            <button
              onClick={() => setActiveChartMetric('stress')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                activeChartMetric === 'stress' ? 'bg-emerald-600 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              {isAr ? 'إجهاد الجفاف' : 'Drought'}
            </button>
          </div>
        </div>

        {/* SVG Time-Series Chart */}
        <div className="relative w-full h-44 bg-slate-950/60 rounded-md border border-slate-800/80 p-2 overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 520 160" preserveAspectRatio="none">
            {/* Grid Lines */}
            <line x1="20" y1="30" x2="500" y2="30" stroke="#1e293b" strokeDasharray="3 3" />
            <line x1="20" y1="75" x2="500" y2="75" stroke="#1e293b" strokeDasharray="3 3" />
            <line x1="20" y1="120" x2="500" y2="120" stroke="#1e293b" strokeDasharray="3 3" />

            {/* Baseline Reference Corridor Envelope */}
            <rect x="20" y="65" width="480" height="30" fill="rgba(16, 185, 129, 0.06)" />

            {/* Area Fill under Curve */}
            {chartPoints.length > 0 && (
              <polygon
                points={`20,150 ${chartPoints.map((p) => `${p.x},${p.y}`).join(' ')} 500,150`}
                fill={activeChartMetric === 'stress' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)'}
              />
            )}

            {/* Main Spline Curve */}
            <path
              d={svgPathD}
              fill="none"
              stroke={activeChartMetric === 'stress' ? '#f87171' : '#10b981'}
              strokeWidth="2.5"
            />

            {/* Data Points */}
            {chartPoints.map((p, i) => {
              const isSelectedYear = p.raw.year === currentYear;
              return (
                <g key={i}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isSelectedYear ? '6' : '3.5'}
                    fill={isSelectedYear ? '#ffffff' : (activeChartMetric === 'stress' ? '#ef4444' : '#10b981')}
                    stroke={isSelectedYear ? '#10b981' : '#0f172a'}
                    strokeWidth={isSelectedYear ? '2.5' : '1.5'}
                  />
                  <text
                    x={p.x}
                    y="155"
                    fontSize="9"
                    fill={isSelectedYear ? '#10b981' : '#64748b'}
                    textAnchor="middle"
                    fontFamily="monospace"
                  >
                    {p.raw.year}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Legend notes */}
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-emerald-500 inline-block" />
            <span>{isAr ? 'منحنى القياس الطيفي المعاير' : 'Calibrated Spectral Curve'}</span>
          </div>
          <div>
            <span>{isAr ? 'نطاق خط الأساس: ' : 'Baseline Envelope: '}</span>
            <span className="text-slate-300">1990 - 2010 (μ ± 1σ)</span>
          </div>
        </div>
      </div>

      {/* 4. Strategic Agronomic Challenges & Action Plan */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-5">
        <h3 className="text-sm font-semibold text-white mb-2">
          {isAr ? 'التحديات الاستراتيجية وتوصيات الأمن الغذائي بالمنطقة' : 'Strategic Food Security & Ecological Recommendations'}
        </h3>
        <p className="text-xs text-slate-400 mb-3">
          {isAr ? region.descriptionAr : region.descriptionEn}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(isAr ? region.keyChallengesAr : region.keyChallengesEn).map((challenge, i) => (
            <div key={i} className="bg-slate-950/70 border border-slate-800/80 rounded p-3 text-xs text-slate-300">
              <div className="text-emerald-400 font-mono text-[11px] mb-1">
                {isAr ? `توجيه رقم 0${i + 1}` : `Priority Directive 0${i + 1}`}
              </div>
              <p>{challenge}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
