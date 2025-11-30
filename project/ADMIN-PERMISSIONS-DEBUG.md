# 🐛 Débogage Permissions Admin - RÉSOLU

## ❌ Problème Identifié

L'utilisateur `timepulseteam@timepulse.fr` avait des permissions en base de données mais voyait quand même "Accès non autorisé".

---

## 🔍 Causes Identifiées

### **1. Format de Retour de `admin_get_user_permissions`**

La fonction PostgreSQL retourne :
```json
{
  "user": {...},
  "permissions": [...]
}
```

Mais dans `AuthContext.tsx`, le code faisait :
```typescript
if (data && Array.isArray(data)) {  // ❌ data n'est PAS un array !
  setPermissions(data);
}
```

**Résultat** : Les permissions n'étaient **jamais chargées** !

### **2. Permission `dashboard.view` Manquante**

La permission `dashboard.view` était à `false` pour l'utilisateur, donc même après correction, il ne pouvait pas voir le dashboard.

---

## ✅ Solutions Appliquées

### **1. Correction du Chargement des Permissions**

**Avant** (AuthContext.tsx ligne 33-49) :
```typescript
const loadUserPermissions = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .rpc('admin_get_user_permissions', { p_user_id: userId });

    if (error) {
      console.error('Error loading permissions:', error);
      return;
    }

    if (data && Array.isArray(data)) {  // ❌ FAUX
      setPermissions(data);
    }
  } catch (err) {
    console.error('Failed to load permissions:', err);
  }
};
```

**Après** (CORRIGÉ) :
```typescript
const loadUserPermissions = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .rpc('admin_get_user_permissions', { p_user_id: userId });

    if (error) {
      console.error('Error loading permissions:', error);
      return;
    }

    // ✅ La fonction retourne un objet {user: {...}, permissions: [...]}
    if (data && typeof data === 'object') {
      const permissionsData = data.permissions || [];
      console.log('Loaded permissions:', permissionsData);  // Debug
      setPermissions(permissionsData);
    }
  } catch (err) {
    console.error('Failed to load permissions:', err);
  }
};
```

### **2. Activation de `dashboard.view`**

```sql
UPDATE admin_user_permissions
SET granted = true
WHERE user_id = '77dc6420-fab7-4722-a527-50857a64b495'
  AND permission_id = (
    SELECT id FROM admin_permissions
    WHERE module = 'dashboard' AND permission = 'view'
  );
```

---

## 🧪 Comment Vérifier que ça Fonctionne

### **1. Vérifier les Permissions en Base**

```sql
SELECT
  ap.module,
  ap.permission,
  aup.granted
FROM admin_user_permissions aup
JOIN admin_permissions ap ON aup.permission_id = ap.id
WHERE aup.user_id = (
  SELECT id FROM admin_users WHERE email = 'timepulseteam@timepulse.fr'
)
AND aup.granted = true
ORDER BY ap.module, ap.permission;
```

**Résultat attendu** : Liste des permissions avec `granted = true`

### **2. Vérifier le Chargement dans la Console**

1. Se connecter avec `timepulseteam@timepulse.fr`
2. Ouvrir la console développeur (F12)
3. Chercher : `Loaded permissions:`
4. Vérifier que l'array contient les permissions avec `granted: true`

**Exemple de log attendu** :
```javascript
Loaded permissions: [
  {module: "dashboard", permission: "view", granted: true, ...},
  {module: "email", permission: "view", granted: true, ...},
  {module: "email", permission: "send", granted: true, ...},
  {module: "entries", permission: "view", granted: true, ...},
  // etc.
]
```

### **3. Vérifier l'Interface**

Après connexion, l'utilisateur doit voir :

✅ **Menu latéral avec sections** :
- Vue d'ensemble (Tableau de bord)
- Gestion (Organisateurs, Événements, Inscriptions, Résultats, Athlètes)
- Communication (Email Manager, Modèles, Variables, etc.)
- Site Web (Pages de Service, Pages Statiques, Vidéos)

❌ **Sections masquées** :
- Finance
- Administration (Paramètres, Utilisateurs, Sauvegardes)

✅ **Accès au Tableau de bord** sans message d'erreur

---

## 🔄 Processus de Reconnexion

**IMPORTANT** : Les permissions sont chargées **à la connexion**.

Après toute modification de permissions en base :
1. ❌ **Recharger la page NE SUFFIT PAS**
2. ✅ **L'admin DOIT se déconnecter** (bouton Déconnexion)
3. ✅ **Puis se reconnecter**
4. ✅ Les nouvelles permissions seront alors chargées

---

## 🐛 Débogage des Problèmes de Permissions

Si un admin dit "Je ne vois rien" ou "Accès non autorisé" :

### **Checklist de Débogage**

#### **1. Vérifier que l'utilisateur existe**
```sql
SELECT id, email, role, name
FROM admin_users
WHERE email = 'email@example.com';
```

