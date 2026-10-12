/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Database, 
  Terminal, 
  Play, 
  CheckCircle2, 
  Clock, 
  Server, 
  Copy, 
  Check, 
  FileCode, 
  Layers,
  HardDrive
} from 'lucide-react';
import { INGESTION_JOBS, POSTGIS_QUERIES } from '../data/regionsData';
import { PostGisQuerySnippet, Language } from '../types';

interface PostGisTerminalModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const PostGisTerminalModal: React.FC<PostGisTerminalModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  const isAr = language === 'ar';
  const [selectedQuery, setSelectedQuery] = useState<PostGisQuerySnippet>(POSTGIS_QUERIES[0]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [queryOutput, setQueryOutput] = useState<{ executed: boolean; ms: number; rows: number } | null>(null);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleRunQuery = () => {
    setIsRunning(true);
    setQueryOutput(null);
    setTimeout(() => {
      setIsRunning(false);
      setQueryOutput({
        executed: true,
        ms: selectedQuery.executionTimeMs,
        rows: selectedQuery.estimatedRows,
      });
    }, 450);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedQuery.sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0b101a] border border-slate-800 rounded-xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#080d15] border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-950/60 border border-emerald-500/40 rounded-lg text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>{isAr ? 'معمل PostGIS وخط الأنابيب الآلي' : 'PostGIS Raster Lab & Ingestion Engine'}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-400 font-mono">
                  v3.4-POSTGIS
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {isAr ? 'معالجة وتخزين GeoTIFF و WMS/WFS وسلاسل Landsat و Sentinel التاريخية' : 'Automated GeoTIFF Raster Pyramids, Cloud-Optimized GeoTIFF & WMS/WFS Endpoints'}
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          {/* Section 1: Ingestion Pipeline Jobs */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-400" />
                <span>{isAr ? 'حالة خط الأنابيب المؤتمت لجلب ومعالجة الصور (Ingestion Pipeline)' : 'Automated Ingestion Pipeline Status'}</span>
              </h3>
              <span className="text-slate-400 font-mono text-[11px]">
                {isAr ? '4 عمليات معالجة نشطة' : '4 Active Pipelines'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {INGESTION_JOBS.map((job) => (
                <div key={job.jobId} className="bg-slate-950/80 border border-slate-800/90 rounded-lg p-3.5 space-y-2 font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-400 font-bold">{job.jobId}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-900 text-slate-300 border border-slate-800">
                      {job.status}
                    </span>
                  </div>

                  <div className="text-slate-200 font-sans text-xs font-medium">
                    {job.targetRegion}
                  </div>

                  <div className="text-[11px] text-slate-400 space-y-0.5">
                    <div>{isAr ? 'المصدر:' : 'Source:'} {job.source} ({job.acquisitionDate})</div>
                    <div className="truncate">{isAr ? 'الجدول:' : 'Table:'} {job.postgisTable}</div>
                    <div className="text-slate-500 truncate">SHA256: {job.sha256Hash}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: PostGIS SQL Query Playground */}
          <div className="border-t border-slate-800 pt-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>{isAr ? 'محرك استعلامات الجبر الطيفي (PostGIS ST_MapAlgebra & WMS)' : 'PostGIS Spectral Algebra Query Lab'}</span>
              </h3>
            </div>

            {/* Query Selector Tabs */}
            <div className="flex flex-wrap gap-2 mb-3">
              {POSTGIS_QUERIES.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedQuery(q);
                    setQueryOutput(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer border ${
                    selectedQuery.titleEn === q.titleEn
                      ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300 font-semibold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {isAr ? q.titleAr.split('عبر')[0].trim() : q.titleEn.split('via')[0].trim()}
                </button>
              ))}
            </div>

            {/* SQL Code Box */}
            <div className="bg-[#05080e] border border-slate-800 rounded-lg p-4 font-mono text-xs relative">
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800/80 text-[11px] text-slate-400">
                <span>{isAr ? selectedQuery.descriptionAr : selectedQuery.descriptionEn}</span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ الاستعلام' : 'Copy SQL')}</span>
                </button>
              </div>

              <pre className="text-emerald-300 overflow-x-auto whitespace-pre leading-relaxed p-1">
                {selectedQuery.sql}
              </pre>

              {/* Action Bar */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <button
                  onClick={handleRunQuery}
                  disabled={isRunning}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg font-medium flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>{isRunning ? (isAr ? 'جارِ التنفيذ في PostGIS...' : 'Executing...') : (isAr ? 'تنفيذ الاستعلام' : 'Execute PostGIS Query')}</span>
                </button>

                {queryOutput && (
                  <div className="text-emerald-400 flex items-center gap-2 text-xs font-mono">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>
                      {isAr ? `اكتمل بنجاح في ${queryOutput.ms}ms (استرجاع ${queryOutput.rows} صفوف نقطية)` : `Completed in ${queryOutput.ms}ms (${queryOutput.rows} raster records)`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: WMS & COG Endpoints for Remote GIS Clients (QGIS, ArcGIS, Sol Mobile) */}
          <div className="border-t border-slate-800 pt-5">
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>{isAr ? 'نقاط بث الخرائط السيادية (WMS / WFS / COG Endpoints)' : 'Sovereign WMS / WFS / COG Endpoints'}</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[11px]">
              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <div className="text-slate-400 mb-1">WMS Service URL (EPSG:4326):</div>
                <div className="text-emerald-400 select-all truncate">
                  https://sol-geo.ecosystem.dz/geoserver/wms?service=WMS&version=1.3.0
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <div className="text-slate-400 mb-1">Cloud-Optimized GeoTIFF (COG Bucket):</div>
                <div className="text-emerald-400 select-all truncate">
                  s3://sol-chronos-sovereign-vault/algeria_rasters_c2/2026/adrar_s2_10m.tif
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
