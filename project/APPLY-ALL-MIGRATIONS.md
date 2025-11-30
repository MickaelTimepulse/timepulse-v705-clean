# 🚀 Guide d'application de toutes les migrations Supabase

## ⚠️ IMPORTANT

Votre base de données de production **n'a pas les tables de base** ! Vous devez appliquer toutes les migrations.

## 📋 Option 1 : Via Supabase Dashboard (RECOMMANDÉ)

### Étape 1 : Allez dans SQL Editor

1. Connectez-vous à Supabase Dashboard : https://supabase.com/dashboard/project/fgstscztsighabpzzzix
2. Cliquez sur **"SQL Editor"** dans le menu de gauche
3. Cliquez sur **"+ New query"**

### Étape 2 : Appliquer les migrations principales (dans l'ordre)

Copiez-collez le contenu de chaque fichier de migration **dans l'ordre** et cliquez sur **"Run"** après chaque fichier.

#### Migrations de base (obligatoires) :

1. **`20251014201249_create_timepulse_schema.sql`** - Crée toutes les tables de base
2. **`20251014205617_create_admin_users_fixed.sql`** - Crée la table admin_users
3. **`20251014205715_add_update_password_function.sql`** - Fonction de mise à jour mot de passe
4. **`20251014210000_create_organizer_module.sql`** - Module organisateurs
5. **`20251015070040_create_license_types.sql`** - Types de licences
6. **`20251015070105_create_pricing_periods.sql`** - Périodes de tarification
7. **`20251015070131_create_race_pricing.sql`** - Tarifs courses
8. **`20251015070340_create_audit_logs.sql`** - Logs d'audit
9. **`20251017055730_create_entries_module_v2.sql`** - Module inscriptions
10. **`20251021165340_create_race_category_restrictions.sql`** - Restrictions catégories
11. **`20251021204147_create_carpooling_module.sql`** - Module covoiturage
12. **`20251022085319_create_bib_exchange_module_v3.sql`** - Module échange de dossards
13. **`20251022130000_create_email_logs.sql`** - Logs emails
14. **`20251023140000_create_results_module.sql`** - Module résultats
15. **`20251024145052_create_payment_transactions_table.sql`** - Transactions paiement
16. **`20251027115516_create_column_mappings_table.sql`** - Mappages colonnes
17. **`20251028063650_create_email_templates_table.sql`** - Templates emails
18. **`20251101143601_20251101000001_create_athlete_ecosystem_v2.sql`** - Écosystème athlètes
19. **`20251103161512_20251103160809_create_volunteer_management_fixed.sql`** - Gestion bénévoles
20. **`20251108160639_create_footer_settings.sql`** - Paramètres footer
21. **`20251108162017_create_static_pages.sql`** - Pages statiques
22. **`20251108170000_create_videos_table.sql`** - Table vidéos
23. **`20251113213448_20251113230000_create_event_characteristics.sql`** - Caractéristiques événements
24. **`20251118000001_create_speaker_module.sql`** - Module speaker
25. **`20251119055900_fix_pgcrypto_and_reset_password.sql`** - Fix pgcrypto
26. **`20251119100000_add_admin_rls_policies_for_supabase_auth.sql`** - Politiques RLS admin

## 📋 Option 2 : Via Supabase CLI

Si vous avez installé la Supabase CLI localement :

```bash
# Se connecter à Supabase
supabase login

# Lier votre projet
supabase link --project-ref fgstscztsighabpzzzix

# Appliquer toutes les migrations
supabase db push
```

## ⚠️ Erreurs possibles

### "relation already exists"
Si vous voyez cette erreur, cela signifie que la table existe déjà. Vous pouvez ignorer cette erreur et passer à la migration suivante.

### "permission denied"
Assurez-vous d'utiliser le **service_role key** (pas la anon key) dans vos requêtes.

## ✅ Vérification

Après avoir appliqué toutes les migrations, vérifiez que les tables existent :

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Vous devriez voir au minimum :
- admin_users
- athletes
- entries
- events
- organizers
- races
- registrations
- results
- event_characteristics
- event_characteristic_types

## 🚨 IMPORTANT : Ordre d'application

**Appliquez les migrations dans l'ordre chronologique** (du plus ancien au plus récent). L'ordre est critique car certaines migrations dépendent de tables créées par les migrations précédentes.

## 💡 Conseil

Si vous avez beaucoup de migrations à appliquer, vous pouvez les regrouper dans un seul fichier SQL en les copiant les unes après les autres, puis exécuter le fichier complet. Mais attention aux erreurs qui pourraient arrêter l'exécution.

## 🆘 Besoin d'aide ?

Si vous rencontrez des erreurs, notez le numéro de la migration qui a échoué et l'erreur exacte, puis contactez le support technique.
