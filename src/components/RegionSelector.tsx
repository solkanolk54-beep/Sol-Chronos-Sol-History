/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { REGIONS_DATA } from '../data/regionsData';
import { RegionHotspot, Language } from '../types';

interface RegionSelectorProps {
  selectedRegion: RegionHotspot;
  onSelectRegion: (region: RegionHotspot) => void;
  language: Language;
}

export const RegionSelector: React.FC<RegionSelectorProps> = ({
  selectedRegion,
  onSelectRegion,
  language,
}) => {
  const isAr = language === 'ar';

  return (
    <div className="bg-[#0c121d] border-b border-slate-800/80 px-6 py-2.5">
      <div className="flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
        {/* Interactive Segmented Filter Controls */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-lg border border-slate-800 shrink-0">
          {REGIONS_DATA.map((region) => {
            const isSelected = region.id === selectedRegion.id;
            return (
              <button
                key={region.id}
                onClick={() => onSelectRegion(region)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {isAr ? region.nameAr.split('|')[0].trim() : region.nameEn.split('|')[0].trim()}
              </button>
            );
          })}
        </div>

        {/* Clean Unboxed Metadata with Typographic Separators */}
        <div className="hidden md:flex items-center gap-3 text-xs text-slate-400 font-mono shrink-0">
          <span className="text-slate-300 font-sans">
            {isAr ? selectedRegion.wilayaAr : selectedRegion.wilayaEn}
          </span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>
            {selectedRegion.coordinates.lat.toFixed(3)}°N, {selectedRegion.coordinates.lng.toFixed(3)}°E
          </span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span className="text-emerald-400">
            {isAr ? `خط الأساس: ${selectedRegion.baselinePeriod}` : `Baseline: ${selectedRegion.baselinePeriod}`}
          </span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span className="text-slate-400">
            {selectedRegion.sovereignHash.substring(0, 16)}...
          </span>
        </div>
      </div>
    </div>
  );
};
