/**
 * PDF Generator for Speaker Dashboard
 * Generates a PDF with Timepulse branding and event information
 */

interface Entry {
  id: string;
  first_name: string;
  last_name: string;
  bib_number: string;
  race_name: string;
  category: string;
  city: string;
  nationality: string;
  club: string;
  timepulse_index?: number;
  gender?: string;
  birth_date?: string;
}

interface EventInfo {
  name: string;
  city: string;
  start_date: string;
  end_date: string;
}

interface SpeakerInfo {
  speaker_name: string;
  organization_name?: string;
}

interface RaceStats {
  race_name: string;
  total: number;
  youngest_male?: { name: string; age: number };
  oldest_male?: { name: string; age: number };
  youngest_female?: { name: string; age: number };
  oldest_female?: { name: string; age: number };
}

function calculateAge(birthDate: string): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function calculateStatistics(entries: Entry[]) {
  // Gender percentage
  const maleCount = entries.filter(e => e.gender?.toLowerCase() === 'm' || e.gender?.toLowerCase() === 'male').length;
  const femaleCount = entries.filter(e => e.gender?.toLowerCase() === 'f' || e.gender?.toLowerCase() === 'female').length;
  const total = entries.length;
  const malePercent = total > 0 ? Math.round((maleCount / total) * 100) : 0;
  const femalePercent = total > 0 ? Math.round((femaleCount / total) * 100) : 0;

  // Top 5 nationalities
  const nationalityCounts: Record<string, number> = {};
  entries.forEach(e => {
    if (e.nationality) {
      nationalityCounts[e.nationality] = (nationalityCounts[e.nationality] || 0) + 1;
    }
  });
  const topNationalities = Object.entries(nationalityCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([nat, count]) => ({ nationality: nat, count }));

  // Top clubs
  const clubCounts: Record<string, number> = {};
  entries.forEach(e => {
    if (e.club) {
      clubCounts[e.club] = (clubCounts[e.club] || 0) + 1;
    }
  });
  const topClubs = Object.entries(clubCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([club, count]) => ({ club, count }));

  // Race statistics
  const raceGroups: Record<string, Entry[]> = {};
  entries.forEach(e => {
    if (!raceGroups[e.race_name]) {
      raceGroups[e.race_name] = [];
    }
    raceGroups[e.race_name].push(e);
  });

  const raceStats: RaceStats[] = Object.entries(raceGroups).map(([raceName, raceEntries]) => {
    const males = raceEntries.filter(e => e.gender?.toLowerCase() === 'm' || e.gender?.toLowerCase() === 'male');
    const females = raceEntries.filter(e => e.gender?.toLowerCase() === 'f' || e.gender?.toLowerCase() === 'female');

    const malesWithAge = males
      .map(e => ({ entry: e, age: calculateAge(e.birth_date || '') }))
      .filter(item => item.age !== null);

    const femalesWithAge = females
      .map(e => ({ entry: e, age: calculateAge(e.birth_date || '') }))
      .filter(item => item.age !== null);

    const youngest_male = malesWithAge.length > 0
      ? malesWithAge.reduce((min, item) => item.age! < min.age! ? item : min)
      : undefined;

    const oldest_male = malesWithAge.length > 0
      ? malesWithAge.reduce((max, item) => item.age! > max.age! ? item : max)
      : undefined;

    const youngest_female = femalesWithAge.length > 0
      ? femalesWithAge.reduce((min, item) => item.age! < min.age! ? item : min)
      : undefined;

    const oldest_female = femalesWithAge.length > 0
      ? femalesWithAge.reduce((max, item) => item.age! > max.age! ? item : max)
      : undefined;

    return {
      race_name: raceName,
      total: raceEntries.length,
      youngest_male: youngest_male ? { name: `${youngest_male.entry.first_name} ${youngest_male.entry.last_name}`, age: youngest_male.age! } : undefined,
      oldest_male: oldest_male ? { name: `${oldest_male.entry.first_name} ${oldest_male.entry.last_name}`, age: oldest_male.age! } : undefined,
      youngest_female: youngest_female ? { name: `${youngest_female.entry.first_name} ${youngest_female.entry.last_name}`, age: youngest_female.age! } : undefined,
      oldest_female: oldest_female ? { name: `${oldest_female.entry.first_name} ${oldest_female.entry.last_name}`, age: oldest_female.age! } : undefined,
    };
  });

  return {
    genderStats: { maleCount, femaleCount, malePercent, femalePercent },
    topNationalities,
    topClubs,
    raceStats,
  };
}

// Convert image to base64
async function imageToBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Cannot get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
}

