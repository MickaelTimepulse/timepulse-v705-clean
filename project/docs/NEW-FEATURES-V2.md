# 🎉 Nouvelles Fonctionnalités Timepulse V2

## 📊 Module de Gestion des Résultats

### ✅ Import Multi-Format
- **Elogica** (CSV et XML)
  - Parsing automatique du format Elogica
  - Support temps pistolet et temps net
  - Import des points de passage

- **Excel** (.xlsx, .xls)
  - Conversion automatique en CSV
  - Détection des colonnes standard

- **CSV Standard**
  - Format: Dossard, Nom, Prénom, Sexe, Catégorie, Temps
  - Support délimiteurs: virgule ou point-virgule
  - Gestion des statuts: Arrivé, Abandon (DNF), Absent (DNS), Disqualifié (DSQ)

### 🏆 Calcul Automatique des Classements
- **Classement Scratch** (général)
- **Classement par Genre** (M/F)
- **Classement par Catégorie** (V1M, SEM, CAF, etc.)
- **Recalcul automatique** à chaque modification

### 📈 Tables Database
```sql
- results: Stockage des résultats
- result_imports: Historique des imports
- split_points: Points de passage intermédiaires
```

### 🔍 Visualisation Publique
- **Page résultats publique** accessible à tous
- **Recherche** par nom ou dossard
- **Filtres** par genre et catégorie
- **Export CSV** des résultats
- **Podium visuel** (top 3)

### 📁 Fichiers Créés
```
supabase/migrations/20251023140000_create_results_module.sql
src/lib/results-parser.ts
src/components/ResultsImporter.tsx
src/pages/RaceResults.tsx
```

---

## 📊 Tableau de Bord Statistiques Organisateur

### 📈 KPIs en Temps Réel
- **Total inscrits** (confirmés + en attente)
- **Revenus totaux** (en euros)
- **Taux de conversion** (% confirmés)
- **Inscriptions par jour** (moyenne)

### 📉 Graphiques et Analyses
- **Inscriptions par jour** (historique 7/30/365 jours)
- **Inscriptions par course** (répartition)
- **Répartition par genre** (H/F en %)
- **Répartition par catégorie**
- **Timeline des inscriptions récentes**

### 💡 Insights Business
- Prix moyen par inscription
- Taux de remplissage par course
- Tendances d'inscriptions
- Analyse démographique

### 📁 Fichiers Créés
```
src/pages/OrganizerStats.tsx
```

---

## 📥 Export Excel des Inscrits

### 📊 Formats d'Export Disponibles

#### 1. **Export Standard (CSV/Excel)**
Colonnes:
- Dossard
- Nom, Prénom
- Sexe, Date de Naissance
- Nationalité
- Email, Téléphone
- Catégorie
- Course
- Prix Payé
- Statut
- Date Inscription
- Numéro Licence, Club
- Contact d'Urgence

#### 2. **Export Elogica (Chronométrage)**
Format optimisé pour import dans Elogica:
- Dossard
- Nom (MAJUSCULES)
- Prénom (MAJUSCULES)
- Sexe
- Date Naissance (YYYYMMDD)
- Club
- Licence
- Catégorie

#### 3. **Export Emails (Newsletter)**
Pour campagnes marketing:
- Email
- Prénom, Nom
- Course

#### 4. **Export Statistiques**
Rapport complet:
- Stats générales
- Répartition par course
- Répartition par genre
- Répartition par catégorie

#### 5. **Étiquettes Dossards**
Format impression:
- Dossard (numéro)
- Nom Complet (MAJUSCULES)
- Course
- Catégorie

#### 6. **Export JSON (Backup)**
Données brutes pour backup ou API

### 🔧 Utilisation
```typescript
import { exportToCSV, exportToElogica, exportEmails } from '@/lib/excel-export';

// Export standard
exportToCSV(entries, 'inscriptions-marathon.csv');

// Export chronométrage
exportToElogica(entries, 'elogica-import.csv');

// Export emails
exportEmails(entries, 'newsletter-emails.csv');
```

### 📁 Fichiers Créés
```
src/lib/excel-export.ts
```

---

## 🎓 Intégrations API à Venir

