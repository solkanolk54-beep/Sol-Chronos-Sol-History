/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Layers, 
  Split, 
  Columns2,
  Maximize2, 
  Minimize2, 
  Crosshair, 
  Eye, 
  PenTool, 
  RotateCcw, 
  Info,
  Droplet,
  Flame,
  TreeDeciduous,
  Activity,
  Compass,
  ArrowRightLeft,
  TrendingUp,
  MapPin
} from 'lucide-react';
import { RegionHotspot, SpectralBand, SatelliteScene, ParcelInspection, Language } from '../types';
import { REGIONS_DATA, PARCELS_DATA } from '../data/regionsData';
import { getNdviColor, getNdwiColor } from '../utils/spectralMath';

interface MapStageProps {
  region: RegionHotspot;
  currentYear: number;
  activeScene: SatelliteScene;
  baselineScene: SatelliteScene;
  spectralBand: SpectralBand;
  setSpectralBand: (band: SpectralBand) => void;
  onSelectParcel: (parcel: ParcelInspection | null) => void;
  selectedParcel: ParcelInspection | null;
  language: Language;
  lowBandwidth: boolean;
}

export type ViewMode = 'temporal_swipe' | 'dual_regions' | 'single';

export const MapStage: React.FC<MapStageProps> = ({
  region,
  currentYear,
  activeScene,
  baselineScene,
  spectralBand,
  setSpectralBand,
  onSelectParcel,
  selectedParcel,
  language,
  lowBandwidth,
}) => {
  const isAr = language === 'ar';
  const containerRef = useRef<HTMLDivElement>(null);

  // View mode: 'temporal_swipe' (default), 'dual_regions', or 'single'
  const [viewMode, setViewMode] = useState<ViewMode>('temporal_swipe');

  // Second region for Dual Region Side-by-Side comparison
  const [secondaryRegion, setSecondaryRegion] = useState<RegionHotspot>(() => {
    return REGIONS_DATA.find((r) => r.id !== region.id) || REGIONS_DATA[1];
  });

  // Ensure secondary region is never the same as primary region
  useEffect(() => {
    if (secondaryRegion.id === region.id) {
      const alternate = REGIONS_DATA.find((r) => r.id !== region.id);
      if (alternate) setSecondaryRegion(alternate);
    }
  }, [region.id, secondaryRegion.id]);

  // Split-swipe comparison state for 'temporal_swipe' mode
  const [splitPosition, setSplitPosition] = useState<number>(50); // percentage 0-100
  const [isDraggingSplit, setIsDraggingSplit] = useState<boolean>(false);

  // Mouse coordinate tracker for crosshair HUD
  const [mouseCoords, setMouseCoords] = useState<{ lat: number; lng: number; x: number; y: number } | null>(null);

  // Custom AOI Drawing state
  const [isDrawingAoi, setIsDrawingAoi] = useState<boolean>(false);
  const [aoiPolygon, setAoiPolygon] = useState<Array<{ x: number; y: number }>>([]);
  const [aoiStats, setAoiStats] = useState<{ areaHa: number; avgNdvi: number; risk: string } | null>(null);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Parcels for primary region and secondary region
  const regionParcels = PARCELS_DATA.filter((p) => p.regionId === region.id);
  const secondaryParcels = PARCELS_DATA.filter((p) => p.regionId === secondaryRegion.id);

  // Secondary region active scene for the selected year (or closest year)
  const secondaryActiveScene = 
    secondaryRegion.scenes.find((s) => s.year === currentYear) ||
    secondaryRegion.scenes[secondaryRegion.scenes.length - 1];

  const secondaryBaselineScene = secondaryRegion.scenes[0];

  // Handle split slider drag in temporal_swipe mode
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert screen coordinates to approximate geographical Lat/Lng
    const bounds = region.bounds;
    const latSpan = bounds[1][0] - bounds[0][0];
    const lngSpan = bounds[1][1] - bounds[0][1];
    const lat = bounds[1][0] - (y / rect.height) * latSpan;
    const lng = bounds[0][1] + (x / rect.width) * lngSpan;

    setMouseCoords({
      lat: Number(lat.toFixed(4)),
      lng: Number(lng.toFixed(4)),
      x,
      y,
    });

    if (isDraggingSplit && viewMode === 'temporal_swipe') {
      const percentage = Math.min(95, Math.max(5, (x / rect.width) * 100));
      setSplitPosition(percentage);
    }
  };

  const handleStageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawingAoi || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newPoly = [...aoiPolygon, { x, y }];
    setAoiPolygon(newPoly);

    if (newPoly.length >= 3) {
      const estimatedHa = Math.round(newPoly.length * 28.5 + (newPoly[0].x % 30));
      setAoiStats({
        areaHa: estimatedHa,
        avgNdvi: Number((activeScene.ndviMean * 1.08).toFixed(3)),
        risk: activeScene.darkDroughtStressScore > 40 ? 'مرتفع' : 'منخفض ومستقر',
      });
    }
  };

  const handleResetAoi = () => {
    setAoiPolygon([]);
    setAoiStats(null);
    setIsDrawingAoi(false);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Spectral filter CSS style generator
  const getSpectralFilterStyle = (band: SpectralBand, isPast: boolean) => {
    const baseBrightness = lowBandwidth ? 'brightness(1.05)' : 'brightness(1.0)';
    switch (band) {
      case 'cir':
        return isPast
          ? `sepia(0.3) saturate(1.4) hue-rotate(290deg) contrast(1.2) ${baseBrightness}`
          : `sepia(0.4) saturate(2.2) hue-rotate(300deg) contrast(1.3) ${baseBrightness}`;
      case 'agriculture':
        return isPast
          ? `contrast(1.2) saturate(1.2) hue-rotate(40deg) ${baseBrightness}`
          : `contrast(1.45) saturate(2.4) hue-rotate(55deg) brightness(1.1)`;
      case 'ndvi':
        return isPast
          ? `grayscale(0.3) contrast(1.3) hue-rotate(60deg) saturate(1.8) ${baseBrightness}`
          : `contrast(1.6) saturate(3.0) hue-rotate(75deg) brightness(1.15)`;
      case 'ndwi':
        return `contrast(1.5) saturate(2.5) hue-rotate(170deg) ${baseBrightness}`;
      case 'dark_drought':
        return isPast
          ? `contrast(1.1) saturate(1.1) ${baseBrightness}`
          : `contrast(1.5) saturate(2.2) hue-rotate(330deg) ${baseBrightness}`;
      case 'natural':
      default:
        return isPast
          ? `saturate(0.85) contrast(1.1) sepia(0.15) ${baseBrightness}`
          : `saturate(1.25) contrast(1.2) ${baseBrightness}`;
    }
  };

  const primaryImage = region.imageSrc || '/src/assets/images/adrar_pivot_satellite_1791834511659.jpg';
  const secondaryImage = secondaryRegion.imageSrc || '/src/assets/images/barrage_vert_steppe_1791834523700.jpg';

  // Comparative metrics
  const deltaNdvi = Number((activeScene.ndviMean - secondaryActiveScene.ndviMean).toFixed(3));
  const deltaAcreage = activeScene.cultivatedHectares - secondaryActiveScene.cultivatedHectares;

  // Mini Sparkline coordinates for dual regions across available years
  const sparklineYears = [1988, 1994, 2002, 2010, 2016, 2020, 2024, 2026];
  const regionASparkPoints = sparklineYears.map((yr, idx) => {
    const sc = region.scenes.find((s) => s.year === yr) || region.scenes[0];
    const x = (idx / (sparklineYears.length - 1)) * 160 + 10;
    const y = 45 - sc.ndviMean * 75;
    return `${x},${Math.max(5, Math.min(45, y))}`;
  });
  const regionBSparkPoints = sparklineYears.map((yr, idx) => {
    const sc = secondaryRegion.scenes.find((s) => s.year === yr) || secondaryRegion.scenes[0];
    const x = (idx / (sparklineYears.length - 1)) * 160 + 10;
    const y = 45 - sc.ndviMean * 75;
    return `${x},${Math.max(5, Math.min(45, y))}`;
  });

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseUp={() => setIsDraggingSplit(false)}
      onMouseLeave={() => {
        setIsDraggingSplit(false);
        setMouseCoords(null);
      }}
      className={`relative w-full h-[640px] bg-[#05080e] overflow-hidden select-none border-b border-slate-800 ${
        isFullscreen ? 'fixed inset-0 z-50 h-screen' : ''
      }`}
    >
      {/* 1. Underlying Map Views depending on viewMode */}
      <div 
        onClick={handleStageClick} 
        className="absolute inset-0 w-full h-full cursor-crosshair overflow-hidden"
      >
        {/* MODE A: DUAL REGIONS SIDE-BY-SIDE VIEW */}
        {viewMode === 'dual_regions' ? (
          <div className="absolute inset-0 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-slate-800">
            {/* Left Panel: Primary Region A */}
            <div className="relative flex-1 h-full overflow-hidden">
              <img
                src={primaryImage}
                alt={region.nameEn}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transform scale-105 transition-all duration-300"
                style={{
                  filter: getSpectralFilterStyle(spectralBand, false),
                }}
              />

              {/* Region A Header Badge */}
              <div className="absolute top-4 start-4 z-20 bg-slate-950/90 backdrop-blur-md px-3 py-2 rounded-lg border border-emerald-500/40 shadow-xl max-w-xs">
                <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-emerald-400" />
                  <span>{isAr ? 'المنطقة الأولى (أ)' : 'PRIMARY REGION (A)'}</span>
                </div>
                <div className="text-xs font-bold text-white font-sans mt-0.5 truncate">
                  {isAr ? region.nameAr.split('|')[0].trim() : region.nameEn.split('|')[0].trim()}
                </div>
                <div className="text-[11px] font-mono text-slate-300 mt-1 flex items-center gap-2">
                  <span className="text-emerald-300 font-semibold">NDVI: {activeScene.ndviMean.toFixed(3)}</span>
                  <span className="text-slate-500">·</span>
                  <span>{activeScene.cultivatedHectares.toLocaleString()} ha</span>
                </div>
              </div>

              {/* Primary Region Parcels */}
              <div className="absolute inset-0 pointer-events-none z-15">
                {regionParcels.map((parcel, idx) => {
                  const isSelected = selectedParcel?.id === parcel.id;
                  const topPct = 30 + (idx * 22);
                  const leftPct = 25 + (idx * 25);
                  return (
                    <div
                      key={parcel.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectParcel(isSelected ? null : parcel);
                      }}
                      className={`absolute pointer-events-auto transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-110 ${
                        isSelected ? 'scale-125 z-30' : 'z-20'
                      }`}
                      style={{ top: `${topPct}%`, left: `${leftPct}%` }}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 ${
                        isSelected ? 'bg-emerald-500 text-white border-white' : 'bg-slate-900/90 text-emerald-300 border-emerald-400'
                      }`}>
                        <TreeDeciduous className="w-3 h-3" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Panel: Secondary Region B */}
            <div className="relative flex-1 h-full overflow-hidden">
              <img
                src={secondaryImage}
                alt={secondaryRegion.nameEn}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transform scale-105 transition-all duration-300"
                style={{
                  filter: getSpectralFilterStyle(spectralBand, false),
                }}
              />

              {/* Region B Header & Interactive Dropdown Selector */}
              <div className="absolute top-4 start-4 z-20 bg-slate-950/90 backdrop-blur-md px-3 py-2 rounded-lg border border-amber-500/40 shadow-xl max-w-xs">
                <div className="text-[10px] font-mono text-amber-400 uppercase tracking-wider flex items-center justify-between gap-1.5">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-amber-400" />
                    <span>{isAr ? 'المنطقة المقارنة (ب)' : 'COMPARISON REGION (B)'}</span>
                  </span>
                </div>

                {/* Region B Dropdown Selector */}
                <select
                  value={secondaryRegion.id}
                  onChange={(e) => {
                    const picked = REGIONS_DATA.find((r) => r.id === e.target.value);
                    if (picked) setSecondaryRegion(picked);
                  }}
                  className="mt-1 w-full text-xs font-semibold text-white bg-slate-900 border border-slate-700 rounded px-2 py-1 cursor-pointer focus:outline-none focus:border-amber-400"
                >
                  {REGIONS_DATA.filter((r) => r.id !== region.id).map((r) => (
                    <option key={r.id} value={r.id} className="bg-slate-900 text-white">
                      {isAr ? r.nameAr.split('|')[0].trim() : r.nameEn.split('|')[0].trim()}
                    </option>
                  ))}
                </select>

                <div className="text-[11px] font-mono text-slate-300 mt-1 flex items-center gap-2">
                  <span className="text-amber-300 font-semibold">NDVI: {secondaryActiveScene.ndviMean.toFixed(3)}</span>
                  <span className="text-slate-500">·</span>
                  <span>{secondaryActiveScene.cultivatedHectares.toLocaleString()} ha</span>
                </div>
              </div>

              {/* Secondary Region Parcels */}
              <div className="absolute inset-0 pointer-events-none z-15">
                {secondaryParcels.map((parcel, idx) => (
                  <div
                    key={parcel.id}
                    className="absolute pointer-events-auto transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20"
                    style={{ top: `${35 + idx * 24}%`, left: `${30 + idx * 25}%` }}
                  >
                    <div className="w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 bg-slate-900/90 text-amber-300 border-amber-400">
                      <TreeDeciduous className="w-3 h-3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : viewMode === 'temporal_swipe' ? (
          /* MODE B: TEMPORAL BEFORE / AFTER SWIPE SLIDER */
          <>
            {/* Left Layer: Past Historical Baseline (e.g. 1988) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{
                clipPath: isAr 
                  ? `polygon(0 0, ${100 - splitPosition}% 0, ${100 - splitPosition}% 100%, 0 100%)` 
                  : `polygon(0 0, ${splitPosition}% 0, ${splitPosition}% 100%, 0 100%)`,
              }}
            >
              <img
                src={primaryImage}
                alt="Historical Satellite Baseline"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transform scale-105 transition-all duration-300"
                style={{
                  filter: getSpectralFilterStyle(spectralBand, true),
                  opacity: region.id === 'adrar_sahara' ? 0.75 : 0.85,
                }}
              />
              {region.id === 'adrar_sahara' && (
                <div 
                  className="absolute inset-0 bg-[#d4a373]/35 mix-blend-color"
                  title="Historical Arid Desert Baseline (1988)"
                />
              )}
            </div>

            {/* Right Layer: Current Observation (e.g. 2026) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{
                clipPath: isAr
                  ? `polygon(${100 - splitPosition}% 0, 100% 0, 100% 100%, ${100 - splitPosition}% 100%)`
                  : `polygon(${splitPosition}% 0, 100% 0, 100% 100%, ${splitPosition}% 100%)`,
              }}
            >
              <img
                src={primaryImage}
                alt="Current Satellite Observation"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transform scale-105 transition-all duration-300"
                style={{
                  filter: getSpectralFilterStyle(spectralBand, false),
                }}
              />
            </div>

            {/* Draggable Split Divider Line & Handle */}
            <div
              onMouseDown={(e) => {
                e.stopPropagation();
                setIsDraggingSplit(true);
              }}
              className="absolute top-0 bottom-0 w-1 bg-emerald-400 cursor-ew-resize z-20 shadow-lg shadow-emerald-500/50"
              style={{
                left: isAr ? `${100 - splitPosition}%` : `${splitPosition}%`,
                transform: 'translateX(-50%)',
              }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 left-1/2 w-8 h-8 rounded-full bg-slate-900 border-2 border-emerald-400 flex items-center justify-center text-emerald-300 shadow-xl cursor-ew-resize">
                <Split className="w-4 h-4" />
              </div>

              <div className={`absolute top-4 ${isAr ? 'right-3' : 'left-3'} px-2 py-1 rounded bg-slate-950/80 border border-slate-700/80 text-[11px] font-mono text-amber-300 whitespace-nowrap shadow-md`}>
                {baselineScene.year} ({baselineScene.mission.split(' ')[0]})
              </div>
              <div className={`absolute top-4 ${isAr ? 'left-3' : 'right-3'} px-2 py-1 rounded bg-slate-950/80 border border-slate-700/80 text-[11px] font-mono text-emerald-300 whitespace-nowrap shadow-md`}>
                {currentYear} ({activeScene.mission.split(' ')[0]})
              </div>
            </div>

            {/* Primary Region Parcels */}
            <div className="absolute inset-0 pointer-events-none z-15">
              {regionParcels.map((parcel, idx) => {
                const isSelected = selectedParcel?.id === parcel.id;
                const topPct = 28 + (idx * 22) + (idx === 1 ? -6 : 4);
                const leftPct = 32 + (idx * 20) + (idx === 0 ? 12 : -8);

                return (
                  <div
                    key={parcel.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectParcel(isSelected ? null : parcel);
                    }}
                    className={`absolute pointer-events-auto transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-110 ${
                      isSelected ? 'scale-125 z-30' : 'z-20'
                    }`}
                    style={{ top: `${topPct}%`, left: `${leftPct}%` }}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shadow-lg border-2 transition-all ${
                        isSelected
                          ? 'bg-emerald-500 text-white border-white ring-4 ring-emerald-500/40'
                          : 'bg-slate-900/90 text-emerald-300 border-emerald-400 hover:border-white'
                      }`}
                    >
                      <TreeDeciduous className="w-3.5 h-3.5" />
                    </div>
                    
                    <div className="mt-1 px-1.5 py-0.5 rounded bg-slate-950/85 border border-slate-800 text-[10px] font-mono text-slate-200 whitespace-nowrap text-center shadow">
                      {isAr ? parcel.parcelNameAr.split('-')[0].trim() : parcel.parcelNameEn.split('-')[0].trim()}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          /* MODE C: SINGLE FULL VIEW */
          <div className="absolute inset-0">
            <img
              src={primaryImage}
              alt="Satellite Scene"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transform scale-105 transition-all duration-300"
              style={{
                filter: getSpectralFilterStyle(spectralBand, currentYear < 2010),
              }}
            />
          </div>
        )}

        {/* Drawn AOI Vector Polygons */}
        {aoiPolygon.length > 0 && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-18">
            <polygon
              points={aoiPolygon.map((p) => `${p.x},${p.y}`).join(' ')}
              fill="rgba(16, 185, 129, 0.2)"
              stroke="#10b981"
              strokeWidth="2"
              strokeDasharray={isDrawingAoi ? '4 4' : 'none'}
            />
            {aoiPolygon.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="4" fill="#34d399" />
            ))}
          </svg>
        )}
      </div>

      {/* 2. Top-Center Comparative Trend HUD (Shown in Dual Regions mode) */}
      {viewMode === 'dual_regions' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-slate-950/95 backdrop-blur-md rounded-xl border border-slate-700/80 p-3 shadow-2xl max-w-lg w-full mx-4">
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800 text-xs">
            <span className="font-bold text-white flex items-center gap-1.5">
              <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isAr ? 'المقارنة المتزامنة لمؤشر NDVI وتطور المساحات' : 'Simultaneous NDVI Trend Comparison'}</span>
            </span>
            <span className="font-mono text-[11px] text-slate-400">{currentYear}</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
            {/* Region A */}
            <div className="bg-slate-900/80 p-2 rounded border border-emerald-500/30">
              <div className="text-[10px] text-emerald-400 truncate">
                {isAr ? region.nameAr.split('|')[0].trim() : region.nameEn.split('|')[0].trim()}
              </div>
              <div className="text-base font-bold text-white tabular-nums">
                {activeScene.ndviMean.toFixed(3)}
              </div>
              <div className="text-[10px] text-slate-400">
                {activeScene.cultivatedHectares.toLocaleString()} ha
              </div>
            </div>

            {/* Delta */}
            <div className="bg-slate-900/50 p-2 rounded border border-slate-800 flex flex-col justify-center">
              <div className="text-[10px] text-slate-400">{isAr ? 'الفارق الصافي Δ' : 'Net Delta Δ'}</div>
              <div className={`text-sm font-bold tabular-nums ${deltaNdvi >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {deltaNdvi >= 0 ? '+' : ''}{deltaNdvi}
              </div>
              <div className="text-[10px] text-slate-500 tabular-nums">
                {deltaAcreage >= 0 ? '+' : ''}{deltaAcreage.toLocaleString()} ha
              </div>
            </div>

            {/* Region B */}
            <div className="bg-slate-900/80 p-2 rounded border border-amber-500/30">
              <div className="text-[10px] text-amber-400 truncate">
                {isAr ? secondaryRegion.nameAr.split('|')[0].trim() : secondaryRegion.nameEn.split('|')[0].trim()}
              </div>
              <div className="text-base font-bold text-white tabular-nums">
                {secondaryActiveScene.ndviMean.toFixed(3)}
              </div>
              <div className="text-[10px] text-slate-400">
                {secondaryActiveScene.cultivatedHectares.toLocaleString()} ha
              </div>
            </div>
          </div>

          {/* Mini Comparative Sparkline */}
          <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between">
            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-0.5 bg-emerald-400 inline-block" />
                <span className="text-emerald-300">أ ({region.id.substring(0, 3)})</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-0.5 bg-amber-400 inline-block" />
                <span className="text-amber-300">ب ({secondaryRegion.id.substring(0, 3)})</span>
              </span>
            </div>

            <svg className="w-40 h-8" viewBox="0 0 180 50">
              {/* Region A Polyline */}
              <polyline
                points={regionASparkPoints.join(' ')}
                fill="none"
                stroke="#34d399"
                strokeWidth="2"
              />
              {/* Region B Polyline */}
              <polyline
                points={regionBSparkPoints.join(' ')}
                fill="none"
                stroke="#fbbf24"
                strokeWidth="2"
                strokeDasharray="3 3"
              />
            </svg>
          </div>
        </div>
      )}

      {/* 3. Floating Left Controls: Spectral Band Selector (Only shown if space allows or collapsible) */}
      <div className={`absolute ${viewMode === 'dual_regions' ? 'bottom-16 start-4' : 'top-4 start-4'} z-30 flex flex-col gap-2 max-w-xs transition-all`}>
        <div className="bg-slate-950/90 backdrop-blur-md rounded-lg border border-slate-800 p-2 shadow-xl">
          <div className="text-[11px] font-medium text-slate-400 mb-1.5 flex items-center gap-1.5 px-1">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isAr ? 'التركيب الطيفي للقمر الصناعي' : 'Multispectral Composite'}</span>
          </div>
          <div className="grid grid-cols-2 gap-1 text-xs">
            <button
              onClick={() => setSpectralBand('natural')}
              className={`px-2 py-1.5 rounded text-start font-mono transition-colors cursor-pointer ${
                spectralBand === 'natural' ? 'bg-emerald-600 text-white font-medium' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              {isAr ? 'طبيعي (RGB)' : 'Natural (RGB)'}
            </button>
            <button
              onClick={() => setSpectralBand('cir')}
              className={`px-2 py-1.5 rounded text-start font-mono transition-colors cursor-pointer ${
                spectralBand === 'cir' ? 'bg-emerald-600 text-white font-medium' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              {isAr ? 'تحت الأحمر (CIR)' : 'Infrared (CIR)'}
            </button>
            <button
              onClick={() => setSpectralBand('agriculture')}
              className={`px-2 py-1.5 rounded text-start font-mono transition-colors cursor-pointer ${
                spectralBand === 'agriculture' ? 'bg-emerald-600 text-white font-medium' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              {isAr ? 'الزراعة ورطوبة SWIR' : 'Agri & SWIR'}
            </button>
            <button
              onClick={() => setSpectralBand('ndvi')}
              className={`px-2 py-1.5 rounded text-start font-mono transition-colors cursor-pointer ${
                spectralBand === 'ndvi' ? 'bg-emerald-600 text-white font-medium' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              {isAr ? 'حراري NDVI' : 'NDVI Heatmap'}
            </button>
            <button
              onClick={() => setSpectralBand('ndwi')}
              className={`px-2 py-1.5 rounded text-start font-mono transition-colors cursor-pointer ${
                spectralBand === 'ndwi' ? 'bg-emerald-600 text-white font-medium' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              {isAr ? 'مؤشر المياه NDWI' : 'NDWI Water'}
            </button>
            <button
              onClick={() => setSpectralBand('dark_drought')}
              className={`px-2 py-1.5 rounded text-start font-mono transition-colors cursor-pointer ${
                spectralBand === 'dark_drought' ? 'bg-amber-600 text-white font-medium' : 'text-amber-300 hover:bg-slate-800'
              }`}
            >
              {isAr ? 'إنذار Dark-Drought' : 'Dark-Drought'}
            </button>
          </div>
        </div>

        {/* AOI Freehand Drawing Control (when in single or temporal swipe) */}
        {viewMode !== 'dual_regions' && (
          <div className="bg-slate-950/90 backdrop-blur-md rounded-lg border border-slate-800 p-2 shadow-xl flex items-center justify-between gap-2">
            <button
              onClick={() => setIsDrawingAoi(!isDrawingAoi)}
              className={`px-2.5 py-1.5 text-xs rounded font-medium flex items-center gap-1.5 cursor-pointer transition-colors ${
                isDrawingAoi ? 'bg-emerald-500 text-white' : 'text-slate-300 bg-slate-900 hover:bg-slate-800'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>{isDrawingAoi ? (isAr ? 'انقر لرسم مضلع' : 'Click to trace') : (isAr ? 'رسم قطعة أرض AOI' : 'Draw Parcel AOI')}</span>
            </button>

            {aoiPolygon.length > 0 && (
              <button
                onClick={handleResetAoi}
                title={isAr ? 'مسح التحديد' : 'Clear AOI'}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-900 rounded hover:bg-slate-800 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* 4. Top-Right Mode Switcher Toolbar */}
      <div className="absolute top-4 end-4 z-30 flex items-center gap-2">
        {/* Segmented View Mode Controls */}
        <div className="flex items-center gap-1 p-1 bg-slate-950/90 backdrop-blur-md rounded-lg border border-slate-800 shadow-xl">
          {/* Option 1: Dual Regions Side-by-Side */}
          <button
            onClick={() => setViewMode('dual_regions')}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'dual_regions'
                ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Columns2 className="w-3.5 h-3.5" />
            <span>{isAr ? 'مقارنة منطقتين (جنباً إلى جنب)' : 'Dual Regions'}</span>
          </button>

          {/* Option 2: Temporal Before/After Swipe Slider */}
          <button
            onClick={() => setViewMode('temporal_swipe')}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'temporal_swipe'
                ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Split className="w-3.5 h-3.5" />
            <span>{isAr ? 'شريط المقارنة الزمني' : 'Temporal Swipe'}</span>
          </button>
        </div>

        <button
          onClick={toggleFullscreen}
          title={isAr ? 'ملء الشاشة' : 'Toggle Fullscreen'}
          className="p-2 text-slate-300 bg-slate-950/90 border border-slate-800 rounded-lg hover:text-white hover:bg-slate-900 cursor-pointer shadow-lg"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* 5. Bottom Coordinates & Telemetry Crosshair Ribbon */}
      <div className="absolute bottom-4 start-4 z-30 flex items-center gap-3 bg-slate-950/90 backdrop-blur-md px-3.5 py-2 rounded-lg border border-slate-800/80 font-mono text-xs text-slate-300 shadow-xl">
        <div className="flex items-center gap-1.5 text-emerald-400">
          <Crosshair className="w-3.5 h-3.5" />
          <span>
            {mouseCoords 
              ? `${mouseCoords.lat.toFixed(4)}°N, ${mouseCoords.lng.toFixed(4)}°E`
              : `${region.coordinates.lat.toFixed(4)}°N, ${region.coordinates.lng.toFixed(4)}°E`}
          </span>
        </div>
        <span aria-hidden="true" className="text-slate-600">·</span>
        <span className="text-slate-400">
          {viewMode === 'dual_regions' 
            ? (isAr ? `مقارنة: ${region.wilayaAr} ↔ ${secondaryRegion.wilayaAr}` : `Compare: ${region.wilayaEn} ↔ ${secondaryRegion.wilayaEn}`)
            : (isAr ? `دقة المستشعر: ${activeScene.resolutionMeters}م` : `Spatial Res: ${activeScene.resolutionMeters}m`)}
        </span>
      </div>

      {/* 6. Spectral Color Ramp Legend Overlay */}
      <div className="absolute bottom-4 end-4 z-30 bg-slate-950/90 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-800/80 text-xs shadow-xl font-mono">
        <div className="text-[10px] text-slate-400 mb-1 flex items-center justify-between">
          <span>{spectralBand === 'ndwi' ? 'NDWI (-1.0 -> +1.0)' : 'NDVI (0.0 -> 0.8)'}</span>
          <span className="text-emerald-400">{spectralBand.toUpperCase()}</span>
        </div>
        <div className="w-44 h-2.5 rounded-sm overflow-hidden flex">
          {spectralBand === 'ndwi' ? (
            <>
              <div className="flex-1 bg-[#b08968]" title="Dry Soil" />
              <div className="flex-1 bg-[#94d2bd]" title="Moist" />
              <div className="flex-1 bg-[#0a9396]" title="Shallow Water" />
              <div className="flex-1 bg-[#0077b6]" title="Water Basin" />
              <div className="flex-1 bg-[#03045e]" title="Deep Reservoir" />
            </>
          ) : (
            <>
              <div className="flex-1 bg-[#d4a373]" title="Desert Sand" />
              <div className="flex-1 bg-[#e9d8a6]" title="Sparse Scrub" />
              <div className="flex-1 bg-[#c4d79b]" title="Steppe Grass" />
              <div className="flex-1 bg-[#70a95f]" title="Moderate Crop" />
              <div className="flex-1 bg-[#3b8b40]" title="Dense Pivot" />
              <div className="flex-1 bg-[#1b5e20]" title="Lush Date Palms" />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
