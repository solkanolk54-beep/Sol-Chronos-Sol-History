/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SpectralBand = 'natural' | 'cir' | 'agriculture' | 'ndvi' | 'ndwi' | 'dark_drought';

export type Language = 'ar' | 'en';

export interface GeoCoordinate {
  lat: number;
  lng: number;
}

export interface SatelliteScene {
  id: string;
  year: number;
  date: string;
  mission: 'Landsat 4-5 TM' | 'Landsat 7 ETM+' | 'Landsat 8-9 OLI' | 'Sentinel-2 MSI' | 'MODIS Terra';
  cloudCoverPercent: number;
  resolutionMeters: number;
  ndviMean: number;
  ndwiMean: number;
  bareSoilIndex: number;
  darkDroughtStressScore: number; // 0 (healthy) - 100 (critical stress)
  waterSurfaceHectares: number;
  cultivatedHectares: number;
  soilMoisturePercent: number;
  notesAr: string;
  notesEn: string;
}

export interface RegionHotspot {
  id: string;
  nameAr: string;
  nameEn: string;
  wilayaAr: string;
  wilayaEn: string;
  category: 'sahara_agriculture' | 'steppe_barrage_vert' | 'wetland_aquifer' | 'oasis_palms' | 'transboundary_africa';
  coordinates: GeoCoordinate;
  zoom: number;
  bounds: [[number, number], [number, number]];
  descriptionAr: string;
  descriptionEn: string;
  keyChallengesAr: string[];
  keyChallengesEn: string[];
  historicalYears: number[];
  scenes: SatelliteScene[];
  imageSrc?: string;
  baselinePeriod: string;
  albianAquiferDepthMeters?: number;
  sovereignHash: string;
}

export interface ParcelInspection {
  id: string;
  parcelNameAr: string;
  parcelNameEn: string;
  regionId: string;
  lat: number;
  lng: number;
  areaHectares: number;
  cropTypeAr: string;
  cropTypeEn: string;
  irrigationTypeAr: string;
  irrigationTypeEn: string;
  currentNdvi: number;
  baselineNdvi: number;
  ndviTrendPercent: number;
  darkDroughtRisk: 'low' | 'moderate' | 'elevated' | 'severe';
  rootZoneMoistureScore: number;
  anomaliesDetected: number;
}

export interface IngestionJob {
  jobId: string;
  source: 'USGS EarthExplorer' | 'Copernicus Data Space' | 'Landsat C2 SR' | 'ASAL AlSat Archive';
  granuleId: string;
  targetRegion: string;
  acquisitionDate: string;
  status: 'indexed' | 'processing' | 'postgis_loaded' | 'cog_pyramided';
  postgisTable: string;
  rasterBands: string;
  compressedSizeMb: number;
  sha256Hash: string;
}

export interface PostGisQuerySnippet {
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  sql: string;
  executionTimeMs: number;
  estimatedRows: number;
}

export interface OfflineCacheStats {
  cachedScenesCount: number;
  storageUsedMb: number;
  maxStorageMb: number;
  lastSyncTimestamp: string;
  pendingSyncDeltas: number;
  lowBandwidthModeActive: boolean;
  regionsAvailableOffline: string[];
}
