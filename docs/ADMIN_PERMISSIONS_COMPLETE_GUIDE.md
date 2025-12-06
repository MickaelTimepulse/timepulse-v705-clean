# Guide Complet des Permissions Administrateur TimePulse

## 📋 Vue d'ensemble

Le système de permissions TimePulse permet de gérer finement les accès des utilisateurs administrateurs. Chaque module peut avoir plusieurs permissions (view, create, edit, delete, etc.).

## 🎯 Modules Disponibles

### 1. **Dashboard** (1 permission)
- `view` - Voir le tableau de bord

### 2. **Events** (4 permissions)
- `view` - Voir les événements
- `create` - Créer des événements
- `edit` - Modifier les événements
- `delete` - Supprimer les événements

### 3. **Organizers** (4 permissions)
- `view` - Voir les organisateurs
- `create` - Créer des organisateurs
- `edit` - Modifier les organisateurs
- `delete` - Supprimer les organisateurs

### 4. **Entries** (4 permissions)
- `view` - Voir les inscriptions
- `edit` - Modifier les inscriptions
- `delete` - Supprimer les inscriptions
- `export` - Exporter les inscriptions

### 5. **Results** (4 permissions)
- `view` - Voir les résultats
- `import` - Importer les résultats
- `edit` - Modifier les résultats
- `delete` - Supprimer les résultats

### 6. **Certificates** (5 permissions) 🆕
- `view` - Voir les diplômes
- `create` - Créer des templates de diplômes
- `edit` - Modifier les templates existants
- `delete` - Supprimer des templates
- `generate` - Générer des diplômes pour les participants

### 7. **External Results** (5 permissions) 🆕
- `view` - Voir les résultats externes
- `create` - Créer des événements externes
- `edit` - Modifier les résultats externes
- `delete` - Supprimer des résultats externes
- `import` - Importer des fichiers de résultats

### 8. **Partners** (4 permissions) 🆕
- `view` - Voir les partenaires
- `create` - Créer des partenaires
- `edit` - Modifier les partenaires
- `delete` - Supprimer les partenaires

### 9. **Volunteers** (4 permissions) 🆕
- `view` - Voir les bénévoles
- `create` - Créer des postes bénévoles
- `edit` - Modifier les inscriptions bénévoles
- `delete` - Supprimer les bénévoles

### 10. **Speakers** (4 permissions) 🆕
- `view` - Voir les speakers
- `create` - Créer des comptes speakers
- `edit` - Modifier les speakers
- `delete` - Supprimer les speakers

### 11. **Carpooling** (3 permissions) 🆕
- `view` - Voir le covoiturage
- `moderate` - Approuver/refuser les offres
- `delete` - Supprimer des covoiturages

### 12. **Bib Exchange** (4 permissions) 🆕
- `view` - Voir les échanges de dossards
- `moderate` - Approuver/refuser les échanges
- `delete` - Supprimer des échanges
- `settings` - Configurer les dates d'ouverture

### 13. **Videos** (4 permissions) 🆕
- `view` - Voir les vidéos
- `create` - Ajouter de nouvelles vidéos
- `edit` - Modifier les vidéos existantes
- `delete` - Supprimer des vidéos

### 14. **Athletes** (5 permissions) 🆕
- `view` - Voir les athlètes
- `create` - Créer de nouveaux profils
- `edit` - Modifier les profils existants
- `delete` - Supprimer des profils
- `merge` - Fusionner des doublons

### 15. **Email** (2 permissions)
- `view` - Voir les emails
- `send` - Envoyer des emails aux participants

### 16. **Email Templates** (4 permissions) 🆕
- `view` - Voir les templates d'emails
- `create` - Créer de nouveaux templates
- `edit` - Modifier les templates existants
- `delete` - Supprimer des templates

### 17. **Email Variables** (4 permissions) 🆕
- `view` - Voir les variables d'emails
- `create` - Créer de nouvelles variables
- `edit` - Modifier les variables
- `delete` - Supprimer des variables

### 18. **Email Assets** (3 permissions) 🆕
- `view` - Voir les assets d'emails
- `upload` - Télécharger de nouveaux assets
- `delete` - Supprimer des assets

### 19. **Finance** (3 permissions)
- `view` - Voir les finances
- `manage` - Gérer les commissions
- `export` - Exporter les rapports financiers

### 20. **Carts** (2 permissions) 🆕
- `view` - Voir les paniers
- `manage` - Modifier/supprimer des paniers

### 21. **Users** (4 permissions)
- `view` - Voir les utilisateurs admin
- `create` - Créer de nouveaux admins
- `edit` - Modifier les permissions
- `delete` - Supprimer des admins

### 22. **Pages** (2 permissions)
- `view` - Voir les pages de service
- `edit` - Modifier les pages de service

### 23. **Homepage** (2 permissions) 🆕
- `view` - Voir les features homepage
- `edit` - Modifier la homepage