#### **2. Vérifier les permissions en base**
```sql
SELECT
  ap.module,
  ap.permission,
  aup.granted
FROM admin_user_permissions aup
JOIN admin_permissions ap ON aup.permission_id = ap.id
WHERE aup.user_id = (SELECT id FROM admin_users WHERE email = 'email@example.com')
ORDER BY ap.module, ap.permission;
```

**Questions à poser** :
- ✅ Y a-t-il des lignes avec `granted = true` ?
- ✅ La permission `dashboard.view` est-elle à `true` ?
- ✅ Les permissions attendues sont-elles présentes ?

#### **3. Vérifier le chargement côté client**

Dans la console développeur après connexion :
```javascript
// Devrait afficher les permissions chargées
console.log('Loaded permissions:', permissionsData);
```

Si ce log n'apparaît pas → Problème de connexion ou de RPC

#### **4. Vérifier la fonction RPC**
```sql
-- Tester directement la fonction
SELECT admin_get_user_permissions('USER_UUID_ICI'::uuid);
```

**Résultat attendu** : Objet JSON avec `user` et `permissions`

#### **5. Vérifier le rôle**
```sql
SELECT role FROM admin_users WHERE email = 'email@example.com';
```

- Si `role = 'super_admin'` → Devrait TOUT voir
- Si `role = 'admin'` ou autre → Dépend des permissions

---

## 🎯 Permissions Recommandées par Profil

### **Admin Support** (comme timepulseteam@timepulse.fr)

✅ **Accès recommandé** :
- `dashboard.view` - **OBLIGATOIRE**
- `entries.*` - Toutes (view, edit, delete, export)
- `events.*` - Toutes (view, create, edit, delete)
- `organizers.*` - Toutes (view, create, edit, delete)
- `results.*` - Toutes (view, import, edit, delete)
- `email.*` - Toutes (view, send)
- `pages.*` - Toutes (view, edit)

❌ **Accès bloqué** :
- `finance.*` - Aucune
- `settings.*` - Aucune
- `users.*` - Aucune
- `backups.*` - Aucune

### **Admin Lecture Seule**

✅ **Accès recommandé** :
- `dashboard.view`
- `entries.view`
- `events.view`
- `organizers.view`
- `results.view`
- `email.view`

❌ **Tout le reste**

### **Admin Comptabilité**

✅ **Accès recommandé** :
- `dashboard.view`
- `finance.*` - Toutes
- `entries.view`, `entries.export`
- `events.view`

❌ **Modifications** et **Administration**

---

## 📝 Notes Importantes

### **Super Admin**

```typescript
// Dans hasPermission()
if (user?.role === 'super_admin') {
  return true;  // ✅ TOUJOURS true, peu importe les permissions
}
```

Les Super Admins **ne peuvent PAS être restreints** par le système de permissions.

### **Permissions Hiérarchiques**

Certaines permissions impliquent d'autres :
- `edit` devrait inclure `view`
- `delete` devrait inclure `view`
- `manage` devrait inclure `view`

**Bonne pratique** : Toujours donner `view` avec les autres permissions du même module.

### **Permission `dashboard.view`**

**CRITIQUE** : Sans cette permission, l'admin ne peut littéralement rien faire !

**Recommandation** : Donner `dashboard.view` à **TOUS** les admins non-super-admin.

---

## 🚀 Pour Créer un Nouvel Admin avec Permissions

```sql
-- 1. Créer l'admin
INSERT INTO admin_users (email, password_hash, name, role)
VALUES (
  'nouvel.admin@timepulse.fr',
  crypt('MotDePasse123', gen_salt('bf')),
  'Nouvel Admin',
  'admin'
);

-- 2. Récupérer l'ID
SELECT id FROM admin_users WHERE email = 'nouvel.admin@timepulse.fr';
-- Supposons : 'abc-123-def-456'

-- 3. Donner dashboard.view (OBLIGATOIRE)
INSERT INTO admin_user_permissions (user_id, permission_id, granted)
SELECT
  'abc-123-def-456'::uuid,
  id,
  true
FROM admin_permissions
WHERE module = 'dashboard' AND permission = 'view';

-- 4. Donner d'autres permissions (exemple: toutes les inscriptions)
INSERT INTO admin_user_permissions (user_id, permission_id, granted)
SELECT
  'abc-123-def-456'::uuid,
  id,
  true
FROM admin_permissions
WHERE module = 'entries';

-- 5. L'admin peut maintenant se connecter
```

---

## ✅ État Actuel

### **Code Corrigé** :
- ✅ `AuthContext.tsx` - Chargement des permissions corrigé
- ✅ `ProtectedAdminRoute.tsx` - Protection des pages
- ✅ `AdminLayout.tsx` - Filtrage du menu + boutons Retour/Accueil

### **Base de Données** :
- ✅ `timepulseteam@timepulse.fr` - Permissions correctement configurées
- ✅ `dashboard.view` - Activé pour cet utilisateur

### **Système** :
- ✅ Build réussi
- ✅ Permissions chargées à la connexion
- ✅ Vérification en temps réel
- ✅ Messages d'erreur clairs

Le système de permissions fonctionne maintenant **100%** correctement ! 🎉
