# Synthèse des Contraintes - Module Événements

## 📋 Vue d'ensemble

Ce document récapitule toutes les contraintes et relations du module événements après audit complet.

---

## 🎯 Table `events`

### Contraintes CHECK
- `status` : `'draft' | 'published' | 'cancelled' | 'completed'`
- `event_type` : `'running' | 'trail' | 'triathlon' | 'cycling' | 'swimming' | 'obstacle' | 'walking' | 'other'`

### Colonnes NOT NULL
- `id`, `name`, `slug`, `start_date`

### Relations
- **FOREIGN KEY** : `organizer_id` → `organizers.id`

### Index uniques
- `slug` (unique par événement)

---

## 🏃 Table `races`

### Contraintes CHECK
- `status` : `'active' | 'full' | 'cancelled'`
  - ⚠️ **ATTENTION** : Pas de statut `'draft'` autorisé !

### Colonnes NOT NULL
- `id`, `event_id`, `name`

### Relations
- **FOREIGN KEY** : `event_id` → `events.id`

### Colonnes optionnelles
- `distance` (numeric)
- `elevation_gain` (numeric)
- `start_time` (time)
- `max_participants` (integer)
- `description` (text)
- `gpx_file_url` (text)
- `elevation_profile` (jsonb)

---

## 💰 Table `pricing_periods`

### Contraintes CHECK
- `end_date > start_date`

### Colonnes NOT NULL
- `id`, `race_id`, `name`, `start_date`, `end_date`

### Relations
- **FOREIGN KEY** : `race_id` → `races.id` (CASCADE on delete)

---

## 💵 Table `race_pricing`

### Contraintes CHECK
- `price_cents >= 0`

### Colonnes NOT NULL
- `id`, `race_id`, `pricing_period_id`, `license_type_id`, `price_cents`

### Relations
- **FOREIGN KEY** : `race_id` → `races.id`
- **FOREIGN KEY** : `pricing_period_id` → `pricing_periods.id`
- **FOREIGN KEY** : `license_type_id` → `license_types.id`

### Index uniques
- (`race_id`, `pricing_period_id`, `license_type_id`) : combinaison unique

---

## 🎟️ Table `invitations`

### Contraintes CHECK
- `invitation_type` : `'partner' | 'volunteer' | 'vip' | 'press'`
- `status` : `'sent' | 'used' | 'expired' | 'revoked'`

### Colonnes NOT NULL
- `id`, `event_id`, `invited_email`, `invited_name`, `invitation_code`, `invitation_type`, `status`

### Relations
- **FOREIGN KEY** : `event_id` → `events.id`
- **FOREIGN KEY** : `race_id` → `races.id` (optionnel)
- **FOREIGN KEY** : `created_by` → `organizers.id`
- **FOREIGN KEY** : `used_by_registration_id` → `registrations.id` (optionnel)

### Index uniques
- `invitation_code` (unique global)

---

## 🎁 Table `promo_codes`

### Contraintes CHECK
- `discount_type` : `'percentage' | 'fixed_amount'`
- `discount_value > 0`
- `usage_type` : `'single' | 'multiple' | 'unlimited'`
- Si `usage_type != 'unlimited'` alors `max_uses IS NOT NULL`
- Si `valid_from` et `valid_until` définis : `valid_until > valid_from`

### Colonnes NOT NULL
- `id`, `event_id`, `code`, `discount_type`, `discount_value`, `usage_type`

### Relations
- **FOREIGN KEY** : `event_id` → `events.id`
- **FOREIGN KEY** : `race_id` → `races.id` (optionnel)
- **FOREIGN KEY** : `license_type_id` → `license_types.id` (optionnel)
- **FOREIGN KEY** : `created_by` → `organizers.id`

### Index uniques
- `code` (unique global)

---

## 🔢 Table `bib_number_config`

### Contraintes CHECK
- `assignment_strategy` : `'sequential' | 'by_gender' | 'by_category' | 'by_race' | 'manual'`
- `range_end > range_start`
- Si `assignment_strategy = 'by_gender'` alors tous les champs `male_range_*` et `female_range_*` NOT NULL

### Colonnes NOT NULL
- `id`, `event_id`, `range_start`, `range_end`, `assignment_strategy`

### Relations
- **FOREIGN KEY** : `event_id` → `events.id` (unique par event)
- **FOREIGN KEY** : `locked_by` → `admin_users.id` (optionnel)

### Index uniques
- `event_id` (une seule config par événement)

---

## ✅ Corrections Appliquées

### 1. Statuts des courses (`races.status`)
- ❌ Ancien code : `status: 'draft'`
- ✅ Nouveau code : `status: 'active'`

### 2. Statuts des événements (`events.status`)
- Par défaut : `'published'` pour les nouveaux événements
- Valeurs autorisées : `'draft' | 'published' | 'cancelled' | 'completed'`

### 3. Badges de statut
Ajout des statuts manquants dans les fonctions `getStatusBadge()` :
- `active` : Actif (vert)
- `full` : Complet (orange)
- `cancelled` : Annulé (rouge)
- `completed` : Terminé (gris/bleu)

---

## 🔗 Schéma de Relations

```
events (1) ──┬──> (N) races
             │
             ├──> (N) invitations
             │
             ├──> (N) promo_codes
             │
             └──> (1) bib_number_config

races (1) ───┬──> (N) pricing_periods
             │
             ├──> (N) race_pricing
             │
             ├──> (N) invitations (optionnel)
             │
             └──> (N) promo_codes (optionnel)

pricing_periods (1) ──> (N) race_pricing

license_types (1) ──┬──> (N) race_pricing
                    │
                    └──> (N) promo_codes (optionnel)

organizers (1) ──┬──> (N) events
                 │
                 ├──> (N) invitations (created_by)
                 │
                 └──> (N) promo_codes (created_by)
```

---

## 🎯 Recommandations

1. **Statut `draft` pour races** : Envisager d'ajouter `'draft'` aux valeurs autorisées si besoin futur
2. **Validation côté frontend** : Toujours valider les statuts avant insertion
3. **Gestion des cascades** : Attention aux suppressions d'événements (vérifier les données liées)
4. **Documentation API** : Maintenir cette doc à jour lors de modifications du schéma

---

**Date de génération** : 2025-10-15
**Version du schéma** : v1.0