export async function generatePDF(
  entries: Entry[],
  eventInfo: EventInfo,
  speakerInfo: SpeakerInfo,
  notes: Record<string, string>
): Promise<void> {
  const stats = calculateStatistics(entries);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Convert logo to base64
  let logoBase64 = '';
  try {
    const logoPath = 'time copy copy.png';
    const logoUrl = `${window.location.origin}/${logoPath.replace(/ /g, '%20')}`;
    logoBase64 = await imageToBase64(logoUrl);
  } catch (error) {
    console.error('Error loading logo:', error);
    // Fallback: use text logo
    logoBase64 = '';
  }

  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Veuillez autoriser les pop-ups pour générer le PDF');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Liste des Participants - ${eventInfo.name}</title>
      <style>
        @media print {
          @page {
            size: A4;
            margin: 15mm;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 10pt;
          line-height: 1.4;
          color: #1f2937;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          background: linear-gradient(135deg, #f43f5e 0%, #ec4899 100%);
          color: white;
          margin-bottom: 20px;
          border-radius: 8px;
        }

        .logo {
          height: 45px;
          width: auto;
          background: white;
          padding: 8px 20px;
          border-radius: 6px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .logo-text {
          font-size: 24pt;
          font-weight: bold;
          letter-spacing: -1px;
          background: white;
          padding: 8px 20px;
          border-radius: 6px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          color: #1e3a8a;
        }

        .logo-container {
          display: flex;
          align-items: center;
        }

        .event-info {
          text-align: right;
        }

        .event-info h1 {
          font-size: 18pt;
          font-weight: bold;
          margin-bottom: 5px;
        }

        .event-info p {
          font-size: 10pt;
          opacity: 0.95;
        }

        .meta-info {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin-bottom: 20px;
          padding: 15px;
          background: #f3f4f6;
          border-radius: 8px;
        }

        .meta-item strong {
          display: block;
          color: #6b7280;
          font-size: 8pt;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 3px;
        }

        .meta-item span {
          font-size: 11pt;
          font-weight: 600;
          color: #111827;
        }

        .stats-section {
          margin-bottom: 20px;
          page-break-inside: avoid;
        }

        .stats-section h2 {
          font-size: 14pt;
          color: #f43f5e;
          margin-bottom: 10px;
          border-bottom: 2px solid #f43f5e;
          padding-bottom: 5px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          margin-bottom: 15px;
        }

        .stat-card {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 6px;
          padding: 10px;
        }

        .stat-card h3 {
          font-size: 9pt;
          color: #991b1b;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .stat-card ul {
          list-style: none;
          font-size: 9pt;
        }

        .stat-card li {
          padding: 3px 0;
          color: #7f1d1d;
        }

        .stat-card li strong {
          color: #991b1b;
        }

        .gender-bar {
          display: flex;
          height: 30px;
          border-radius: 4px;
          overflow: hidden;
          margin-top: 8px;
        }

        .gender-bar-male {
          background: #3b82f6;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 8pt;
          font-weight: bold;
        }

        .gender-bar-female {
          background: #ec4899;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 8pt;
          font-weight: bold;
        }

        .race-stats {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 6px;
          padding: 10px;
          margin-bottom: 10px;
          page-break-inside: avoid;
        }

        .race-stats h4 {
          font-size: 10pt;
          color: #1e40af;
          margin-bottom: 8px;
        }

        .race-stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          font-size: 8pt;
        }

        .race-stat-item {
          padding: 4px;
          background: white;
          border-radius: 4px;
        }

        .race-stat-item strong {
          color: #1e40af;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }

        thead {
          background: #f43f5e;
          color: white;
        }

        th {
          padding: 10px 8px;
          text-align: left;
          font-size: 9pt;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        td {
          padding: 8px;
          border-bottom: 1px solid #e5e7eb;
          font-size: 9pt;
        }

        tbody tr:nth-child(even) {
          background: #f9fafb;
        }

        tbody tr:hover {
          background: #fef2f2;
        }

        .bib {
          font-weight: bold;
          color: #f43f5e;
          font-size: 11pt;
        }

        .index {
          background: #10b981;
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 8pt;
          display: inline-block;
        }

        .note-cell {
          background: #fff7ed;
          font-style: italic;
          color: #92400e;
          padding: 8px !important;
          border-left: 3px solid #f59e0b;
        }

        .footer {
          margin-top: 30px;
          padding-top: 15px;
          border-top: 2px solid #f43f5e;
          text-align: center;
          font-size: 8pt;
          color: #6b7280;
        }

        .page-break {
          page-break-after: always;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo-container">
          ${logoBase64 ? `<img src="${logoBase64}" alt="Timepulse" class="logo">` : '<div class="logo-text">TIMEPULSE</div>'}
        </div>
        <div class="event-info">
          <h1>${eventInfo.name}</h1>
          <p>${eventInfo.city} • ${formatDate(eventInfo.start_date)}</p>
        </div>
      </div>

      <div class="meta-info">
        <div class="meta-item">
          <strong>Speaker</strong>
          <span>${speakerInfo.speaker_name}</span>
        </div>
        <div class="meta-item">
          <strong>Participants</strong>
          <span>${entries.length}</span>
        </div>
        <div class="meta-item">
          <strong>Généré le</strong>
          <span>${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      <!-- Statistics Section -->
      <div class="stats-section">
        <h2>📊 Statistiques Globales</h2>

        <div class="stats-grid">
          <!-- Gender Stats -->
          <div class="stat-card">
            <h3>Répartition Homme / Femme</h3>
            <ul>
              <li>👨 <strong>Hommes:</strong> ${stats.genderStats.maleCount} (${stats.genderStats.malePercent}%)</li>
              <li>👩 <strong>Femmes:</strong> ${stats.genderStats.femaleCount} (${stats.genderStats.femalePercent}%)</li>
            </ul>
            <div class="gender-bar">
              <div class="gender-bar-male" style="width: ${stats.genderStats.malePercent}%">
                ${stats.genderStats.malePercent}%
              </div>
              <div class="gender-bar-female" style="width: ${stats.genderStats.femalePercent}%">
                ${stats.genderStats.femalePercent}%
              </div>
            </div>
          </div>

          <!-- Top Nationalities -->
          <div class="stat-card">
            <h3>🌍 Top 5 Nationalités</h3>
            <ul>
              ${stats.topNationalities.map((item, index) => `
                <li><strong>${index + 1}. ${item.nationality}:</strong> ${item.count} participant${item.count > 1 ? 's' : ''}</li>
              `).join('')}
              ${stats.topNationalities.length === 0 ? '<li>Aucune donnée</li>' : ''}
            </ul>
          </div>

          <!-- Top Clubs -->
          <div class="stat-card" style="grid-column: span 2;">
            <h3>🏃 Top 5 Clubs / Associations</h3>
            <ul style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 5px;">
              ${stats.topClubs.map((item, index) => `
                <li><strong>${index + 1}. ${item.club}:</strong> ${item.count} participant${item.count > 1 ? 's' : ''}</li>
              `).join('')}
              ${stats.topClubs.length === 0 ? '<li>Aucune donnée</li>' : ''}
            </ul>
          </div>
        </div>

        <!-- Race Stats -->
        <h2>🏁 Statistiques par Course</h2>
        ${stats.raceStats.map(race => `
          <div class="race-stats">
            <h4>${race.race_name} (${race.total} participants)</h4>
            <div class="race-stats-grid">
              ${race.youngest_male ? `
                <div class="race-stat-item">
                  <strong>👨 Plus jeune (H):</strong> ${race.youngest_male.name} (${race.youngest_male.age} ans)
                </div>
              ` : ''}
              ${race.oldest_male ? `
                <div class="race-stat-item">
                  <strong>👴 Plus âgé (H):</strong> ${race.oldest_male.name} (${race.oldest_male.age} ans)
                </div>
              ` : ''}
              ${race.youngest_female ? `
                <div class="race-stat-item">
                  <strong>👩 Plus jeune (F):</strong> ${race.youngest_female.name} (${race.youngest_female.age} ans)
                </div>
              ` : ''}
              ${race.oldest_female ? `
                <div class="race-stat-item">
                  <strong>👵 Plus âgée (F):</strong> ${race.oldest_female.name} (${race.oldest_female.age} ans)
                </div>
              ` : ''}
            </div>
          </div>
        `).join('')}
      </div>

      <div style="page-break-before: always;"></div>

      <!-- Participants Table -->
      <h2 style="font-size: 14pt; color: #f43f5e; margin-bottom: 10px; border-bottom: 2px solid #f43f5e; padding-bottom: 5px;">
        📋 Liste des Participants
      </h2>

      <table>
        <thead>
          <tr>
            <th>Dossard</th>
            <th>Nom & Prénom</th>
            <th>Course</th>
            <th>Catégorie</th>
            <th>Ville</th>
            <th>Nationalité</th>
            <th>Club</th>
            <th>Index</th>
          </tr>
        </thead>
        <tbody>
          ${entries.map((entry, index) => `
            <tr>
              <td><span class="bib">${entry.bib_number}</span></td>
              <td><strong>${entry.first_name} ${entry.last_name}</strong></td>
              <td>${entry.race_name}</td>
              <td>${entry.category}</td>
              <td>${entry.city || '-'}</td>
              <td>${entry.nationality || '-'}</td>
              <td>${entry.club || '-'}</td>
              <td>${entry.timepulse_index ? `<span class="index">${entry.timepulse_index}</span>` : '-'}</td>
            </tr>
            ${notes[entry.id] ? `
              <tr>
                <td colspan="8" class="note-cell">
                  📝 Note speaker : ${notes[entry.id]}
                </td>
              </tr>
            ` : ''}
            ${(index + 1) % 25 === 0 && index < entries.length - 1 ? '<tr class="page-break"></tr>' : ''}
          `).join('')}
        </tbody>
      </table>

      <div class="footer">
        <p>Document généré par Timepulse • www.timepulsesports.com • contact@timepulse.run</p>
        <p>Chronométrage professionnel et inscriptions en ligne pour événements sportifs</p>
      </div>

      <script>
        window.onload = function() {
          setTimeout(() => {
            window.print();
            // Uncomment to auto-close after printing
            // window.onafterprint = function() { window.close(); };
          }, 500);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
