/**
 * Service de parsing des fichiers de résultats
 * Supporte: Elogica, Excel, CSV
 */

export interface ParsedResult {
  bibNumber: number;
  athleteName: string;
  gender?: 'M' | 'F' | 'X';
  category?: string;
  finishTime?: string;
  gunTime?: string;
  netTime?: string;
  status: 'finished' | 'dnf' | 'dns' | 'dsq';
  splitTimes?: Array<{
    pointName: string;
    time: string;
    distance?: number;
  }>;
  customFields?: { [key: string]: any };
}

export interface ParseResult {
  results: ParsedResult[];
  errors: Array<{
    row: number;
    error: string;
  }>;
}

/**
 * Détecte les colonnes importantes dans le header CSV
 */
function detectColumns(header: string, separator: string): {
  bib: number;
  name: number;
  gender: number;
  year: number;
  category: number;
  time: number;
} {
  const columns = header.split(separator).map(col => col.trim().toLowerCase());

  const mapping = {
    bib: -1,
    name: -1,
    gender: -1,
    year: -1,
    category: -1,
    time: -1
  };

  columns.forEach((col, idx) => {
    if (col.includes('dos') || col.includes('doss') || col.includes('bib')) {
      mapping.bib = idx;
    } else if (col.includes('nom') || col.includes('prénom') || col.includes('name') || col.includes('athlete')) {
      mapping.name = idx;
    } else if (col.includes('sex') || col.includes('sx') || col.includes('genre')) {
      mapping.gender = idx;
    } else if (col.includes('année') || col.includes('annee') || col.includes('year') || col.includes('birth')) {
      mapping.year = idx;
    } else if (col.includes('cat') || col.includes('catégorie')) {
      mapping.category = idx;
    } else if (col.includes('temps') || col.includes('time') && !col.includes('mi-')) {
      mapping.time = idx;
    }
  });

  return mapping;
}

/**
 * Parse un fichier CSV standard avec détection automatique des colonnes
 */
export function parseCSV(content: string): ParseResult {
  const lines = content.split('\n').filter(line => line.trim());
  const results: ParsedResult[] = [];
  const errors: Array<{ row: number; error: string }> = [];

  if (lines.length < 2) {
    errors.push({ row: 0, error: 'Fichier vide ou invalide' });
    return { results, errors };
  }

  const separator = lines[0].includes('\t') ? '\t' : lines[0].includes(';') ? ';' : ',';
  const columnMapping = detectColumns(lines[0], separator);

  for (let i = 1; i < lines.length; i++) {
    try {
      const parts = lines[i].split(separator).map(p => p.trim());

      if (parts.length < 3) {
        continue;
      }

      const bibNumber = columnMapping.bib >= 0
        ? parseInt(parts[columnMapping.bib] || '0')
        : parseInt(parts[0] || '0');

      if (!bibNumber || bibNumber <= 0) {
        continue;
      }

      const athleteName = columnMapping.name >= 0
        ? parts[columnMapping.name] || ''
        : `${parts[2] || ''} ${parts[1] || ''}`.trim();

      if (!athleteName) {
        errors.push({ row: i + 1, error: 'Nom athlète manquant' });
        continue;
      }

      const gender = columnMapping.gender >= 0
        ? parts[columnMapping.gender]?.toUpperCase()
        : parts[3]?.toUpperCase();

      const category = columnMapping.category >= 0
        ? parts[columnMapping.category]
        : parts[4];

      const finishTime = columnMapping.time >= 0
        ? parts[columnMapping.time]
        : parts.find(p => /^\d{1,2}:\d{2}(:\d{2})?$/.test(p));

      let status: ParsedResult['status'] = 'finished';
      const statusStr = parts[parts.length - 1]?.toLowerCase();
      if (statusStr === 'dnf' || statusStr === 'abandon') status = 'dnf';
      else if (statusStr === 'dns' || statusStr === 'absent') status = 'dns';
      else if (statusStr === 'dsq' || statusStr === 'disqualifié') status = 'dsq';

      results.push({
        bibNumber,
        athleteName,
        gender: gender === 'M' || gender === 'F' || gender === 'H' ? (gender === 'H' ? 'M' : gender as 'M' | 'F') : undefined,
        category: category || undefined,
        finishTime: normalizeTime(finishTime),
        status,
      });
    } catch (error) {
      errors.push({
        row: i + 1,
        error: `Erreur de parsing: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      });
    }
  }

  return { results, errors };
}

/**
 * Parse un export Elogica (format spécifique XML ou CSV enrichi)
 * Elogica produit généralement un CSV avec colonnes supplémentaires
 */
export function parseElogica(content: string): ParseResult {
  const lines = content.split('\n').filter(line => line.trim());
  const results: ParsedResult[] = [];
  const errors: Array<{ row: number; error: string }> = [];

  // Détecter le format (CSV ou XML)
  if (content.trim().startsWith('<?xml')) {
    return parseElogicaXML(content);
  }

  if (lines.length < 2) {
    errors.push({ row: 0, error: 'Fichier vide ou invalide' });
    return { results, errors };
  }

  const separator = lines[0].includes('\t') ? '\t' : ';';
  const columnMapping = detectColumns(lines[0], separator);

  for (let i = 1; i < lines.length; i++) {
    try {
      const parts = lines[i].split(separator).map(p => p.trim());

      if (parts.length < 3) {
        continue;
      }

      const bibNumber = columnMapping.bib >= 0
        ? parseInt(parts[columnMapping.bib] || '0')
        : parseInt(parts[0] || '0');

      if (!bibNumber || bibNumber <= 0) {
        continue;
      }

      const athleteName = columnMapping.name >= 0
        ? parts[columnMapping.name] || ''
        : `${parts[2] || ''} ${parts[1] || ''}`.trim();

      if (!athleteName) {
        errors.push({ row: i + 1, error: 'Nom athlète manquant' });
        continue;
      }

      const gender = columnMapping.gender >= 0
        ? parts[columnMapping.gender]?.toUpperCase()
        : parts[3]?.toUpperCase();

      const category = columnMapping.category >= 0
        ? parts[columnMapping.category]
        : parts[4];

      const finishTime = columnMapping.time >= 0
        ? parts[columnMapping.time]
        : parts.find(p => /^\d{1,2}:\d{2}(:\d{2})?$/.test(p));

      results.push({
        bibNumber,
        athleteName,
        gender: gender === 'M' || gender === 'F' || gender === 'H' ? (gender === 'H' ? 'M' : gender as 'M' | 'F') : undefined,
        category: category || undefined,
        finishTime: finishTime || undefined,
        status: 'finished',
      });
    } catch (error) {
      errors.push({
        row: i + 1,
        error: `Erreur de parsing: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      });
    }
  }

  return { results, errors };
}

