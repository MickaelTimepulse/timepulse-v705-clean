# Guide de dépannage - Connexion Admin

## ✅ Problème résolu !

Le mot de passe admin a été réinitialisé avec succès.

### Identifiants actuels

```
Email: mickael@timepulse.fr
Mot de passe: Timepulse2025@!
```

---

## 🔧 Si la connexion ne fonctionne toujours pas

### 1️⃣ Effacer le cache du navigateur

Les anciens identifiants peuvent être en cache dans localStorage.

**Chrome/Edge/Brave:**
1. Ouvrir les DevTools (F12)
2. Onglet "Application" → "Storage" → "Local Storage"
3. Cliquer droit sur votre domaine → "Clear"
4. Rafraîchir la page (Ctrl+Shift+R)

**Firefox:**
1. Ouvrir les DevTools (F12)
2. Onglet "Stockage" → "Stockage local"
3. Supprimer les clés `timepulse_saved_email` et `timepulse_saved_password`
4. Rafraîchir la page (Ctrl+Shift+R)

### 2️⃣ Tester manuellement la connexion

Ouvrez le fichier `test-admin-login.html` dans votre navigateur :

```bash
open test-admin-login.html
```

Vous devrez entrer :
- **SUPABASE_URL** : trouvez-le dans votre `.env` (VITE_SUPABASE_URL)
- **SUPABASE_ANON_KEY** : trouvez-le dans votre `.env` (VITE_SUPABASE_ANON_KEY)

Cliquez sur "Tester la connexion" pour voir le résultat détaillé.

### 3️⃣ Vérifier en base de données

```sql
-- Vérifier que l'utilisateur existe
SELECT id, email, name, role, is_active
FROM admin_users
WHERE email = 'mickael@timepulse.fr';

-- Tester la fonction de vérification
SELECT * FROM verify_admin_password('mickael@timepulse.fr', 'Timepulse2025@!');
```

Si cette requête retourne un résultat, le mot de passe est correct.

### 4️⃣ Réinitialiser le mot de passe manuellement

Si besoin, exécutez cette migration :

```sql
UPDATE admin_users
SET
  hashed_password = crypt('Timepulse2025@!', gen_salt('bf')),
  is_active = true,
  updated_at = now()
WHERE email = 'mickael@timepulse.fr';
```

---

## 🐛 Debugging avancé

### Vérifier les logs de la console

1. Ouvrir DevTools (F12)
2. Onglet "Console"
3. Tenter de se connecter
4. Vérifier les erreurs affichées

### Messages d'erreur courants

| Erreur | Cause | Solution |
|--------|-------|----------|
| `Email ou mot de passe incorrect` | Identifiants invalides | Vérifier l'orthographe, les espaces |
| `verify_admin_password is not a function` | Fonction manquante | Appliquer la migration |
| `Network error` | Supabase inaccessible | Vérifier SUPABASE_URL dans .env |
| `Invalid API key` | Clé incorrecte | Vérifier SUPABASE_ANON_KEY dans .env |

---

## 📝 Logs utiles

Le système enregistre automatiquement :
- ✅ Tentatives de connexion réussies
- ❌ Tentatives échouées
- 🕐 Timestamp de chaque tentative

Pour consulter les logs :

```sql
SELECT *
FROM audit_logs
WHERE action = 'ADMIN_LOGIN'
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🔐 Sécurité

### Le mot de passe est hashé

Le mot de passe `Timepulse2025@!` est stocké **hashé** en base avec bcrypt.

Vous ne verrez **jamais** le mot de passe en clair dans la base de données.

### Format du hash

```
$2a$06$[salt][hash]
```

Exemple :
```
$2a$06$abcdefghijklmnopqrstu.ABCDEFGHIJKLMNOPQRSTUVWXYZ
```

### Changer le mot de passe

Pour changer le mot de passe de l'admin :

```sql
UPDATE admin_users
SET hashed_password = crypt('NouveauMotDePasse123!', gen_salt('bf'))
WHERE email = 'mickael@timepulse.fr';
```

---

## 📞 Support

Si le problème persiste après avoir suivi ce guide :

1. Vérifiez que la migration `20251105000001_reset_admin_password.sql` a bien été appliquée
2. Testez avec `test-admin-login.html`
3. Consultez les logs de la console navigateur
4. Vérifiez les variables d'environnement dans `.env`

---

## ✨ Migration appliquée

La migration suivante a été appliquée avec succès :

```
20251105000001_reset_admin_password.sql
```

Cela a :
- ✅ Créé/mis à jour l'utilisateur `mickael@timepulse.fr`
- ✅ Défini le mot de passe à `Timepulse2025@!`
- ✅ Activé le compte (`is_active = true`)
- ✅ Défini le rôle `super_admin`

Vous pouvez maintenant vous connecter sur `/admin/login` !
