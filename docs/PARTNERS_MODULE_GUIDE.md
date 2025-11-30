# Guide du Module Partenaires

## Vue d'ensemble

Le module Partenaires permet aux organisateurs d'ajouter et de gérer les logos de leurs partenaires directement depuis leur espace organisateur. Les logos sont automatiquement affichés sur la page publique de l'événement avec des effets visuels professionnels.

## Fonctionnalités

### Pour les Organisateurs

1. **Ajout de Partenaires**
   - Upload de logo (PNG, JPEG, JPG acceptés)
   - Nom du partenaire (optionnel)
   - Lien vers le site web (optionnel)
   - Limite de taille : 5 Mo par fichier

2. **Traitement Automatique des Images**
   - Redimensionnement automatique à 200x200px
   - Maintien des proportions
   - Fond transparent (conversion en PNG)
   - Centrage automatique

3. **Gestion des Partenaires**
   - Réorganisation par glisser-déposer
   - Suppression avec confirmation
   - Prévisualisation en temps réel

### Pour les Visiteurs

1. **Affichage Professionnel**
   - Section dédiée entre "À propos" et "Lieu & Co-voiturage"
   - Design uniforme et cohérent
   - Effets de survol élégants

2. **Effets Visuels**
   - Animation au survol
   - Effet de brillance (shimmer)
   - Transition de couleur (grayscale → couleur)
   - Mise en avant du lien externe
   - Agrandissement au survol

3. **Accessibilité**
   - Liens cliquables vers les sites des partenaires
   - Labels ARIA appropriés
   - Focus keyboard-friendly

## Structure Technique

### Base de Données

**Table : `event_partners`**
```sql
- id (uuid)
- event_id (uuid) → FK vers events
- name (text, optionnel)
- logo_url (text)
- website_url (text, optionnel)
- display_order (integer)
- created_at (timestamptz)
- updated_at (timestamptz)
```

**Storage : `event-partner-logos`**
- Bucket public
- Limite : 5 Mo par fichier
- Formats : PNG, JPEG, JPG, WebP
- Organisation : `/event-partner-logos/{event_id}/{timestamp}.png`

### Sécurité (RLS)

**Public**
- Lecture : Partenaires des événements publiés uniquement

**Organisateurs**
- Lecture : Leurs propres partenaires
- Création : Pour leurs événements uniquement
- Modification : Leurs propres partenaires
- Suppression : Leurs propres partenaires

**Storage**
- Upload : Organisateurs dans leurs dossiers événements
- Lecture : Public

## Composants

### 1. OrganizerEventPartners
**Fichier :** `src/components/OrganizerEventPartners.tsx`

**Fonctionnalités :**
- Formulaire d'ajout de partenaire
- Liste des partenaires avec drag & drop
- Upload et traitement d'image
- Gestion CRUD complète

**Props :**
```typescript
{
  eventId: string
}
```

### 2. EventPartnersSection
**Fichier :** `src/components/EventPartnersSection.tsx`

**Fonctionnalités :**
- Affichage public des partenaires
- Grille responsive (2/3/4 colonnes)
- Effets visuels professionnels
- Liens vers sites web

**Props :**
```typescript
{
  eventId: string
}
```

## Intégration

### Page Organisateur
**Fichier :** `src/pages/OrganizerEventDetail.tsx`

Nouvel onglet "Partenaires" dans la section "Paramètres de l'Événement" :
```tsx
{activeTab === 'partners' && event && (
  <OrganizerEventPartners eventId={event.id} />
)}
```

### Page Publique
**Fichier :** `src/pages/EventDetail.tsx`

Section affichée entre "À propos" et "Lieu & Co-voiturage" :
```tsx
<EventPartnersSection eventId={event.id} />
```

## Migrations

### 1. Table et Policies
**Fichier :** `supabase/migrations/20251120000001_create_event_partners.sql`
- Création de la table
- Indexes pour performance
- Policies RLS complètes
- Trigger updated_at

### 2. Storage Bucket
**Fichier :** `supabase/migrations/20251120000002_create_partner_logos_bucket.sql`
- Création du bucket
- Configuration (5Mo, formats acceptés)
- Policies de storage

## Processus de Traitement d'Image