/**
 * Parse un export Elogica XML
 */
function parseElogicaXML(content: string): ParseResult {
  const results: ParsedResult[] = [];
  const errors: Array<{ row: number; error: string }> = [];

  try {
    // Simple parsing XML sans dépendance externe
    const resultMatches = content.matchAll(/<result>(.*?)<\/result>/gs);

    let rowIndex = 1;
    for (const match of resultMatches) {
      try {
        const resultXML = match[1];

        const bibNumber = parseInt(extractXMLTag(resultXML, 'bib') || '0');
        const firstName = extractXMLTag(resultXML, 'firstname') || '';
        const lastName = extractXMLTag(resultXML, 'lastname') || '';
        const athleteName = `${firstName} ${lastName}`.trim();
        const gender = extractXMLTag(resultXML, 'gender')?.toUpperCase();
        const category = extractXMLTag(resultXML, 'category');
        const finishTime = extractXMLTag(resultXML, 'time');

        if (!bibNumber || !athleteName) {
          errors.push({ row: rowIndex, error: 'Données incomplètes' });
          rowIndex++;
          continue;
        }

        results.push({
          bibNumber,
          athleteName,
          gender: gender === 'M' || gender === 'F' ? gender : undefined,
          category: category || undefined,
          finishTime: normalizeTime(finishTime),
          status: 'finished',
        });
        rowIndex++;
      } catch (error) {
        errors.push({
          row: rowIndex,
          error: `Erreur XML: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
        });
        rowIndex++;
      }
    }
  } catch (error) {
    errors.push({
      row: 0,
      error: `Erreur parsing XML: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
    });
  }

  return { results, errors };
}

/**
 * Extrait le contenu d'un tag XML simple
 */
function extractXMLTag(xml: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}>(.*?)<\/${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

/**
 * Parse un fichier HTML avec un mapping personnalisé
 */
function parseHTMLWithMapping(content: string, mapping: { [key: string]: number }): ParseResult {
  const results: ParsedResult[] = [];
  const errors: Array<{ row: number; error: string }> = [];

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const rows = doc.querySelectorAll('table tr');

    if (rows.length === 0) {
      errors.push({ row: 0, error: 'Aucun tableau trouvé dans le fichier HTML' });
      return { results, errors };
    }

    for (let i = 1; i < rows.length; i++) {
      try {
        const cells = rows[i].querySelectorAll('td, th');
        if (cells.length < 2) continue;

        const cellTexts = Array.from(cells).map(cell => cell.textContent?.trim() || '');

        // Extract bib number
        const bibNumber = mapping.bib !== undefined
          ? parseInt(cellTexts[mapping.bib] || '0')
          : 0;

        if (!bibNumber || bibNumber <= 0) continue;

        // Extract athlete name
        let athleteName = '';
        if (mapping.fullName !== undefined) {
          athleteName = cellTexts[mapping.fullName] || '';
        } else if (mapping.firstName !== undefined && mapping.lastName !== undefined) {
          const firstName = cellTexts[mapping.firstName] || '';
          const lastName = cellTexts[mapping.lastName] || '';
          athleteName = `${firstName} ${lastName}`.trim();
        } else if (mapping.lastName !== undefined) {
          athleteName = cellTexts[mapping.lastName] || '';
        }

        if (!athleteName) {
          errors.push({ row: i + 1, error: 'Nom athlète manquant' });
          continue;
        }

        const gender = mapping.gender !== undefined
          ? cellTexts[mapping.gender]?.toUpperCase()
          : undefined;

        const category = mapping.category !== undefined
          ? cellTexts[mapping.category]
          : undefined;

        const finishTime = mapping.finishTime !== undefined
          ? cellTexts[mapping.finishTime]
          : undefined;

        const gunTime = mapping.gunTime !== undefined
          ? cellTexts[mapping.gunTime]
          : undefined;

        const netTime = mapping.netTime !== undefined
          ? cellTexts[mapping.netTime]
          : undefined;

        const club = mapping.club !== undefined
          ? cellTexts[mapping.club]
          : undefined;

        const city = mapping.city !== undefined
          ? cellTexts[mapping.city]
          : undefined;

        const nationality = mapping.nationality !== undefined
          ? cellTexts[mapping.nationality]
          : undefined;

        const averageSpeed = mapping.averageSpeed !== undefined
          ? cellTexts[mapping.averageSpeed]
          : undefined;

        const overallRank = mapping.overallRank !== undefined
          ? cellTexts[mapping.overallRank]
          : undefined;

        const genderRank = mapping.genderRank !== undefined
          ? cellTexts[mapping.genderRank]
          : undefined;

        const categoryRank = mapping.categoryRank !== undefined
          ? cellTexts[mapping.categoryRank]
          : undefined;

        let status: ParsedResult['status'] = 'finished';
        const statusStr = cellTexts[cellTexts.length - 1]?.toLowerCase();
        if (statusStr === 'dnf' || statusStr === 'abandon') status = 'dnf';
        else if (statusStr === 'dns' || statusStr === 'absent') status = 'dns';
        else if (statusStr === 'dsq' || statusStr === 'disqualifié') status = 'dsq';

        // Extract custom fields
        const customFields: { [key: string]: any } = {};
        const standardFields = ['bib', 'lastName', 'firstName', 'fullName', 'gender', 'category', 'finishTime', 'gunTime', 'netTime', 'year', 'club', 'city', 'nationality', 'averageSpeed', 'overallRank', 'genderRank', 'categoryRank', 'splitTime1', 'splitTime2', 'splitTime3'];

        // Add extracted standard fields to customFields for storage
        if (club) customFields.club = club;
        if (city) customFields.city = city;
        if (nationality) customFields.nationality = nationality;
        if (averageSpeed) customFields.averageSpeed = averageSpeed;
        if (overallRank) customFields.overallRank = overallRank;
        if (genderRank) customFields.genderRank = genderRank;
        if (categoryRank) customFields.categoryRank = categoryRank;

        Object.keys(mapping).forEach(fieldKey => {
          if (!standardFields.includes(fieldKey) && mapping[fieldKey] !== undefined) {
            const value = cellTexts[mapping[fieldKey]];
            if (value) {
              customFields[fieldKey] = value;
            }
          }
        });

        results.push({
          bibNumber,
          athleteName,
          gender: gender === 'M' || gender === 'F' || gender === 'H' ? (gender === 'H' ? 'M' : gender as 'M' | 'F') : undefined,
          category: category || undefined,
          finishTime: normalizeTime(finishTime),
          status,
          customFields: Object.keys(customFields).length > 0 ? customFields : undefined,
        });
      } catch (error) {
        errors.push({
          row: i + 1,
          error: `Erreur parsing HTML: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
        });
      }
    }
  } catch (error) {
    errors.push({
      row: 0,
      error: `Erreur parsing HTML: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
    });
  }

  return { results, errors };
}

/**
 * Parse un fichier HTML de résultats
 * Format attendu: tableau HTML avec colonnes standards
 */
export function parseHTML(content: string): ParseResult {
  const results: ParsedResult[] = [];
  const errors: Array<{ row: number; error: string }> = [];

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const rows = doc.querySelectorAll('table tr');

    if (rows.length === 0) {
      errors.push({ row: 0, error: 'Aucun tableau trouvé dans le fichier HTML' });
      return { results, errors };
    }

    for (let i = 1; i < rows.length; i++) {
      try {
        const cells = rows[i].querySelectorAll('td, th');
        if (cells.length < 3) continue;

        const cellTexts = Array.from(cells).map(cell => cell.textContent?.trim() || '');

        const bibNumber = parseInt(cellTexts[0] || '0');
        if (!bibNumber || bibNumber <= 0) {
          errors.push({ row: i + 1, error: 'Numéro de dossard invalide' });
          continue;
        }

        const athleteName = cellTexts[1] || '';
        if (!athleteName) {
          errors.push({ row: i + 1, error: 'Nom athlète manquant' });
          continue;
        }

        const gender = cellTexts[2]?.toUpperCase();
        const category = cellTexts[3];
        const finishTime = cellTexts[4];
        const statusStr = cellTexts[5]?.toLowerCase();

        let status: ParsedResult['status'] = 'finished';
        if (statusStr === 'dnf' || statusStr === 'abandon') status = 'dnf';
        else if (statusStr === 'dns' || statusStr === 'absent') status = 'dns';
        else if (statusStr === 'dsq' || statusStr === 'disqualifié') status = 'dsq';

        results.push({
          bibNumber,
          athleteName,
          gender: gender === 'M' || gender === 'F' ? gender : undefined,
          category: category || undefined,
          finishTime: normalizeTime(finishTime),
          status,
        });
      } catch (error) {
        errors.push({
          row: i + 1,
          error: `Erreur parsing HTML: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
        });
      }
    }
  } catch (error) {
    errors.push({
      row: 0,
      error: `Erreur parsing HTML: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
    });
  }

  return { results, errors };
}

/**
 * Parse un fichier Excel (converti en CSV côté client avant upload)
 * Ou utilise la lib xlsx si besoin
 */
export function parseExcel(content: string): ParseResult {
  // Pour l'instant, on assume que Excel est converti en CSV côté client
  // Si besoin d'un vrai parsing Excel, utiliser la lib 'xlsx'
  return parseCSV(content);
}

/**
 * Parse le format texte E@logica de la FFA
 * Format: lignes de texte avec positions fixes
 */
export function parseFFAText(content: string): ParseResult {
  const results: ParsedResult[] = [];
  const errors: Array<{ row: number; error: string }> = [];
  const lines = content.split('\n').filter(line => line.trim());

  for (let i = 0; i < lines.length; i++) {
    try {
      const line = lines[i];

      if (line.length < 20) continue;

      const bibNumber = parseInt(line.substring(0, 6).trim() || '0');
      if (!bibNumber || bibNumber <= 0) continue;

      const athleteName = line.substring(6, 40).trim();
      if (!athleteName) {
        errors.push({ row: i + 1, error: 'Nom athlète manquant' });
        continue;
      }

      const gender = line.substring(40, 42).trim().toUpperCase();
      const category = line.substring(42, 48).trim();
      const finishTime = line.substring(48, 60).trim();
      const statusStr = line.substring(60, 70).trim().toLowerCase();

      let status: ParsedResult['status'] = 'finished';
      if (statusStr.includes('dnf') || statusStr.includes('abandon')) status = 'dnf';
      else if (statusStr.includes('dns') || statusStr.includes('absent')) status = 'dns';
      else if (statusStr.includes('dsq') || statusStr.includes('disq')) status = 'dsq';

      results.push({
        bibNumber,
        athleteName,
        gender: gender === 'M' || gender === 'F' ? gender : undefined,
        category: category || undefined,
        finishTime: normalizeTime(finishTime),
        status,
      });
    } catch (error) {
      errors.push({
        row: i + 1,
        error: `Erreur parsing FFA: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      });
    }
  }

  return { results, errors };
}

/**
 * Détecte automatiquement le format du fichier
 */
export function detectFormat(filename: string, content: string): 'elogica' | 'ffa-text' | 'html' | 'excel' | 'csv' {
  const lower = filename.toLowerCase();
  const contentStart = content.trim().substring(0, 100).toLowerCase();

  if (content.trim().startsWith('<?xml')) {
    return 'elogica';
  }

  if (contentStart.includes('<html') || contentStart.includes('<!doctype html') || contentStart.includes('<table')) {
    return 'html';
  }

  if (lower.includes('elogica') || lower.includes('elog')) {
    return 'elogica';
  }

  if (lower.includes('ffa') || lower.includes('e@logica')) {
    return 'ffa-text';
  }

  if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
    return 'excel';
  }

  if (lower.endsWith('.html') || lower.endsWith('.htm')) {
    return 'html';
  }

  if (lower.endsWith('.txt')) {
    return 'ffa-text';
  }

  return 'csv';
}

/**
 * Parse automatiquement selon le format détecté
 */
export function parseResults(filename: string, content: string): ParseResult {
  const format = detectFormat(filename, content);

  switch (format) {
    case 'elogica':
      return parseElogica(content);
    case 'ffa-text':
      return parseFFAText(content);
    case 'html':
      return parseHTML(content);
    case 'excel':
      return parseExcel(content);
    case 'csv':
    default:
      return parseCSV(content);
  }
}

/**
 * Parse un fichier avec un mapping de colonnes personnalisé
 */
export function parseResultsWithMapping(
  content: string,
  mapping: { [key: string]: number },
  separator: string = ','
): ParseResult {
  const results: ParsedResult[] = [];
  const errors: Array<{ row: number; error: string }> = [];

  // Détecter si c'est du HTML
  const contentStart = content.trim().substring(0, 100).toLowerCase();
  const isHTML = contentStart.includes('<html') || contentStart.includes('<!doctype') || contentStart.includes('<table');

  if (isHTML) {
    return parseHTMLWithMapping(content, mapping);
  }

  const lines = content.split('\n').filter(line => line.trim());

  if (lines.length < 2) {
    errors.push({ row: 0, error: 'Fichier vide ou invalide' });
    return { results, errors };
  }

  // Skip header
  for (let i = 1; i < lines.length; i++) {
    try {
      const parts = lines[i].split(separator).map(p => p.trim());

      if (parts.length < 2) {
        continue;
      }

      // Extract bib number
      const bibNumber = mapping.bib !== undefined
        ? parseInt(parts[mapping.bib] || '0')
        : 0;

      if (!bibNumber || bibNumber <= 0) {
        continue;
      }

      // Extract athlete name
      let athleteName = '';
      if (mapping.fullName !== undefined) {
        athleteName = parts[mapping.fullName] || '';
      } else if (mapping.firstName !== undefined && mapping.lastName !== undefined) {
        const firstName = parts[mapping.firstName] || '';
        const lastName = parts[mapping.lastName] || '';
        athleteName = `${firstName} ${lastName}`.trim();
      } else if (mapping.lastName !== undefined) {
        athleteName = parts[mapping.lastName] || '';
      }

      if (!athleteName) {
        errors.push({ row: i + 1, error: 'Nom athlète manquant' });
        continue;
      }

      // Extract other fields
      const gender = mapping.gender !== undefined
        ? parts[mapping.gender]?.toUpperCase()
        : undefined;

      const category = mapping.category !== undefined
        ? parts[mapping.category]
        : undefined;

      const finishTime = mapping.finishTime !== undefined
        ? parts[mapping.finishTime]
        : undefined;

      const gunTime = mapping.gunTime !== undefined
        ? parts[mapping.gunTime]
        : undefined;

      const netTime = mapping.netTime !== undefined
        ? parts[mapping.netTime]
        : undefined;

      const club = mapping.club !== undefined
        ? parts[mapping.club]
        : undefined;

      const city = mapping.city !== undefined
        ? parts[mapping.city]
        : undefined;

      const nationality = mapping.nationality !== undefined
        ? parts[mapping.nationality]
        : undefined;

      const averageSpeed = mapping.averageSpeed !== undefined
        ? parts[mapping.averageSpeed]
        : undefined;

      const overallRank = mapping.overallRank !== undefined
        ? parts[mapping.overallRank]
        : undefined;

      const genderRank = mapping.genderRank !== undefined
        ? parts[mapping.genderRank]
        : undefined;

      const categoryRank = mapping.categoryRank !== undefined
        ? parts[mapping.categoryRank]
        : undefined;

      let status: ParsedResult['status'] = 'finished';
      const statusStr = parts[parts.length - 1]?.toLowerCase();
      if (statusStr === 'dnf' || statusStr === 'abandon') status = 'dnf';
      else if (statusStr === 'dns' || statusStr === 'absent') status = 'dns';
      else if (statusStr === 'dsq' || statusStr === 'disqualifié') status = 'dsq';

      // Extract custom fields
      const customFields: { [key: string]: any } = {};
      const standardFields = ['bib', 'lastName', 'firstName', 'fullName', 'gender', 'category', 'finishTime', 'gunTime', 'netTime', 'year', 'club', 'city', 'nationality', 'averageSpeed', 'overallRank', 'genderRank', 'categoryRank', 'splitTime1', 'splitTime2', 'splitTime3'];

      // Add extracted standard fields to customFields for storage
      if (club) customFields.club = club;
      if (city) customFields.city = city;
      if (nationality) customFields.nationality = nationality;
      if (averageSpeed) customFields.averageSpeed = averageSpeed;
      if (overallRank) customFields.overallRank = overallRank;
      if (genderRank) customFields.genderRank = genderRank;
      if (categoryRank) customFields.categoryRank = categoryRank;

      Object.keys(mapping).forEach(fieldKey => {
        if (!standardFields.includes(fieldKey) && mapping[fieldKey] !== undefined) {
          const value = parts[mapping[fieldKey]];
          if (value) {
            customFields[fieldKey] = value;
          }
        }
      });

      results.push({
        bibNumber,
        athleteName,
        gender: gender === 'M' || gender === 'F' || gender === 'H' ? (gender === 'H' ? 'M' : gender as 'M' | 'F') : undefined,
        category: category || undefined,
        finishTime: normalizeTime(finishTime || netTime || gunTime),
        gunTime: normalizeTime(gunTime),
        netTime: normalizeTime(netTime),
        status,
        customFields: Object.keys(customFields).length > 0 ? customFields : undefined,
      });
    } catch (error) {
      errors.push({
        row: i + 1,
        error: `Erreur de parsing: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      });
    }
  }

  return { results, errors };
}

/**
 * Valide un temps au format HH:MM:SS ou MM:SS
 */
export function validateTimeFormat(time: string): boolean {
  return /^\d{1,2}:\d{2}(:\d{2})?$/.test(time);
}

/**
 * Convertit un temps en secondes
 */
export function timeToSeconds(time: string): number | null {
  if (!validateTimeFormat(time)) return null;

  const parts = time.split(':').map(p => parseInt(p, 10));

  if (parts.length === 3) {
    // HH:MM:SS
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    // MM:SS
    return parts[0] * 60 + parts[1];
  }

  return null;
}

/**
 * Formate un nombre de secondes en HH:MM:SS
 */
export function secondsToTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    secs.toString().padStart(2, '0')
  ].join(':');
}

/**
 * Normalise un temps au format HH:MM:SS
 * Gère les cas où MM:SS est écrit comme MM:SS:00 ou HH:MM:SS avec HH > 23
 */
export function normalizeTime(time: string | undefined | null): string | undefined {
  if (!time || !time.trim()) return undefined;

  const trimmed = time.trim();
  const parts = trimmed.split(':');

  // Si pas au bon format, retourner undefined
  if (parts.length < 2 || parts.length > 3) return undefined;

  const nums = parts.map(p => parseInt(p, 10));
  if (nums.some(n => isNaN(n))) return undefined;

  // Format MM:SS -> 00:MM:SS
  if (parts.length === 2) {
    return `00:${nums[0].toString().padStart(2, '0')}:${nums[1].toString().padStart(2, '0')}`;
  }

  // Format HH:MM:SS
  // Si HH > 23, c'est probablement MM:SS:CS (centièmes)
  // ou MM:SS mal formaté comme MM:SS:00
  if (nums[0] > 23) {
    // Traiter comme MM:SS:CS ou MM:SS:00
    return `00:${nums[0].toString().padStart(2, '0')}:${nums[1].toString().padStart(2, '0')}`;
  }

  // Format HH:MM:SS normal
  return `${nums[0].toString().padStart(2, '0')}:${nums[1].toString().padStart(2, '0')}:${nums[2].toString().padStart(2, '0')}`;
}