### 24. **Footer** (2 permissions) 🆕
- `view` - Voir le footer
- `edit` - Modifier le footer du site

### 25. **Settings** (2 permissions)
- `view` - Voir les paramètres
- `edit` - Modifier les paramètres système

### 26. **Monitoring** (2 permissions) 🆕
- `view` - Voir le monitoring
- `email` - Voir les logs emails

### 27. **Audit** (2 permissions) 🆕
- `view` - Voir les logs d'audit
- `export` - Exporter les logs

### 28. **Backups** (3 permissions)
- `view` - Voir les sauvegardes
- `create` - Créer des sauvegardes
- `restore` - Restaurer des sauvegardes

### 29. **Deployment** (2 permissions) 🆕
- `view` - Voir le déploiement
- `deploy` - Lancer un déploiement

### 30. **Project** (2 permissions) 🆕
- `view` - Voir le suivi projet
- `edit` - Modifier les tâches du projet

---

## 👥 Rôles Prédéfinis

### 1. **Super Admin**
- Accès complet à toutes les fonctionnalités
- Peut gérer les autres administrateurs
- Peut modifier toutes les permissions

### 2. **Manager**
- Gestion des événements et organisateurs
- Pas d'accès aux utilisateurs admin

### 3. **Support**
- Support client et gestion des inscriptions
- Pas d'accès aux paramètres système

### 4. **Comptable**
- Accès finance et commissions uniquement
- Consultation des inscriptions

### 5. **Éditeur**
- Gestion du contenu et des pages
- Gestion des vidéos et médias

### 6. **Gestionnaire Événements** 🆕
- Gestion complète des événements
- Gestion des diplômes, résultats et partenaires
- Idéal pour les équipes terrain

### 7. **Modérateur** 🆕
- Modération du covoiturage
- Modération des échanges de dossards
- Gestion du contenu utilisateur

---

## 🛠️ Fonctions Utiles

### Assigner toutes les permissions d'un module
```sql
SELECT assign_module_permissions(
  'user-id-here'::uuid,
  'certificates'
);
```

### Obtenir tous les modules disponibles
```sql
SELECT * FROM get_available_modules();
```

### Voir les permissions d'un utilisateur
```sql
SELECT
  p.module,
  p.permission,
  p.label,
  up.granted
FROM admin_user_permissions up
JOIN admin_permissions p ON p.id = up.permission_id
WHERE up.user_id = 'user-id-here'::uuid
ORDER BY p.module, p.permission;
```

---

## 📝 Exemples d'Utilisation

### Créer un gestionnaire d'événements complet
```sql
-- Assigner les modules principaux
SELECT assign_module_permissions('user-id', 'events');
SELECT assign_module_permissions('user-id', 'entries');
SELECT assign_module_permissions('user-id', 'results');
SELECT assign_module_permissions('user-id', 'certificates');
SELECT assign_module_permissions('user-id', 'partners');
SELECT assign_module_permissions('user-id', 'volunteers');
```

### Créer un modérateur de communauté
```sql
-- Assigner uniquement les modules de modération
SELECT assign_module_permissions('user-id', 'carpooling');
SELECT assign_module_permissions('user-id', 'bib_exchange');
SELECT assign_module_permissions('user-id', 'videos');
```

### Créer un gestionnaire de contenu
```sql
-- Assigner les modules de contenu
SELECT assign_module_permissions('user-id', 'pages');
SELECT assign_module_permissions('user-id', 'homepage');
SELECT assign_module_permissions('user-id', 'footer');
SELECT assign_module_permissions('user-id', 'videos');
SELECT assign_module_permissions('user-id', 'email_templates');
```

---

## 🔒 Bonnes Pratiques

1. **Principe du moindre privilège** : N'accordez que les permissions nécessaires
2. **Audit régulier** : Vérifiez périodiquement les permissions accordées
3. **Rôles prédéfinis** : Utilisez les rôles prédéfinis quand possible
4. **Documentation** : Documentez pourquoi certaines permissions sont accordées
5. **Révocation** : Révoquez immédiatement les permissions inutiles

---

## 📊 Statistiques Actuelles

**Total de modules** : 31
**Total de permissions** : 104+
**Rôles prédéfinis** : 7

---

## 🚀 Nouveautés v705

- ✅ Module Certificats (diplômes personnalisables)
- ✅ Module Résultats Externes
- ✅ Module Partenaires d'Événements
- ✅ Module Bénévoles
- ✅ Module Speakers
- ✅ Modération Covoiturage
- ✅ Modération Échanges de Dossards
- ✅ Gestion Athlètes avancée
- ✅ Templates d'Emails personnalisables
- ✅ Variables d'Emails dynamiques
- ✅ Assets d'Emails
- ✅ Monitoring système
- ✅ Logs d'audit détaillés
- ✅ Gestion des paniers
- ✅ Configuration Homepage
- ✅ Configuration Footer

---

**Dernière mise à jour** : 3 Décembre 2025
**Version** : v705
