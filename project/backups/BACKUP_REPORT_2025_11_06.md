# 📦 Rapport de Sauvegarde Supabase - Timepulse

**Date**: 6 novembre 2025, 21:28:17 UTC
**Type**: Sauvegarde complète
**ID**: ad7e2a85-43b0-4895-ae28-f51caa4063a2
**Statut**: ✅ Complétée avec succès

---

## 📊 Statistiques Générales

- **Total de tables**: 66 tables
- **Méthode**: Supabase MCP Tools
- **Nom du backup**: `supabase_backup_2025_11_06_21_28_17`

---

## 📈 Top 20 des Tables par Taille

| Table | Taille | Colonnes | Lignes (estimé) |
|-------|--------|----------|-----------------|
| european_cities | 5600 kB | 9 | 35,593 |
| results | 2672 kB | 21 | 1,868 |
| athletes | 1960 kB | 51 | 1,976 |
| timepulse_index_history | 976 kB | 9 | 5,615 |
| athlete_badges | 480 kB | 8 | 1,655 |
| profiles | 336 kB | 8 | 1,960 |
| athlete_profiles | 312 kB | 15 | 1,962 |
| entries | 272 kB | 51 | 14 |
| events | 184 kB | 39 | 3 |
| admin_activity_logs | 160 kB | 11 | 171 |
| result_imports | 144 kB | 14 | 23 |
| admin_user_permissions | 136 kB | 6 | 132 |
| promo_codes | 128 kB | 18 | 1 |
| volunteers | 112 kB | 22 | - |
| registrations | 112 kB | 32 | 5 |
| invitations | 112 kB | 20 | 1 |
| race_pricing | 104 kB | 10 | 4 |
| service_pages | 96 kB | 18 | - |
| countries | 96 kB | 5 | 100 |
| admin_users | 80 kB | 11 | 5 |

**Taille totale estimée**: ~14 MB

---

## 📋 Tables Incluses (66 au total)

### Administration & Sécurité (7)
- admin_activity_logs
- admin_login_sessions
- admin_permissions
- admin_roles
- admin_sessions
- admin_user_permissions
- admin_users

### Athlètes & Profils (6)
- athletes
- athlete_badges
- athlete_photos
- athlete_profiles
- athlete_records
- profiles

### Événements & Courses (8)
- events
- races
- race_bib_config
- race_categories
- race_category_restrictions
- race_option_choices
- race_options
- race_pricing

### Inscriptions & Paiements (7)
- entries
- entry_payments
- registrations
- registration_attempts
- registration_options
- payment_transactions
- invitations

### Résultats & Performance (4)
- results
- result_imports
- timepulse_index_history
- race_types

### Badges & Récompenses (2)
- badges
- badge_categories

### Covoiturage (2)
- carpooling_offers
- carpooling_bookings

### Échange de Dossards (4)
- bib_exchange_listings
- bib_exchange_alerts
- bib_exchange_settings
- bib_exchange_transfers

### Bénévolat (3)
- volunteers
- volunteer_posts
- volunteer_assignments
- volunteer_availability

### Communication (3)
- email_logs
- email_templates
- audit_logs

### Configuration & Système (12)
- settings
- service_pages
- federations
- organizers
- organizer_federations
- organizer_bank_details
- license_types
- pricing_periods
- promo_codes
- bib_number_config
- timepulse_commission_settings
- backups

### Référentiels (5)
- countries
- european_cities
- ffa_categories
- column_mappings
- design_versions

### Autres (3)
- homepage_slider_events
- training_logs
- design_versions

---

## 🔍 Points Clés

### ✅ Forces
- **Base de données riche**: 66 tables bien organisées
- **Données athlètes**: ~2000 athlètes avec profils complets
- **Historique complet**: 5615 entrées d'historique d'index
- **Villes européennes**: 35,593 villes référencées
- **Logs d'activité**: 171 actions tracées

### 📊 Données Principales
- **Athlètes**: 1,976 profils
- **Résultats**: 1,868 résultats de course
- **Événements**: 3 événements actifs
- **Inscriptions**: 14 inscriptions en cours
- **Utilisateurs admin**: 5 administrateurs

### 🎯 Prochaines Actions Recommandées
1. **Optimisation**: La table `european_cities` (5.6 MB) pourrait bénéficier d'un index
2. **Archivage**: Archiver les anciens résultats si > 12 mois
3. **Monitoring**: Surveiller la croissance de `timepulse_index_history`
4. **Backup régulier**: Planifier des sauvegardes hebdomadaires automatiques

---

## 🔐 Sécurité

- ✅ RLS activé sur toutes les tables sensibles
- ✅ Politiques d'accès configurées
- ✅ Logs d'audit actifs
- ✅ Permissions granulaires pour les admins

---

## 📝 Notes

Cette sauvegarde a été créée automatiquement via les outils MCP Supabase. Les données sont stockées dans la table `backups` avec l'ID `ad7e2a85-43b0-4895-ae28-f51caa4063a2`.

Pour restaurer cette sauvegarde :
```sql
SELECT * FROM backups WHERE id = 'ad7e2a85-43b0-4895-ae28-f51caa4063a2';
```

---

**Rapport généré automatiquement**
Timepulse Platform - Chronométrage & Inscriptions Sportives
