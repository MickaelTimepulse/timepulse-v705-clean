/**
 * Service d'export Excel pour les inscriptions
 * Génère des fichiers CSV (compatibles Excel) sans dépendances lourdes
 */

/**
 * Fonction helper pour télécharger un fichier de manière sécurisée
 * Évite les erreurs removeChild lors de la navigation rapide
 */
function safeDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();

  // Nettoyage différé pour éviter les erreurs de timing
  setTimeout(() => {
    try {
      if (link.parentNode === document.body) {
        document.body.removeChild(link);
      }
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error cleaning up download link:', err);
    }
  }, 100);
}

export interface ExportEntry {
  bibNumber: number;
  firstName: string;
  lastName: string;
  gender: string;
  birthDate: string;
  nationality: string;
  email: string;
  phone: string;
  category: string;
  raceName: string;
  price: number;
  status: string;
  registrationDate: string;
  licenseNumber?: string;
  club?: string;
  pspNumber?: string;
  pspExpiryDate?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
}

/**
 * Exporte les inscriptions au format CSV (Excel)
 */
export function exportToCSV(entries: ExportEntry[], filename: string = 'inscriptions.csv'): void {
  const headers = [
    'Dossard',
    'Nom',
    'Prénom',
    'Sexe',
    'Date de Naissance',
    'Nationalité',
    'Email',
    'Téléphone',
    'Catégorie',
    'Course',
    'Prix Payé',
    'Statut',
    'Date Inscription',
    'Numéro Licence',
    'Club',
    'Numéro PSP',
    'Date Expiration PSP',
    'Contact Urgence',
    'Téléphone Urgence',
  ];

  const rows = entries.map(entry => [
    entry.bibNumber,
    entry.lastName,
    entry.firstName,
    entry.gender,
    entry.birthDate,
    entry.nationality,
    entry.email,
    entry.phone,
    entry.category,
    entry.raceName,
    entry.price.toFixed(2),
    entry.status,
    new Date(entry.registrationDate).toLocaleDateString('fr-FR'),
    entry.licenseNumber || '',
    entry.club || '',
    entry.pspNumber || '',
    entry.pspExpiryDate ? new Date(entry.pspExpiryDate).toLocaleDateString('fr-FR') : '',
    entry.emergencyContact || '',
    entry.emergencyPhone || '',
  ]);

  const csvContent = [
    headers.join(';'), // Utiliser point-virgule pour Excel français
    ...rows.map(row => row.map(cell => `"${cell}"`).join(';')), // Entourer de guillemets pour gérer les virgules
  ].join('\n');

  // Ajouter BOM UTF-8 pour Excel
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

  // Télécharger de manière sécurisée
  safeDownload(blob, filename);
}

/**
 * Exporte au format spécifique Elogica (pour import dans le logiciel de chronométrage)
 */
export function exportToElogica(entries: ExportEntry[], filename: string = 'export-elogica.csv'): void {
  // Format Elogica: Dossard;Nom;Prénom;Sexe;DateNaissance;Club;Licence;Catégorie
  const headers = [
    'Dossard',
    'Nom',
    'Prénom',
    'Sexe',
    'DateNaissance',
    'Club',
    'Licence',
    'Catégorie',
  ];

  const rows = entries.map(entry => [
    entry.bibNumber,
    entry.lastName.toUpperCase(),
    entry.firstName.toUpperCase(),
    entry.gender,
    entry.birthDate.split('/').reverse().join(''), // Format YYYYMMDD pour Elogica
    entry.club || '',
    entry.licenseNumber || '',
    entry.category,
  ]);

  const csvContent = [
    headers.join(';'),
    ...rows.map(row => row.join(';')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  safeDownload(blob, filename);
}

/**
 * Exporte les statistiques globales
 */
export function exportStats(
  stats: {
    totalEntries: number;
    confirmedEntries: number;
    pendingEntries: number;
    totalRevenue: number;
    entriesByRace: Array<{ raceName: string; count: number }>;
    entriesByGender: Array<{ gender: string; count: number }>;
    entriesByCategory: Array<{ category: string; count: number }>;
  },
  filename: string = 'statistiques.csv'
): void {
  const lines: string[] = [];

  // En-tête
  lines.push('STATISTIQUES INSCRIPTIONS');
  lines.push('');

  // Statistiques générales
  lines.push('Statistiques Générales');
  lines.push(`Total inscriptions;${stats.totalEntries}`);
  lines.push(`Inscriptions confirmées;${stats.confirmedEntries}`);
  lines.push(`Inscriptions en attente;${stats.pendingEntries}`);
  lines.push(`Revenus totaux;${stats.totalRevenue.toFixed(2)} €`);
  lines.push(`Prix moyen;${(stats.totalRevenue / stats.confirmedEntries).toFixed(2)} €`);
  lines.push('');

  // Par course
  lines.push('Inscriptions par Course');
  lines.push('Course;Nombre');
  stats.entriesByRace.forEach(item => {
    lines.push(`${item.raceName};${item.count}`);
  });
  lines.push('');

  // Par genre
  lines.push('Inscriptions par Genre');
  lines.push('Genre;Nombre;Pourcentage');
  stats.entriesByGender.forEach((item: any) => {
    const percentage = ((item.count / stats.totalEntries) * 100).toFixed(1);
    lines.push(`${item.gender};${item.count};${percentage}%`);
  });
  lines.push('');

  // Par catégorie
  lines.push('Inscriptions par Catégorie');
  lines.push('Catégorie;Nombre');
  stats.entriesByCategory.forEach((item: any) => {
    lines.push(`${item.category};${item.count}`);
  });

  const csvContent = lines.join('\n');
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  safeDownload(blob, filename);
}

/**
 * Exporte les emails des inscrits (pour campagne newsletter)
 */
export function exportEmails(entries: ExportEntry[], filename: string = 'emails.csv'): void {
  const headers = ['Email', 'Prénom', 'Nom', 'Course'];

  const rows = entries
    .filter(entry => entry.email && entry.status === 'confirmed')
    .map(entry => [
      entry.email,
      entry.firstName,
      entry.lastName,
      entry.raceName,
    ]);

  const csvContent = [
    headers.join(';'),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(';')),
  ].join('\n');

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  safeDownload(blob, filename);
}

/**
 * Exporte au format JSON (pour backup ou intégration API)
 */
export function exportToJSON(entries: ExportEntry[], filename: string = 'inscriptions.json'): void {
  const jsonContent = JSON.stringify(entries, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  safeDownload(blob, filename);
}

/**
 * Génère un fichier pour les étiquettes de dossards
 * Format optimisé pour impression
 */
export function exportBibLabels(
  entries: ExportEntry[],
  filename: string = 'etiquettes-dossards.csv'
): void {
  const headers = ['Dossard', 'Nom Complet', 'Course', 'Catégorie'];

  const rows = entries
    .filter(entry => entry.status === 'confirmed')
    .sort((a, b) => a.bibNumber - b.bibNumber)
    .map(entry => [
      entry.bibNumber,
      `${entry.firstName} ${entry.lastName}`.toUpperCase(),
      entry.raceName,
      entry.category,
    ]);

  const csvContent = [
    headers.join(';'),
    ...rows.map(row => row.join(';')),
  ].join('\n');

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

  safeDownload(blob, filename);
}
