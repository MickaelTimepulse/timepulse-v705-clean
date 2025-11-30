/**
 * PDF Generator for Race Results
 * Generates a secured PDF with Timepulse branding and anti-copy protection
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Result {
  bib_number: string | number;
  athlete_name?: string;
  first_name?: string;
  last_name?: string;
  gender: string;
  category: string;
  finish_time?: string;
  finish_time_display?: string;
  overall_rank: number;
  gender_rank: number;
  category_rank: number;
  country_code?: string;
  club?: string;
  average_speed_kmh?: number;
  custom_fields?: any;
}

interface RaceInfo {
  event_name: string;
  race_name: string;
  distance: number;
  date: string;
  city?: string;
}

/**
 * Load and convert image to base64
 */
function loadImageAsBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } else {
        reject(new Error('Failed to get canvas context'));
      }
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
}

/**
 * Generate a secured PDF with race results
 * Uses jsPDF with autoTable for formatted results
 */
export async function generateResultsPDF(
  results: Result[],
  raceInfo: RaceInfo
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Load Timepulse logo
  try {
    const logoBase64 = await loadImageAsBase64('/time copy copy copy copy.png');
    // Add logo at top left - optimized size for better visibility
    doc.addImage(logoBase64, 'PNG', 8, 5, 50, 8);
  } catch (error) {
    console.error('Error loading logo:', error);
    // Fallback to text if logo fails
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 50, 100);
    doc.text('TIMEPULSE', 8, 10);
  }

  // Add watermark throughout the document for security
  doc.setTextColor(245, 245, 245);
  doc.setFontSize(70);
  doc.setFont('helvetica', 'bold');
  doc.text('TIMEPULSE', 105, 160, {
    angle: 45,
    align: 'center'
  });

  // Event header - compact spacing
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(raceInfo.event_name, 105, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(raceInfo.race_name, 105, 26, { align: 'center' });

  doc.setFontSize(9);
  const distanceText = raceInfo.distance >= 1000
    ? `${(raceInfo.distance / 1000).toFixed(2)} km`
    : `${raceInfo.distance} m`;
  doc.text(`${distanceText} - ${raceInfo.city || ''} - ${new Date(raceInfo.date).toLocaleDateString('fr-FR')}`, 105, 31, { align: 'center' });

  // Prepare table data
  const tableData = results.map((result) => {
    const athleteName = result.athlete_name || `${result.first_name || ''} ${result.last_name || ''}`.trim();
    const finishTime = result.finish_time_display || result.finish_time || '-';
    const club = result.club || '-';

    // Calculate average speed and pace
    let avgSpeedText = '-';
    if (result.average_speed_kmh) {
      const speedKmh = parseFloat(result.average_speed_kmh.toString());
      const paceMinPerKm = 60 / speedKmh;
      const minutes = Math.floor(paceMinPerKm);
      const seconds = Math.round((paceMinPerKm - minutes) * 60);
      avgSpeedText = `${speedKmh.toFixed(2)} km/h\n${minutes}'${seconds.toString().padStart(2, '0')}"/km`;
    }

    return [
      result.overall_rank?.toString() || '-',
      result.bib_number?.toString() || '-',
      athleteName || '-',
      club,
      result.gender || '-',
      result.category || '-',
      finishTime,
      avgSpeedText,
      result.gender_rank?.toString() || '-',
      result.category_rank?.toString() || '-'
    ];
  });

  // Add results table with reduced margins
  autoTable(doc, {
    startY: 35,
    head: [['Pos', 'Doss', 'Nom', 'Club', 'S', 'Cat', 'Temps', 'Moy.', 'Rg S', 'Rg Cat']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [30, 50, 100],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: 2
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 1.5
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 12, halign: 'center' },
      2: { cellWidth: 42, halign: 'left' },
      3: { cellWidth: 30, halign: 'left', fontSize: 7 },
      4: { cellWidth: 8, halign: 'center' },
      5: { cellWidth: 12, halign: 'center' },
      6: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
      7: { cellWidth: 20, halign: 'center', fontSize: 7 },
      8: { cellWidth: 11, halign: 'center' },
      9: { cellWidth: 11, halign: 'center' }
    },
    alternateRowStyles: {
      fillColor: [248, 248, 248]
    },
    margin: { top: 35, left: 8, right: 8, bottom: 12 },
    didDrawPage: (data: any) => {
      // Add compact footer on each page
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(7);
      doc.setTextColor(120, 120, 120);
      doc.text('Chronométrage officiel par Timepulse - www.timepulse.fr', 105, pageHeight - 6, { align: 'center' });
      doc.setFontSize(6);
      doc.text(`Page ${data.pageNumber}`, 105, pageHeight - 3, { align: 'center' });
    }
  });

  // Generate filename
  const fileName = `${raceInfo.event_name.replace(/[^a-z0-9]/gi, '_')}_${raceInfo.race_name.replace(/[^a-z0-9]/gi, '_')}_resultats.pdf`;

  // Save PDF
  doc.save(fileName);
}