### 🏃 API FFA (Fédération Française d'Athlétisme)
**Objectif**: Vérification automatique des licences FFA et PPS (Pass Prévention Santé)

**Fonctionnalités**:
- ✅ Vérification licence en temps réel
- ✅ Validation PPS obligatoire
- ✅ Récupération catégorie FFA automatique
- ✅ Contrôle validité certificat médical

**Migration à créer**:
```sql
-- Ajout champs FFA
ALTER TABLE athletes ADD COLUMN ffa_license_number VARCHAR(20);
ALTER TABLE athletes ADD COLUMN ffa_license_valid_until DATE;
ALTER TABLE athletes ADD COLUMN has_pps BOOLEAN DEFAULT false;
ALTER TABLE athletes ADD COLUMN medical_certificate_date DATE;
```

**Service à créer**:
```typescript
// src/lib/ffa-api.ts
export async function verifyFFALicense(licenseNumber: string): Promise<{
  valid: boolean;
  category: string;
  ppsValid: boolean;
  expirationDate: string;
}>;
```

---

### 🏊 API FFTri (Fédération Française de Triathlon)
**Objectif**: Vérification licences FFTri et FIS (File d'Inscription Solidaire)

**Fonctionnalités**:
- ✅ Vérification licence FFTri
- ✅ Récupération niveau FIS (A, B, C, D, E)
- ✅ Validation club d'appartenance
- ✅ Contrôle sanctions/suspensions

**Migration à créer**:
```sql
-- Ajout champs FFTri
ALTER TABLE athletes ADD COLUMN fftri_license_number VARCHAR(20);
ALTER TABLE athletes ADD COLUMN fftri_fis_level VARCHAR(1);
ALTER TABLE athletes ADD COLUMN fftri_club VARCHAR(255);
ALTER TABLE athletes ADD COLUMN fftri_valid_until DATE;
```

**Service à créer**:
```typescript
// src/lib/fftri-api.ts
export async function verifyFFTriLicense(licenseNumber: string): Promise<{
  valid: boolean;
  fisLevel: 'A' | 'B' | 'C' | 'D' | 'E';
  club: string;
  expirationDate: string;
}>;
```

---

### 📱 API Oxisms (Notifications SMS)
**Objectif**: Envoi SMS automatiques aux participants

**Cas d'usage**:
- ✅ Confirmation d'inscription
- ✅ Rappel veille de course
- ✅ Infos pratiques événement
- ✅ Résultats personnalisés après course
- ✅ Alerte météo

**Migration à créer**:
```sql
-- Logs SMS
CREATE TABLE sms_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid REFERENCES athletes(id),
  phone_number text NOT NULL,
  message text NOT NULL,
  status text CHECK (status IN ('pending', 'sent', 'failed', 'delivered')),
  provider_id text,
  cost decimal(10,4),
  sent_at timestamptz,
  delivered_at timestamptz,
  error_message text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_sms_logs_athlete ON sms_logs(athlete_id);
CREATE INDEX idx_sms_logs_status ON sms_logs(status);
CREATE INDEX idx_sms_logs_sent_at ON sms_logs(sent_at DESC);
```

**Edge Function à créer**:
```typescript
// supabase/functions/send-sms/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  const { phone, message, athleteId } = await req.json();

  // Appel API Oxisms
  const response = await fetch('https://api.oxisms.com/v1/sms/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OXISMS_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: phone,
      message: message,
      sender: 'TIMEPULSE',
    }),
  });

  // Logger dans sms_logs
  // ...

  return new Response(JSON.stringify({ success: true }));
});
```

**Templates SMS**:
```typescript
// src/lib/sms-templates.ts
export const SMS_TEMPLATES = {
  REGISTRATION_CONFIRMED: (athleteName: string, raceName: string) =>
    `Bonjour ${athleteName}, votre inscription au ${raceName} est confirmée ! RDV le jour J. Timepulse`,

  REMINDER_1_DAY: (athleteName: string, raceName: string, startTime: string) =>
    `Rappel: ${raceName} demain à ${startTime}. Pensez à votre dossard ! Bon courage. Timepulse`,

  RESULT_READY: (athleteName: string, rank: number, time: string) =>
    `Félicitations ${athleteName} ! Classement: ${rank}e en ${time}. Retrouvez tous les résultats sur timepulse.fr`,
};
```

---

### 📧 Système de Newsletter
**Objectif**: Communication régulière avec les inscrits

**Fonctionnalités**:
- ✅ Gestion listes de diffusion
- ✅ Templates emails personnalisables
- ✅ Segmentation (par course, genre, catégorie)
- ✅ Planification d'envois
- ✅ Statistiques (taux ouverture, clics)

**Migration à créer**:
```sql
-- Newsletters
CREATE TABLE newsletters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id uuid REFERENCES organizers(id),
  event_id uuid REFERENCES events(id),
  subject text NOT NULL,
  content text NOT NULL,
  segment_filter jsonb, -- Filtres: {race_ids: [], genders: [], categories: []}
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent')),
  scheduled_for timestamptz,
  sent_at timestamptz,
  total_recipients integer DEFAULT 0,
  opened_count integer DEFAULT 0,
  clicked_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Tracking ouvertures/clics
CREATE TABLE newsletter_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  newsletter_id uuid REFERENCES newsletters(id),
  athlete_id uuid REFERENCES athletes(id),
  email text NOT NULL,
  opened_at timestamptz,
  clicked_at timestamptz,
  created_at timestamptz DEFAULT now()
);
```

---

### 🎨 Améliorations Design (À Faire)

**Page d'accueil**:
- Hero section plus impactant
- Animations au scroll
- Témoignages organisateurs
- Compteur événements en direct

**Formulaires**:
- Indicateur de progression (steps)
- Validation en temps réel
- Messages d'erreur plus clairs
- Auto-complétion intelligente

**Dashboard organisateur**:
- Widgets déplaçables (drag & drop)
- Mode sombre
- Notifications push
- Raccourcis clavier

**Mobile**:
- Navigation bottom tab
- Gestures swipe
- PWA (Progressive Web App)
- Mode offline

---

### 📄 Certificats PDF Automatiques (À Faire)

**Fonctionnalités**:
- ✅ Génération automatique après validation résultat
- ✅ Template personnalisable par organisateur
- ✅ QR Code de vérification
- ✅ Logo partenaires
- ✅ Envoi automatique par email

**Stack technique**:
```bash
# Utiliser jsPDF ou PDFKit
npm install jspdf jspdf-autotable
```

**Service à créer**:
```typescript
// src/lib/certificate-generator.ts
import jsPDF from 'jspdf';

export async function generateCertificate(
  athleteName: string,
  raceName: string,
  rank: number,
  time: string,
  eventLogo: string
): Promise<Blob> {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(24);
  doc.text('CERTIFICAT DE PARTICIPATION', 105, 40, { align: 'center' });

  // Contenu
  doc.setFontSize(16);
  doc.text(`${athleteName}`, 105, 80, { align: 'center' });
  doc.setFontSize(12);
  doc.text(`${raceName}`, 105, 100, { align: 'center' });
  doc.text(`Classement: ${rank}e - Temps: ${time}`, 105, 120, { align: 'center' });

  // QR Code (vérification)
  // ... générer QR code avec authentification

  return doc.output('blob');
}
```

---

## 🚀 Roadmap Complète

### ✅ Phase 1 - TERMINÉ
- Module résultats (import multi-format)
- Tableau de bord statistiques
- Export Excel avancé
- Optimisations performance

### 🔄 Phase 2 - EN COURS
- Intégration API FFA
- Intégration API FFTri
- SMS via Oxisms
- Système newsletter

### 📅 Phase 3 - À VENIR
- Certificats PDF automatiques
- Refonte design complète
- Application mobile (React Native)
- Mode chronométrage live

### 🎯 Phase 4 - FUTUR
- IA prédiction temps de course
- Chatbot support 24/7
- Marketplace partenaires
- API publique Timepulse

---

## 📞 Besoin d'Aide?

Pour implémenter ces fonctionnalités:

1. **Migrations Database**: Appliquer dans Supabase Dashboard
2. **Edge Functions**: Déployer via MCP Supabase
3. **Frontend**: Composants React prêts à l'emploi
4. **APIs externes**: Contacter les fédérations pour accès API

**Contact Timepulse**: dev@timepulse.fr
