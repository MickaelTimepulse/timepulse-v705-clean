# Module Speaker - Sécurité et Confidentialité des Données

## 🔒 Politique de Confidentialité

Le Module Speaker est conçu avec la **protection des données personnelles** comme priorité absolue. Le speaker n'a accès qu'aux informations nécessaires pour préparer ses commentaires sportifs.

---

## ✅ Données ACCESSIBLES par le Speaker

### Données de Base (Toujours Accessibles)
- **Nom et Prénom** du participant
- **Année de naissance** (pour calculer la catégorie)
- **Sexe** (H/F)
- **Catégorie d'âge** (SE, V1, V2, CA, JU, etc.)
- **Numéro de dossard**
- **Club / Association / Entreprise**
- **Ville** (optionnel selon configuration organisateur)
- **Nationalité** (optionnel selon configuration organisateur)

### Données Sportives (Selon Autorisation Organisateur)
- **Temps de référence** sur la distance
- **Indice Timepulse** (si activé par l'organisateur)
- **Indice BetRAIL** (si activé par l'organisateur)
- **Indice UTMB** (si activé par l'organisateur)
- **Historique des classements** (résultats passés si activé)
- **Statistiques de l'événement** (si activé)

### Données Événement
- **Liste des sponsors** à mentionner
- **Statistiques globales** (nombre d'inscrits, répartition H/F, etc.)
- **Informations sur les courses** (distances, dénivelés, etc.)

---

## ❌ Données INTERDITES au Speaker

Le speaker n'a **JAMAIS** accès aux données suivantes :

### Coordonnées Personnelles
- ❌ **Adresse email**
- ❌ **Numéro de téléphone**
- ❌ **Adresse postale complète**
- ❌ **Code postal complet** (sauf ville si autorisé)

### Données Sensibles
- ❌ **Numéro de licence FFA/FFTri**
- ❌ **Certificat médical**
- ❌ **Document d'identité**
- ❌ **Date de naissance complète** (seulement l'année)

### Données Financières
- ❌ **Informations de paiement**
- ❌ **Montant payé**
- ❌ **Code promo utilisé**
- ❌ **Statut de paiement**
- ❌ **Remboursements**

### Données Administratives
- ❌ **Code de gestion de l'inscription**
- ❌ **Statut de validation** (confirmé, en attente, annulé)
- ❌ **Notes internes de l'organisateur**
- ❌ **Historique de modification**

---

## 🛡️ Mesures de Sécurité Techniques

### 1. Authentification
- Accès par **code unique** de 8 caractères
- Code généré aléatoirement et vérifié en base de données
- Pas de compte utilisateur, pas de mot de passe à mémoriser
- Session limitée dans le temps (dates définies par l'organisateur)

### 2. Row Level Security (RLS) Supabase
Toutes les requêtes sont filtrées au niveau de la base de données :

```sql
-- Le speaker peut uniquement voir les données autorisées
CREATE POLICY "Speaker can read authorized participant data"
ON entries FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM speaker_access
    WHERE speaker_access.event_id = entries.event_id
    AND speaker_access.is_enabled = true
    AND speaker_access.start_date <= now()
    AND speaker_access.end_date >= now()
  )
);
```

### 3. Champs Masqués par la Vue
Une vue SQL dédiée `speaker_participant_view` expose uniquement les colonnes autorisées :

```sql
CREATE VIEW speaker_participant_view AS
SELECT
  e.id,
  e.bib_number,
  e.first_name,
  e.last_name,
  EXTRACT(YEAR FROM e.birth_date) as birth_year,
  e.gender,
  e.category,
  e.club,
  e.city,
  e.nationality,
  e.race_id,
  r.name as race_name,
  -- Données optionnelles (filtrées par speaker_access)
  CASE WHEN sa.show_timepulse_index THEN a.timepulse_index ELSE NULL END as timepulse_index,
  CASE WHEN sa.show_betrail_index THEN a.betrail_index ELSE NULL END as betrail_index,
  CASE WHEN sa.show_utmb_index THEN a.utmb_index ELSE NULL END as utmb_index
FROM entries e
JOIN races r ON r.id = e.race_id
LEFT JOIN athletes a ON a.id = e.athlete_id
JOIN speaker_access sa ON sa.event_id = r.event_id
WHERE sa.is_enabled = true
  AND sa.start_date <= now()
  AND sa.end_date >= now();
```

### 4. Logs et Traçabilité
Toutes les actions du speaker sont enregistrées :
- Connexion/Déconnexion
- Consultation de participants
- Ajout/retrait de favoris
- Création de listes
- Export PDF
- Mention de sponsors

### 5. Expiration Automatique
- L'accès est automatiquement révoqué après la `end_date`
- L'organisateur peut désactiver l'accès à tout moment
- Le code devient invalide si le module est désactivé

---

## 📊 Conformité RGPD

### Base Légale
- **Intérêt légitime** : Amélioration de l'expérience événementielle
- **Minimisation des données** : Seules les données strictement nécessaires
- **Durée limitée** : Accès temporaire défini par l'organisateur

### Droits des Participants
Les participants gardent tous leurs droits :
- **Droit d'accès** : Via leur espace personnel
- **Droit de rectification** : Modification de leurs données
- **Droit d'opposition** : Possibilité de masquer leur nom (option future)
- **Droit à l'oubli** : Suppression après l'événement

### Transparence
- Les participants sont informés lors de l'inscription
- Mention dans les CGV de l'événement
- Possibilité d'opt-out (fonctionnalité à venir)

---

## 🔐 Recommandations pour l'Organisateur

### Avant d'Activer le Module
1. ✅ Vérifier que votre speaker est de confiance
2. ✅ Définir une période d'accès courte (J-7 à J+1 de l'événement)
3. ✅ N'activer que les données réellement utiles (indices, temps)
4. ✅ Informer vos participants dans la communication événement

### Pendant l'Événement
1. ✅ Surveiller le journal d'activité
2. ✅ Pouvoir désactiver l'accès en un clic si besoin
3. ✅ Vérifier que le speaker respecte la confidentialité

### Après l'Événement
1. ✅ Désactiver le module ou attendre l'expiration automatique
2. ✅ Consulter les logs pour audit si nécessaire
3. ✅ Les données restent stockées pour historique organisateur uniquement

---

## 🚨 Que Faire en Cas de Problème ?

### Si le Speaker Abuse de l'Accès
1. Désactiver immédiatement le module (toggle OFF)
2. Consulter le journal d'activité
3. Contacter Timepulse si nécessaire : contact@timepulsesports.com

### Si un Participant se Plaint
1. Expliquer la limitation des données accessibles
2. Montrer la politique de confidentialité
3. Proposer de masquer ses données (option future)

### Si le Code est Compromis
1. Désactiver le module
2. Attendre 24h
3. Réactiver avec un nouveau code généré automatiquement

---

## 📝 Résumé des Bonnes Pratiques

| ✅ À FAIRE | ❌ À ÉVITER |
|-----------|------------|
| Limiter la période d'accès (7 jours max) | Laisser l'accès ouvert toute l'année |
| N'activer que les données nécessaires | Activer tous les indices par défaut |
| Choisir un speaker professionnel | Partager le code publiquement |
| Surveiller le journal d'activité | Ne jamais consulter les logs |
| Désactiver après l'événement | Oublier de fermer l'accès |
| Informer les participants | Garder le secret sur cette fonctionnalité |

---

## 📞 Support

Pour toute question sur la sécurité du Module Speaker :
- **Email** : contact@timepulsesports.com
- **Documentation** : https://timepulsesports.com/docs/speaker-module
- **Site web** : https://timepulsesports.com

---

**Dernière mise à jour** : 18 novembre 2025
**Version** : 1.0
**Responsable** : Équipe Sécurité Timepulse
