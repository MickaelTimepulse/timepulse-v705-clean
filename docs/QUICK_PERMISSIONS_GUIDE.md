# Guide Rapide - Permissions TimePulse v705

## 🚀 Démarrage Rapide

### Accorder toutes les permissions d'un module à un utilisateur

```sql
-- Exemple: Donner accès complet aux diplômes
SELECT assign_module_permissions(
  '123e4567-e89b-12d3-a456-426614174000'::uuid,  -- UUID de l'utilisateur
  'certificates'  -- Module à assigner
);
```

---

## 📦 Modules les Plus Utilisés

### 1. 🏆 Diplômes (Certificates)
**Pour qui ?** Équipe événementielle, graphistes
```sql
SELECT assign_module_permissions(user_id, 'certificates');
```
**Permet de :**
- Créer des templates de diplômes personnalisés
- Modifier l'apparence (polices, couleurs, effets)
- Générer des diplômes pour les participants
- Gérer les drapeaux de nationalité

---

### 2. 📊 Résultats Externes (External Results)
**Pour qui ?** Responsables résultats, data managers
```sql
SELECT assign_module_permissions(user_id, 'external_results');
```
**Permet de :**
- Ajouter des événements non-TimePulse
- Importer des résultats d'autres courses
- Enrichir les profils athlètes
- Calculer l'indice TimePulse global

---

### 3. 🤝 Partenaires (Partners)
**Pour qui ?** Équipe commerciale, marketing
```sql
SELECT assign_module_permissions(user_id, 'partners');
```
**Permet de :**
- Ajouter les logos partenaires sur les événements
- Gérer les niveaux de partenariat (Or, Argent, Bronze)
- Afficher les partenaires sur les pages événements

---

### 4. 👥 Bénévoles (Volunteers)
**Pour qui ?** Coordinateurs bénévoles
```sql
SELECT assign_module_permissions(user_id, 'volunteers');
```
**Permet de :**
- Créer des postes de bénévolat
- Gérer les inscriptions bénévoles
- Importer des listes CSV
- Exporter les plannings

---

### 5. 🚗 Covoiturage (Carpooling)
**Pour qui ?** Modérateurs communauté
```sql
SELECT assign_module_permissions(user_id, 'carpooling');
```
**Permet de :**
- Modérer les offres de covoiturage
- Approuver/refuser les annonces
- Gérer les réservations

---

### 6. 🔄 Échanges de Dossards (Bib Exchange)
**Pour qui ?** Équipe support
```sql
SELECT assign_module_permissions(user_id, 'bib_exchange');
```
**Permet de :**
- Modérer les échanges de dossards
- Configurer les dates d'ouverture
- Gérer les transferts entre participants

---

## 🎭 Profils Types

### Profil: Gestionnaire d'Événement Complet
```sql
DO $$
DECLARE
  v_user_id uuid := 'VOTRE_USER_ID'::uuid;
BEGIN
  PERFORM assign_module_permissions(v_user_id, 'events');
  PERFORM assign_module_permissions(v_user_id, 'entries');
  PERFORM assign_module_permissions(v_user_id, 'results');
  PERFORM assign_module_permissions(v_user_id, 'certificates');
  PERFORM assign_module_permissions(v_user_id, 'partners');
  PERFORM assign_module_permissions(v_user_id, 'volunteers');
END $$;
```

**Accès total :**
- Événements
- Inscriptions
- Résultats
- Diplômes
- Partenaires
- Bénévoles

---

### Profil: Responsable Diplômes Uniquement
```sql
DO $$
DECLARE
  v_user_id uuid := 'VOTRE_USER_ID'::uuid;
BEGIN
  -- Accès complet diplômes
  PERFORM assign_module_permissions(v_user_id, 'certificates');

  -- Lecture seule événements et résultats
  INSERT INTO admin_user_permissions (user_id, permission_id, granted)
  SELECT v_user_id, id, true
  FROM admin_permissions
  WHERE (module = 'events' AND permission = 'view')
     OR (module = 'results' AND permission = 'view')
  ON CONFLICT (user_id, permission_id) DO UPDATE SET granted = true;

  -- Accès aux assets (pour les logos)
  PERFORM assign_module_permissions(v_user_id, 'email_assets');
END $$;
```

---

### Profil: Modérateur Communauté
```sql
DO $$
DECLARE
  v_user_id uuid := 'VOTRE_USER_ID'::uuid;
BEGIN
  PERFORM assign_module_permissions(v_user_id, 'carpooling');
  PERFORM assign_module_permissions(v_user_id, 'bib_exchange');
  PERFORM assign_module_permissions(v_user_id, 'videos');
END $$;
```

---

## 🔍 Commandes Utiles

### Voir les permissions d'un utilisateur
```sql
-- Remplacer USER_EMAIL par l'email de l'utilisateur
SELECT
  p.module,
  p.permission,
  p.label
FROM admin_user_permissions up
JOIN admin_permissions p ON p.id = up.permission_id
JOIN admin_users au ON au.id = up.user_id
WHERE au.email = 'USER_EMAIL@example.com'
  AND up.granted = true
ORDER BY p.module, p.permission;
```

### Lister tous les modules disponibles
```sql
SELECT * FROM get_available_modules();
```

### Révoquer l'accès à un module
```sql
-- Supprimer toutes les permissions du module "certificates"
DELETE FROM admin_user_permissions
WHERE user_id = 'USER_UUID'::uuid
  AND permission_id IN (
    SELECT id FROM admin_permissions WHERE module = 'certificates'
  );
```

---

## 📱 Interface Admin

Une fois les permissions accordées, l'utilisateur verra apparaître automatiquement les sections correspondantes dans son menu admin :

| Permission | Menu visible |
|------------|--------------|
| `certificates` | 🏆 Diplômes |
| `external_results` | 📊 Résultats Externes |
| `partners` | 🤝 Partenaires |
| `volunteers` | 👥 Bénévoles |
| `speakers` | 🎤 Speakers |
| `carpooling` | 🚗 Covoiturage |
| `bib_exchange` | 🔄 Échanges Dossards |
| `videos` | 🎬 Vidéos |
| `athletes` | 🏃 Athlètes |
| `email_templates` | 📧 Templates Emails |
| `monitoring` | 📈 Monitoring |
| `audit` | 📋 Audit |

---

## ⚠️ Sécurité

### Bonnes pratiques
1. ✅ Accordez uniquement les permissions nécessaires
2. ✅ Utilisez les profils types comme base
3. ✅ Auditez régulièrement les permissions
4. ✅ Révoquez immédiatement les accès inutiles
5. ✅ Documentez pourquoi vous accordez chaque permission

### Permissions sensibles
Ces permissions nécessitent une attention particulière :

- `users.delete` - Supprimer des administrateurs
- `finance.manage` - Modifier les commissions
- `settings.edit` - Modifier les paramètres système
- `deployment.deploy` - Déployer le site
- `backups.restore` - Restaurer des sauvegardes

---

## 📞 Support

Pour toute question sur les permissions :
1. Consultez `ADMIN_PERMISSIONS_COMPLETE_GUIDE.md`
2. Utilisez les exemples dans `PERMISSIONS_EXAMPLES.sql`
3. Contactez l'équipe technique TimePulse

---

**Version** : v705
**Dernière mise à jour** : 3 Décembre 2025
