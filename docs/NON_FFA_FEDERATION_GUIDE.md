# Guide du système de fédérations non-FFA

## Vue d'ensemble

Ce système permet aux organisateurs d'événements affiliés à des fédérations autres que la FFA (UFOLEP, UGSEL, UNSS, etc.) de gérer les inscriptions avec upload de décharges de responsabilité, signature manuelle, et validation par l'organisateur.

## Architecture du système

### 1. Tables de base de données

#### `federations`
- **Nouvelles colonnes** :
  - `requires_license` (boolean) : Si true, une licence est requise
  - `requires_liability_waiver` (boolean) : Si true, une décharge de responsabilité est requise

#### `sport_icons`
Pictogrammes visuels pour identifier les sports :
- Course à pied, Trail, Marathon, Cyclisme, VTT, Natation, Triathlon, etc.
- Catégories : `running`, `cycling`, `swimming`, `triathlon`, `team_sports`, `other`

#### `disciplines`
Disciplines sportives liées aux pictogrammes :
- Semi-marathon, 10km, 5km, Trail, VTT, Triathlon Sprint, etc.

#### `liability_waivers`
Décharges de responsabilité uploadées par les athlètes :
- `athlete_id` : Référence vers l'athlète
- `entry_id` : Référence vers l'inscription
- `file_url` : URL du fichier uploadé
- `status` : `pending`, `approved`, `rejected`
- `rejection_reason` : Raison du rejet si applicable
- `validated_by` : Admin/organisateur qui a validé
- `validated_at` : Date de validation

#### `registration_rejections`
Historique des rejets d'inscription :
- `entry_id` : Inscription rejetée
- `rejected_by` : Utilisateur qui a rejeté
- `reason` : Raison du rejet
- `requires_new_waiver` : Si un nouveau document est requis
- `notification_sent` : Si l'athlète a été notifié

#### Modifications des tables existantes

**`events`** :
- `federation_id` : Fédération de rattachement
- `discipline_id` : Discipline sportive principale

**`races`** :
- `requires_liability_waiver` : Active l'obligation de décharge
- `waiver_template_url` : URL du modèle de décharge à télécharger

**`entries`** :
- `liability_waiver_id` : Référence vers la décharge uploadée
- `waiver_accepted` : Case à cocher acceptée
- `waiver_accepted_at` : Date d'acceptation
- `signature_data` : Données de la signature (base64/JSON)
- `signature_ip` : Adresse IP de la signature
- `signature_user_agent` : User agent lors de la signature

### 2. Configuration du bucket de stockage

**IMPORTANT** : Le bucket `liability-waivers` doit être créé manuellement dans Supabase Dashboard.

#### Étapes de configuration :

1. **Créer le bucket** :
   - Aller dans Storage > Create bucket
   - Nom : `liability-waivers`
   - Public : Non (décoché)

2. **Configurer les politiques RLS** :

```sql
-- Les athlètes peuvent uploader leurs décharges
CREATE POLICY "athletes_upload_own_waivers"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'liability-waivers'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM athletes WHERE user_id = auth.uid()
    )
  );

-- Les athlètes peuvent voir leurs propres décharges
CREATE POLICY "athletes_view_own_waivers"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'liability-waivers'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM athletes WHERE user_id = auth.uid()
    )
  );

-- Les organisateurs peuvent voir les décharges de leurs événements
CREATE POLICY "organizers_view_event_waivers"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'liability-waivers'
    AND (storage.foldername(name))[1] IN (
      SELECT e.athlete_id::text
      FROM entries e
      JOIN races r ON r.id = e.race_id
      JOIN events ev ON ev.id = r.event_id
      JOIN organizers o ON o.id = ev.organizer_id
      WHERE o.user_id = auth.uid()
    )
  );

-- Les admins ont un accès complet
CREATE POLICY "admins_full_access_waivers"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'liability-waivers'
    AND public.is_admin(auth.uid())
  );
```

3. **Configurer les types de fichiers acceptés** :
   - PDF : `application/pdf`
   - Images : `image/jpeg`, `image/png`, `image/jpg`
   - Taille max : 10 MB

### 3. Workflow d'inscription pour fédérations non-FFA

#### Étape 1 : Configuration de l'événement
L'organisateur configure :
1. La fédération de rattachement (UFOLEP, UGSEL, etc.)
2. La discipline sportive
3. Pour chaque course, active `requires_liability_waiver`
4. Optionnel : Upload d'un modèle de décharge

#### Étape 2 : Inscription de l'athlète
1. L'athlète remplit le formulaire d'inscription
2. Coche la case d'acceptation de la décharge
3. Upload le document de décharge (PDF/image)
4. Signe manuellement (optionnel selon configuration)
5. Valide l'inscription

#### Étape 3 : Validation par l'organisateur
1. L'organisateur voit la liste des inscriptions en attente
2. Consulte chaque décharge uploadée
3. **Accepte** : L'inscription est confirmée
4. **Rejette** : Spécifie la raison et demande un nouveau document

#### Étape 4 : Notification et re-upload
1. L'athlète reçoit un email de rejet avec la raison
2. Un lien permet de re-uploader un document valide
3. Le processus de validation recommence

### 4. Pictogrammes et disciplines

Le système inclut une galerie complète de pictogrammes sportifs :

**Catégories disponibles** :
- 🏃 Course à pied (running)
- 🚴 Cyclisme (cycling)
- 🏊 Natation (swimming)
- 🏊‍♂️🚴‍♀️🏃 Triathlon (triathlon)
- ⚽🏀🏐 Sports d'équipe (team_sports)
- 🥾 Autres (hiking, marche nordique, etc.)

