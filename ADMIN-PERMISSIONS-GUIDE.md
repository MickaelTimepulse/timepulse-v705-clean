# 🔐 Guide des Permissions Administrateur Timepulse

## ✅ Problème Résolu

Le système de permissions a été corrigé. Maintenant, les administrateurs voient **uniquement les sections pour lesquelles ils ont des permissions**.

---

## 🎯 Fonctionnement du Système

### **Architecture des Permissions**

```
Super Admin (Accès Total)
    ↓
Admin avec Permissions Limitées
    ↓
Vérification à chaque menu
    ↓
Affichage uniquement des sections autorisées
```

---

## 📊 Tables de la Base de Données

### **1. `admin_roles`** - Rôles prédéfinis
| Rôle | Description | Super Admin |
|------|-------------|-------------|
| Super Admin | Accès complet | ✅ |
| Manager | Gestion événements/organisateurs | ❌ |
| Support | Support client et inscriptions | ❌ |
| Comptable | Finance uniquement | ❌ |
| Éditeur | Contenu du site | ❌ |

### **2. `admin_permissions`** - Permissions disponibles

#### **Module: dashboard**
- `view` - Voir le tableau de bord

#### **Module: events**
- `view` - Voir les événements
- `create` - Créer des événements
- `edit` - Modifier les événements
- `delete` - Supprimer des événements

#### **Module: organizers**
- `view` - Voir les organisateurs
- `create` - Créer des organisateurs
- `edit` - Modifier les organisateurs
- `delete` - Supprimer des organisateurs

#### **Module: entries**
- `view` - Voir les inscriptions
- `edit` - Modifier les inscriptions
- `delete` - Supprimer des inscriptions
- `export` - Exporter les données

#### **Module: results**
- `view` - Voir les résultats
- `import` - Importer les résultats
- `edit` - Modifier les résultats
- `delete` - Supprimer des résultats

#### **Module: finance**
- `view` - Voir les finances
- `manage` - Gérer les commissions
- `export` - Exporter les rapports

#### **Module: email**
- `view` - Voir l'historique des emails
- `send` - Envoyer des emails

#### **Module: pages**
- `view` - Voir les pages
- `edit` - Modifier les pages

#### **Module: users**
- `view` - Voir les utilisateurs admin
- `create` - Créer des admins
- `edit` - Modifier les permissions
- `delete` - Supprimer des admins

#### **Module: settings**
- `view` - Voir les paramètres
- `edit` - Modifier les paramètres

#### **Module: backups**
- `view` - Voir les sauvegardes
- `create` - Créer des sauvegardes
- `restore` - Restaurer des sauvegardes

### **3. `admin_user_permissions`** - Permissions par utilisateur
Associe les permissions spécifiques à chaque admin.

---

## 🔧 Comment Gérer les Permissions

### **Méthode 1 : Via l'Interface Admin**

1. **Aller dans "Utilisateurs Admin"** (`/admin/users`)
2. **Créer ou modifier un utilisateur**
3. **Sélectionner les permissions** dans l'interface
4. **Sauvegarder**

### **Méthode 2 : Via la Base de Données (Supabase)**

#### **Étape 1 : Créer un utilisateur admin**
```sql
-- Créer l'utilisateur admin
INSERT INTO admin_users (email, password_hash, name, role)
VALUES (
  'timepulseteam@timepulse.fr',
  crypt('MotDePasse123', gen_salt('bf')), -- Remplacer par le vrai mot de passe
  'Team Timepulse',
  'admin'
);
```

#### **Étape 2 : Accorder des permissions spécifiques**
```sql
-- Récupérer l'ID de l'utilisateur
SELECT id FROM admin_users WHERE email = 'timepulseteam@timepulse.fr';

-- Exemple : Donner accès UNIQUEMENT au dashboard et aux inscriptions
INSERT INTO admin_user_permissions (user_id, permission_id, granted)
SELECT
  (SELECT id FROM admin_users WHERE email = 'timepulseteam@timepulse.fr'),
  id,
  true
FROM admin_permissions
WHERE
  (module = 'dashboard' AND permission = 'view')
  OR (module = 'entries' AND permission = 'view')
  OR (module = 'entries' AND permission = 'export');
```

#### **Étape 3 : Vérifier les permissions d'un utilisateur**
```sql
-- Voir toutes les permissions d'un utilisateur
SELECT
  ap.module,
  ap.permission,
  ap.label,
  aup.granted
FROM admin_user_permissions aup
JOIN admin_permissions ap ON aup.permission_id = ap.id
JOIN admin_users au ON aup.user_id = au.id
WHERE au.email = 'timepulseteam@timepulse.fr'
ORDER BY ap.module, ap.permission;
```

#### **Étape 4 : Retirer des permissions**
```sql
-- Retirer l'accès aux finances
DELETE FROM admin_user_permissions
WHERE user_id = (SELECT id FROM admin_users WHERE email = 'timepulseteam@timepulse.fr')
  AND permission_id IN (
    SELECT id FROM admin_permissions WHERE module = 'finance'
  );
```

---

## 📋 Exemples de Configurations

### **Exemple 1 : Comptable (Accès Finance Uniquement)**
```sql
-- Permissions : dashboard + finance
INSERT INTO admin_user_permissions (user_id, permission_id, granted)
SELECT
  (SELECT id FROM admin_users WHERE email = 'comptable@timepulse.fr'),
  id,
  true
FROM admin_permissions
WHERE module IN ('dashboard', 'finance');
```

