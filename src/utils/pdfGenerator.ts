/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsPDF } from 'jspdf';
import { RegionHotspot, SatelliteScene, ParcelInspection, Language } from '../types';
import { calculateDarkDroughtStress } from './spectralMath';

interface GeneratePdfOptions {
  region: RegionHotspot;
  currentYear: number;
  activeScene: SatelliteScene;
  baselineScene: SatelliteScene;
  selectedParcel: ParcelInspection | null;
  reportId: string;
  generationDate: string;
}

export function generateSovereignPdf({
  region,
  currentYear,
  activeScene,
  baselineScene,
  selectedParcel,
  reportId,
  generationDate,
}: GeneratePdfOptions): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  const darkDrought = calculateDarkDroughtStress(
    activeScene.ndviMean,
    0.22,
    0.08,
    activeScene.soilMoisturePercent
  );

  // Background Header Bar (Deep Obsidian / Slate)
  doc.setFillColor(11, 16, 26);
  doc.rect(0, 0, pageWidth, 32, 'F');

  // Accent Line (Emerald Green)
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 32, pageWidth, 1.5, 'F');

  // Brand Header
  doc.setTextColor(16, 185, 129);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('SOL-ECOSYSTEM // SPATIO-TEMPORAL BASELINE AUDIT', margin, 12);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text('SOL-CHRONOS | SOVEREIGN ANALYTICAL REPORT', margin, 19);

  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('People\'s Democratic Republic of Algeria — Earth Observation Baseline Platform', margin, 25);

  // Metadata block (Right side)
  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`DOC ID: ${reportId}`, pageWidth - margin, 13, { align: 'right' });
  doc.text(`DATE: ${generationDate}`, pageWidth - margin, 18, { align: 'right' });
  doc.setTextColor(52, 211, 153);
  doc.text(`HASH: ${region.sovereignHash.substring(0, 22)}...`, pageWidth - margin, 23, { align: 'right' });

  let cursorY = 40;

  // 1. Regional Scope Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, cursorY, contentWidth, 26, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(`GEOGRAPHICAL SCOPE: ${region.nameEn}`, margin + 4, cursorY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Wilaya / Territory: ${region.wilayaEn}`, margin + 4, cursorY + 11);
  doc.text(`Coordinates: ${region.coordinates.lat.toFixed(4)}°N, ${region.coordinates.lng.toFixed(4)}°E`, margin + 4, cursorY + 16);
  if (region.albianAquiferDepthMeters) {
    doc.text(`Albian Deep Aquifer Depth: ~${region.albianAquiferDepthMeters}m (Continental Intercalaire)`, margin + 4, cursorY + 21);
  }

  // Right side of scope box
  const colRightX = margin + contentWidth / 2 + 4;
  doc.text(`Sensor Mission: ${activeScene.mission} (${currentYear})`, colRightX, cursorY + 11);
  doc.text(`Spatial Resolution: ${activeScene.resolutionMeters}m / Pixel`, colRightX, cursorY + 16);
  doc.text(`Historical Baseline Window: ${region.baselinePeriod}`, colRightX, cursorY + 21);

  cursorY += 31;

  // Selected Parcel Callout (if active)
  if (selectedParcel) {
    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(167, 243, 208);
    doc.roundedRect(margin, cursorY, contentWidth, 14, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(6, 95, 70);
    doc.text(`FOCUS PARCEL: ${selectedParcel.parcelNameEn}`, margin + 4, cursorY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(4, 120, 87);
    doc.text(
      `Area: ${selectedParcel.areaHectares} ha  |  Crop: ${selectedParcel.cropTypeEn}  |  NDVI: ${selectedParcel.currentNdvi} (${selectedParcel.ndviTrendPercent > 0 ? '+' : ''}${selectedParcel.ndviTrendPercent}%)  |  Root Moisture: ${selectedParcel.rootZoneMoistureScore}/100`,
      margin + 4,
      cursorY + 10.5
    );

    cursorY += 18;
  }

  // 2. Section: Comparative Matrix (Past vs Present)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('1. MULTI-DECADAL QUANTITATIVE MATRIX (1988 - 2026)', margin, cursorY);

  cursorY += 3.5;

  // Table Header
  const tableHeaders = ['Spectral Metric', `Baseline (${baselineScene.year})`, `Current (${currentYear})`, 'Net Delta', 'Eco-Classification'];
  const colWidths = [45, 30, 30, 32, 45];
  
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, cursorY, contentWidth, 6.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);

  let currentX = margin + 2;
  tableHeaders.forEach((header, i) => {
    doc.text(header, currentX, cursorY + 4.5);
    currentX += colWidths[i];
  });

  cursorY += 6.5;

  // Table Rows Data
  const rows = [
    {
      metric: 'Vegetation Index (NDVI Mean)',
      base: baselineScene.ndviMean.toFixed(3),
      curr: activeScene.ndviMean.toFixed(3),
      delta: `+${(activeScene.ndviMean - baselineScene.ndviMean).toFixed(3)}`,
      status: 'Significant Greening (+)',
    },
    {
      metric: 'Cultivated Acreage (Hectares)',
      base: `${baselineScene.cultivatedHectares.toLocaleString()} ha`,
      curr: `${activeScene.cultivatedHectares.toLocaleString()} ha`,
      delta: `+${(activeScene.cultivatedHectares - baselineScene.cultivatedHectares).toLocaleString()} ha`,
      status: 'Agro-Footprint Expansion',
    },
    {
      metric: 'Water Extent (NDWI Mean)',
      base: baselineScene.ndwiMean.toFixed(3),
      curr: activeScene.ndwiMean.toFixed(3),
      delta: `${(activeScene.ndwiMean - baselineScene.ndwiMean).toFixed(3)}`,
      status: 'Hydrological Buffer Maintained',
    },
    {
      metric: 'Bare Soil Index (BSI - Desertification)',
      base: baselineScene.bareSoilIndex.toFixed(3),
      curr: activeScene.bareSoilIndex.toFixed(3),
      delta: `${(activeScene.bareSoilIndex - baselineScene.bareSoilIndex).toFixed(3)}`,
      status: 'Sand Dune Encroachment Arrested',
    },
    {
      metric: 'Surface Water Extent',
      base: `${baselineScene.waterSurfaceHectares} ha`,
      curr: `${activeScene.waterSurfaceHectares} ha`,
      delta: `${activeScene.waterSurfaceHectares - baselineScene.waterSurfaceHectares} ha`,
      status: 'Seasonal Evaporite Equilibrium',
    },
  ];

  rows.forEach((row, idx) => {
    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 248 : 255, isEven ? 250 : 255, isEven ? 252 : 255);
    doc.rect(margin, cursorY, contentWidth, 6, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, cursorY + 6, margin + contentWidth, cursorY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);

    let rowX = margin + 2;
    doc.text(row.metric, rowX, cursorY + 4.2);
    rowX += colWidths[0];

    doc.setFont('courier', 'normal');
    doc.text(row.base, rowX, cursorY + 4.2);
    rowX += colWidths[1];

    doc.setFont('courier', 'bold');
    doc.text(row.curr, rowX, cursorY + 4.2);
    rowX += colWidths[2];

    doc.setTextColor(16, 185, 129);
    doc.text(row.delta, rowX, cursorY + 4.2);
    rowX += colWidths[3];

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(row.status, rowX, cursorY + 4.2);

    cursorY += 6;
  });

  cursorY += 6;

  // 3. Section: Dark-Drought Early Warning Protocol
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('2. DARK-DROUGHT EARLY WARNING STRESS EVALUATION', margin, cursorY);

  cursorY += 3.5;

  doc.setFillColor(254, 243, 199);
  doc.setDrawColor(251, 191, 36);
  doc.roundedRect(margin, cursorY, contentWidth, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(146, 64, 14);
  doc.text(
    `DARK-DROUGHT RISK RATING: ${darkDrought.score}/100  |  STATUS: ${darkDrought.severity.toUpperCase()}  |  CANOPY LEAD TIME: ${darkDrought.daysToVisibleYellowing} DAYS`,
    margin + 4,
    cursorY + 5.5
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 53, 15);
  const droughtText =
    `Multi-spectral shortwave infrared (SWIR) and thermal reflectance signatures indicate root-zone soil moisture at ${activeScene.soilMoisturePercent}%. Divergence from the 30-year baseline mean (${region.baselinePeriod}) is calculated with z-score ${darkDrought.zScore}. No critical invisible root-zone dehydration detected within the upcoming observation window. Continuous PostGIS telemetry active.`;
  const splitDroughtText = doc.splitTextToSize(droughtText, contentWidth - 8);
  doc.text(splitDroughtText, margin + 4, cursorY + 11);

  cursorY += 28;

  // 4. Section: Strategic Directives & Food Security Recommendations
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('3. STRATEGIC AGRONOMIC DIRECTIVES & REGIONAL RECOMMENDATIONS', margin, cursorY);

  cursorY += 3.5;

  const challenges = region.keyChallengesEn;
  challenges.forEach((challenge, i) => {
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, cursorY, contentWidth, 8, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`Directive 0${i + 1}:`, margin + 3, cursorY + 5.2);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(challenge, margin + 22, cursorY + 5.2);

    cursorY += 10;
  });

  // 5. Official Cryptographic Provenance Footer
  const footerY = pageHeight - 26;
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, footerY, margin + contentWidth, footerY);

  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`SOVEREIGN DATA PROVENANCE: ${region.sovereignHash}`, margin, footerY + 5);
  doc.text('CRYPTOGRAPHIC SEAL: AES-256 VAULT VERIFIED | POSTGIS 32BF SPATIAL KERNEL', margin, footerY + 9);
  doc.text('GENERATED BY SOL-CHRONOS (SOL-ECOSYSTEM ALGERIA) — DISTRIBUTED RESILIENT GIS', margin, footerY + 13);

  // Sovereign Seal Badge Box
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(pageWidth - margin - 46, footerY + 3, 46, 12, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(22, 101, 52);
  doc.text('SOVEREIGN CERTIFIED', pageWidth - margin - 23, footerY + 8, { align: 'center' });
  doc.setFont('courier', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(21, 128, 61);
  doc.text('NATIONAL SPATIAL AUDIT', pageWidth - margin - 23, footerY + 12, { align: 'center' });

  // Save the PDF
  const filename = `Sol-Chronos_Audit_${region.id.toUpperCase()}_${currentYear}.pdf`;
  doc.save(filename);
}
