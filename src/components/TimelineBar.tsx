/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, FastForward, Clock } from 'lucide-react';
import { RegionHotspot, SatelliteScene, Language } from '../types';

interface TimelineBarProps {
  region: RegionHotspot;
  currentYear: number;
  onSelectYear: (year: number) => void;
  activeScene: SatelliteScene;
  language: Language;
}

export const TimelineBar: React.FC<TimelineBarProps> = ({
  region,
  currentYear,
  onSelectYear,
  activeScene,
  language,
}) => {
  const isAr = language === 'ar';
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playSpeed, setPlaySpeed] = useState<number>(1); // 1x, 2x, 0.5x

  const availableYears = region.historicalYears;
  const currentIndex = availableYears.indexOf(currentYear);

  // Time-lapse auto-play loop
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying) {
      const delayMs = Math.round(1800 / playSpeed);
      interval = setInterval(() => {
        const nextIdx = (currentIndex + 1) % availableYears.length;
        onSelectYear(availableYears[nextIdx]);
      }, delayMs);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, currentIndex, availableYears, playSpeed, onSelectYear]);

  const handleStepPrev = () => {
    const prevIdx = (currentIndex - 1 + availableYears.length) % availableYears.length;
    onSelectYear(availableYears[prevIdx]);
  };

  const handleStepNext = () => {
    const nextIdx = (currentIndex + 1) % availableYears.length;
    onSelectYear(availableYears[nextIdx]);
  };

  return (
    <div className="bg-[#0a0f18] border-b border-slate-800 px-6 py-3.5">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Playback Controls Cluster */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleStepPrev}
            title={isAr ? 'العام السابق' : 'Previous Year'}
            className="p-2 text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-4 py-2 rounded-lg font-medium text-xs flex items-center gap-2 transition-colors cursor-pointer ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-sm shadow-amber-900/40'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-900/40'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
            <span>{isPlaying ? (isAr ? 'إيقاف مؤقت' : 'Pause') : (isAr ? 'تشغيل السلسلة الزمنية' : 'Play Time-Lapse')}</span>
          </button>

          <button
            onClick={handleStepNext}
            title={isAr ? 'العام التالي' : 'Next Year'}
            className="p-2 text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Speed Toggle */}
          <button
            onClick={() => {
              if (playSpeed === 1) setPlaySpeed(2);
              else if (playSpeed === 2) setPlaySpeed(0.5);
              else setPlaySpeed(1);
            }}
            className="px-2 py-1.5 text-xs font-mono text-slate-400 bg-slate-900 border border-slate-800 rounded-lg hover:text-slate-200 transition-colors"
          >
            {playSpeed}x
          </button>
        </div>

        {/* 40-Year Timeline Rail with Discrete Milestones */}
        <div className="flex-1 w-full max-w-2xl px-2">
          <div className="relative flex items-center justify-between">
            {/* Background Track Line */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-800 -translate-y-1/2 z-0" />

            {/* Active Track Highlight */}
            <div
              className="absolute top-1/2 left-0 h-0.5 bg-emerald-500 -translate-y-1/2 z-0 transition-all duration-300"
              style={{
                width: `${(currentIndex / (availableYears.length - 1)) * 100}%`,
              }}
            />

            {/* Individual Year Markers */}
            {availableYears.map((year, idx) => {
              const isActive = year === currentYear;
              const isPast = year < currentYear;

              return (
                <button
                  key={year}
                  onClick={() => onSelectYear(year)}
                  className="relative z-10 flex flex-col items-center group cursor-pointer"
                >
                  {/* Point Indicator */}
                  <div
                    className={`w-4 h-4 rounded-full transition-all duration-200 flex items-center justify-center border-2 ${
                      isActive
                        ? 'bg-emerald-400 border-white ring-4 ring-emerald-500/30 scale-125'
                        : isPast
                        ? 'bg-emerald-700 border-slate-900'
                        : 'bg-slate-900 border-slate-700 hover:border-slate-500'
                    }`}
                  />

                  {/* Year Label */}
                  <span
                    className={`mt-1.5 text-xs font-mono transition-colors ${
                      isActive
                        ? 'text-emerald-400 font-bold'
                        : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  >
                    {year}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Scene Metadata Summary */}
        <div className="text-xs text-slate-300 font-mono flex items-center gap-3 shrink-0 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
          <span className="text-emerald-400 font-semibold">{currentYear}</span>
          <span aria-hidden="true" className="text-slate-600">/</span>
          <span>{activeScene.date}</span>
          <span aria-hidden="true" className="text-slate-600">/</span>
          <span className="text-slate-400">{activeScene.mission}</span>
        </div>
      </div>

      {/* Historical Context Text for Selected Year */}
      <div className="mt-2.5 pt-2 border-t border-slate-800/60 text-xs text-slate-400 flex items-center gap-2">
        <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        <span>
          {isAr ? activeScene.notesAr : activeScene.notesEn}
        </span>
      </div>
    </div>
  );
};