**Résultat** : Voit uniquement
- ✅ Tableau de bord
- ✅ Finance
- ✅ Commission

### **Exemple 2 : Support Client**
```sql
-- Permissions : dashboard + inscriptions + événements (lecture seule)
INSERT INTO admin_user_permissions (user_id, permission_id, granted)
SELECT
  (SELECT id FROM admin_users WHERE email = 'support@timepulse.fr'),
  id,
  true
FROM admin_permissions
WHERE
  (module = 'dashboard' AND permission = 'view')
  OR (module = 'entries' AND permission IN ('view', 'edit', 'export'))
  OR (module = 'events' AND permission = 'view');
```

**Résultat** : Voit uniquement
- ✅ Tableau de bord
- ✅ Événements (lecture seule)
- ✅ Inscriptions (peut éditer)

### **Exemple 3 : Éditeur de Contenu**
```sql
-- Permissions : dashboard + pages + emails
INSERT INTO admin_user_permissions (user_id, permission_id, granted)
SELECT
  (SELECT id FROM admin_users WHERE email = 'editeur@timepulse.fr'),
  id,
  true
FROM admin_permissions
WHERE module IN ('dashboard', 'pages', 'email');
```

**Résultat** : Voit uniquement
- ✅ Tableau de bord
- ✅ Pages Services
- ✅ Page d'Accueil
- ✅ Pages statiques
- ✅ Vidéos
- ✅ Gestionnaire d'Emails
- ✅ Templates
- ✅ Assets

---

## 🔍 Vérifier les Permissions d'un Utilisateur

### **Méthode SQL**
```sql
-- Fonction RPC disponible
SELECT * FROM admin_get_user_permissions('USER_ID_HERE');
```

### **Dans le Code**
Le contexte `AuthContext` expose maintenant :
```typescript
const { hasPermission } = useAuth();

// Vérifier une permission spécifique
if (hasPermission('finance', 'view')) {
  // Afficher le contenu finance
}

// Vérifier l'accès à un module (n'importe quelle permission)
if (hasPermission('email')) {
  // Afficher les options email
}
```

---

## 🚨 Important

### **Super Admins**
- ✅ Les Super Admins ont **TOUJOURS** toutes les permissions
- ✅ Ils voient **TOUS** les menus
- ✅ Leur accès **ne peut pas être restreint**

### **Admins Normaux**
- ❌ Voient **UNIQUEMENT** les menus autorisés
- ❌ Ne peuvent pas accéder aux URLs directement (redirection)
- ❌ Doivent avoir au moins une permission pour voir une section

---

## 🎯 Mapping Menu → Permissions

| Menu | Module | Permission | Section |
|------|--------|------------|---------|
| Tableau de bord | `dashboard` | `view` | Overview |
| Monitoring | `dashboard` | `view` | Overview |
| Suivi du Projet | `dashboard` | `view` | Overview |
| Organisateurs | `organizers` | `view` | Events |
| Événements | `events` | `view` | Events |
| Inscriptions | `entries` | `view` | Events |
| Résultats | `results` | `view` | Events |
| Athlètes | `entries` | `view` | Events |
| Finance | `finance` | `view` | Finance |
| Commission | `finance` | `manage` | Finance |
| Gestionnaire d'Emails | `email` | `view` | Communication |
| Templates | `email` | `send` | Communication |
| Variables | `email` | `send` | Communication |
| Assets | `email` | `view` | Communication |
| Monitoring Emails | `email` | `view` | Communication |
| Pages Services | `pages` | `view` | Website |
| Page d'Accueil | `pages` | `view` | Website |
| Pages statiques | `pages` | `view` | Website |
| Vidéos | `pages` | `view` | Website |
| Utilisateurs Admin | `users` | `view` | System |
| Journaux d'activité | `users` | `view` | System |
| Sauvegardes | `backups` | `view` | System |
| Paramètres | `settings` | `view` | System |
| Footer du site | `settings` | `view` | System |
| Déploiement | `settings` | `edit` | System (Super Admin Only) |

---

## 🔄 Workflow de Configuration

```
1. Créer l'utilisateur admin
   ↓
2. Définir les permissions nécessaires
   ↓
3. Insérer les permissions dans admin_user_permissions
   ↓
4. L'utilisateur se connecte
   ↓
5. Le système charge automatiquement les permissions
   ↓
6. Le menu affiche UNIQUEMENT les sections autorisées
```

---

## 🛠️ Debugging

### **L'admin voit tout le site ?**
✅ Vérifier qu'il n'est pas Super Admin :
```sql
SELECT role, is_super_admin FROM admin_users WHERE email = 'user@example.com';
```

✅ Vérifier que des permissions spécifiques existent :
```sql
SELECT COUNT(*) FROM admin_user_permissions WHERE user_id = 'USER_ID';
```

### **L'admin ne voit rien ?**
❌ Vérifier que des permissions sont accordées :
```sql
SELECT * FROM admin_user_permissions WHERE user_id = 'USER_ID' AND granted = true;
```

❌ Vérifier les erreurs dans la console du navigateur

---

## 📞 Support

Pour toute question sur les permissions, contactez l'équipe technique Timepulse.

**Rappel** : Le système charge les permissions **à la connexion**. Si vous modifiez les permissions d'un utilisateur, il doit **se reconnecter** pour que les changements prennent effet.