**Disciplines pré-configurées** :
- Course : 5km, 10km, Semi-marathon, Marathon, Trail
- Cyclisme : Route, VTT, Cyclosportive
- Natation : Piscine, Eau libre
- Triathlon : Sprint, Olympique, Longue distance
- Multi-sports : Duathlon, Aquathlon, Swimrun, Relais, Ekiden

### 5. Sécurité et conformité

#### RLS (Row Level Security)
Toutes les tables sont protégées par des politiques RLS :
- Les athlètes accèdent uniquement à leurs données
- Les organisateurs accèdent uniquement aux données de leurs événements
- Les admins ont un accès complet pour le support

#### RGPD et données personnelles
- Les décharges contiennent des données sensibles
- Stockage sécurisé dans Supabase Storage
- Traçabilité complète : IP, user agent, timestamps
- Droit à l'effacement respecté via CASCADE DELETE

#### Audit et traçabilité
- Table `registration_rejections` : historique complet
- Timestamps sur toutes les actions
- Identification des validateurs
- Logs d'activité admin

### 6. Fédérations supportées

Le système est pré-configuré pour les fédérations suivantes :

| Fédération | Code | Licence requise | Décharge requise |
|-----------|------|-----------------|------------------|
| FFA | FFA | ✅ Oui | ❌ Non |
| UFOLEP | UFOLEP | ❌ Non | ✅ Oui |
| UGSEL | UGSEL | ❌ Non | ✅ Oui |
| UNSS | UNSS | ❌ Non | ✅ Oui |
| FF Sports pour Tous | FFSPT | ❌ Non | ✅ Oui |
| FSCF | FSCF | ❌ Non | ✅ Oui |
| FF Handisport | FFH | ❌ Non | ✅ Oui |
| Autre | AUTRE | ❌ Non | ✅ Oui |

### 7. API et intégrations

#### Endpoints principaux

**Upload de décharge** :
```typescript
const { data, error } = await supabase.storage
  .from('liability-waivers')
  .upload(`${athleteId}/${filename}`, file);
```

**Créer une entrée waiver** :
```typescript
const { data, error } = await supabase
  .from('liability_waivers')
  .insert({
    athlete_id: athleteId,
    entry_id: entryId,
    file_url: fileUrl,
    file_name: fileName,
    file_size: fileSize,
    mime_type: mimeType,
    status: 'pending'
  });
```

**Valider/Rejeter une décharge** :
```typescript
// Approuver
const { error } = await supabase
  .from('liability_waivers')
  .update({
    status: 'approved',
    validated_by: userId,
    validated_at: new Date().toISOString()
  })
  .eq('id', waiverId);

// Rejeter
const { error: rejectError } = await supabase
  .from('liability_waivers')
  .update({
    status: 'rejected',
    rejection_reason: reason,
    validated_by: userId,
    validated_at: new Date().toISOString()
  })
  .eq('id', waiverId);

// Créer un enregistrement de rejet
const { error: rejectionError } = await supabase
  .from('registration_rejections')
  .insert({
    entry_id: entryId,
    rejected_by: userId,
    reason: reason,
    requires_new_waiver: true
  });
```

### 8. Interface utilisateur

#### Composants à créer

1. **`FederationSelector.tsx`** : Sélecteur de fédération pour l'organisateur
2. **`DisciplinePicker.tsx`** : Sélecteur de discipline avec pictogrammes
3. **`LiabilityWaiverUpload.tsx`** : Upload de décharge avec preview
4. **`ManualSignaturePad.tsx`** : Pad de signature manuelle
5. **`OrganizerWaiverValidator.tsx`** : Interface de validation organisateur
6. **`WaiverRejectionForm.tsx`** : Formulaire de rejet avec raison
7. **`AthleteWaiverReupload.tsx`** : Interface de re-upload pour l'athlète

### 9. Notifications email

Le système envoie automatiquement des emails :

**À l'athlète** :
- Confirmation d'inscription avec décharge en attente
- Notification de validation de décharge
- Notification de rejet avec lien de re-upload

**À l'organisateur** :
- Nouvelle décharge à valider
- Rappel de décharges en attente

### 10. Tests recommandés

#### Scénarios de test

1. **Inscription classique** :
   - Inscription avec upload de décharge valide
   - Validation par l'organisateur
   - Confirmation finale

2. **Rejet et re-upload** :
   - Inscription avec décharge invalide
   - Rejet par l'organisateur avec raison
   - Re-upload par l'athlète
   - Validation finale

3. **Cas limites** :
   - Fichier trop volumineux (> 10MB)
   - Format de fichier invalide
   - Tentative d'upload sans authentification
   - Accès à la décharge d'un autre athlète (doit échouer)

4. **Permissions** :
   - Vérifier que l'organisateur A ne peut pas voir les décharges de l'organisateur B
   - Vérifier que l'athlète ne peut pas modifier le statut de validation
   - Vérifier les accès admin

---

## Prochaines étapes

1. ✅ Créer le bucket `liability-waivers` dans Supabase Dashboard
2. ✅ Appliquer les politiques RLS sur le bucket
3. 🔄 Créer les composants UI React
4. 🔄 Implémenter le workflow d'upload
5. 🔄 Implémenter l'interface de validation organisateur
6. 🔄 Créer les emails de notification
7. ⏳ Tests end-to-end
8. ⏳ Documentation utilisateur finale

---

## Support et maintenance

### Monitoring
- Surveiller la taille du bucket `liability-waivers`
- Vérifier les logs d'erreurs d'upload
- Monitorer les temps de validation

### Nettoyage
Les décharges sont automatiquement supprimées via CASCADE DELETE quand :
- L'athlète est supprimé
- L'inscription est supprimée

### Backup
Inclure le bucket `liability-waivers` dans les backups réguliers de Supabase.