### Algorithme
1. Chargement de l'image dans un élément Image
2. Création d'un canvas 200x200px
3. Calcul du ratio pour maintenir les proportions
4. Centrage de l'image dans le canvas
5. Fond transparent
6. Export en PNG (qualité 95%)

### Code
```typescript
const processImage = async (file: File): Promise<Blob> => {
  // Charge l'image
  const img = new Image();
  img.src = URL.createObjectURL(file);

  // Canvas 200x200
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 200;

  // Calcul proportions
  const scale = Math.min(200 / img.width, 200 / img.height);
  const width = img.width * scale;
  const height = img.height * scale;
  const x = (200 - width) / 2;
  const y = (200 - height) / 2;

  // Dessin
  ctx.clearRect(0, 0, 200, 200);
  ctx.drawImage(img, x, y, width, height);

  // Export PNG
  return canvas.toBlob('image/png', 0.95);
}
```

## Effets CSS

### Shimmer Effect
```css
@keyframes shimmer {
  from { transform: translateX(-100%); }
  to { transform: translateX(100%); }
}
```

### Hover Effects
- `transform: translateY(-0.5rem)` - Élévation
- `scale(1.1)` - Agrandissement du logo
- `grayscale(0)` - Transition couleur
- `shadow-2xl` - Ombre portée
- Gradient animé en arrière-plan

## Utilisation

### Pour l'Organisateur

1. **Accéder au module**
   - Aller dans "Mes événements"
   - Cliquer sur un événement
   - Cliquer sur l'onglet "Partenaires"

2. **Ajouter un partenaire**
   - Cliquer sur "Ajouter un partenaire"
   - Sélectionner un logo (PNG/JPEG/JPG)
   - Renseigner le nom (optionnel)
   - Ajouter l'URL du site (optionnel)
   - Cliquer sur "Ajouter"

3. **Réorganiser**
   - Glisser-déposer les cartes
   - L'ordre est sauvegardé automatiquement

4. **Supprimer**
   - Cliquer sur l'icône de suppression (X)
   - Confirmer

### Pour les Visiteurs

1. Les partenaires apparaissent automatiquement entre les sections "À propos" et "Lieu"
2. Survoler un logo pour voir les effets
3. Cliquer pour visiter le site du partenaire (si renseigné)

## Performance

### Optimisations
- Images redimensionnées côté client (économie de bande passante)
- Format PNG optimisé (qualité 95%)
- Chargement conditionnel (uniquement si partenaires présents)
- CSS animations GPU-accelerated

### Bonnes Pratiques
- Logos vectoriels recommandés pour meilleure qualité
- Fond transparent privilégié
- Résolution minimale : 400x400px recommandée

## Accessibilité

### Standards Respectés
- **ARIA labels** : Descriptions claires
- **Keyboard navigation** : Focus visible
- **Screen readers** : Textes alternatifs
- **Contrast ratios** : Conformité WCAG

### Exemples
```tsx
<a
  href={partner.website_url}
  aria-label={`Visiter le site de ${partner.name}`}
  className="focus:ring-4 focus:ring-blue-300"
>
```

## Maintenance

### Points de Vigilance
- Quota storage Supabase
- Taille maximale des fichiers
- Formats d'image supportés
- Performance avec nombreux partenaires

### Monitoring
- Surveiller l'usage du bucket storage
- Vérifier les logs d'upload
- Tester la performance de chargement

## Support

Pour toute question ou problème :
1. Vérifier les logs de la console navigateur
2. Vérifier les policies RLS dans Supabase
3. Vérifier les permissions du bucket storage
4. Tester avec différents formats d'image

## Évolutions Futures

### Améliorations Possibles
- [ ] Support de SVG
- [ ] Compression d'image côté serveur
- [ ] Édition de logo après upload
- [ ] Catégories de partenaires
- [ ] Niveaux de partenariat (Or, Argent, Bronze)
- [ ] Statistiques de clics
- [ ] Import en masse
- [ ] Templates de présentation

## Changelog

### Version 1.0 (2025-11-20)
- ✅ Création du module
- ✅ Upload et traitement d'images
- ✅ Affichage public avec effets
- ✅ Gestion complète CRUD
- ✅ Réorganisation drag & drop
- ✅ RLS et sécurité
- ✅ Responsive design
