/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OfflineCacheStats } from '../types';

const STORAGE_KEY_SETTINGS = 'sol_chronos_settings_v1';
const STORAGE_KEY_OFFLINE_PACKS = 'sol_chronos_offline_packs_v1';
const STORAGE_KEY_PENDING_DELTAS = 'sol_chronos_pending_deltas_v1';

export function getOfflineStats(): OfflineCacheStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_OFFLINE_PACKS);
    const packs: string[] = raw ? JSON.parse(raw) : ['adrar_sahara', 'djelfa_steppe'];
    const pendingRaw = localStorage.getItem(STORAGE_KEY_PENDING_DELTAS);
    const pendingDeltas = pendingRaw ? JSON.parse(pendingRaw).length : 0;
    const settingsRaw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    const settings = settingsRaw ? JSON.parse(settingsRaw) : { lowBandwidth: false };

    return {
      cachedScenesCount: packs.length * 9,
      storageUsedMb: Number((packs.length * 28.4 + 12.3).toFixed(1)),
      maxStorageMb: 512,
      lastSyncTimestamp: new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' }),
      pendingSyncDeltas: pendingDeltas,
      lowBandwidthModeActive: settings.lowBandwidth || false,
      regionsAvailableOffline: packs,
    };
  } catch {
    return {
      cachedScenesCount: 18,
      storageUsedMb: 69.1,
      maxStorageMb: 512,
      lastSyncTimestamp: '10:45 ص',
      pendingSyncDeltas: 0,
      lowBandwidthModeActive: false,
      regionsAvailableOffline: ['adrar_sahara', 'djelfa_steppe'],
    };
  }
}

export function toggleLowBandwidthMode(current: boolean): boolean {
  try {
    const next = !current;
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    const settings = raw ? JSON.parse(raw) : {};
    settings.lowBandwidth = next;
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    return next;
  } catch {
    return !current;
  }
}

export function saveOfflineRegionPack(regionId: string): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_OFFLINE_PACKS);
    const packs: string[] = raw ? JSON.parse(raw) : [];
    if (!packs.includes(regionId)) {
      packs.push(regionId);
      localStorage.setItem(STORAGE_KEY_OFFLINE_PACKS, JSON.stringify(packs));
    }
    return true;
  } catch {
    return false;
  }
}

export function removeOfflineRegionPack(regionId: string): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_OFFLINE_PACKS);
    const packs: string[] = raw ? JSON.parse(raw) : [];
    const filtered = packs.filter((p) => p !== regionId);
    localStorage.setItem(STORAGE_KEY_OFFLINE_PACKS, JSON.stringify(filtered));
    return true;
  } catch {
    return false;
  }
}

export function queueOfflineSyncDelta(action: string, payload: unknown): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PENDING_DELTAS);
    const deltas = raw ? JSON.parse(raw) : [];
    deltas.push({
      id: Math.random().toString(36).substring(2, 9),
      action,
      payload,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem(STORAGE_KEY_PENDING_DELTAS, JSON.stringify(deltas));
  } catch {
    // Graceful fallback
  }
}

export function clearPendingSyncDeltas(): void {
  try {
    localStorage.setItem(STORAGE_KEY_PENDING_DELTAS, JSON.stringify([]));
  } catch {
    // Graceful fallback
  }
}
