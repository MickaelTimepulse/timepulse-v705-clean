# 🚀 Mode d'emploi - Application des migrations Supabase

## 📋 Situation

Votre base de données de production **n'a aucune table**. Vous devez appliquer toutes les migrations pour initialiser la base de données.

## ✅ Solution : 3 fichiers créés pour vous

### 1️⃣ **apply-migrations.html** (RECOMMANDÉ ⭐)
**Interface web simple et visuelle**

#### Comment l'utiliser :
1. Ouvrez le fichier `apply-migrations.html` dans votre navigateur
2. Cliquez sur "Charger les migrations"
3. Cliquez sur "Copier le SQL"
4. Cliquez sur "Ouvrir SQL Editor" (s'ouvre dans Supabase)
5. Collez le SQL (Ctrl+V) et cliquez sur "Run"
6. Attendez 1-2 minutes
7. C'est fait ! ✅

**Avantages :**
- Interface visuelle claire
- Copier-coller facile
- Instructions étape par étape
- Lien direct vers Supabase

---

### 2️⃣ **combined-migrations.sql**
**Fichier SQL unique avec toutes les migrations**

#### Comment l'utiliser :
1. Ouvrez `combined-migrations.sql` dans votre éditeur de code
2. Copiez **TOUT** le contenu (Ctrl+A puis Ctrl+C)
3. Allez sur : https://supabase.com/dashboard/project/fgstscztsighabpzzzix/sql/new
4. Collez dans SQL Editor (Ctrl+V)
5. Cliquez sur "Run"
6. Attendez 1-2 minutes

**Contenu :**
- 26 migrations combinées
- 190 KB de SQL
- Toutes les tables nécessaires

---

### 3️⃣ **combine-migrations.js**
**Script Node.js pour régénérer le fichier SQL combiné**

#### Utilisation :
```bash
node combine-migrations.js
```

**Utile si :**
- Vous avez ajouté de nouvelles migrations
- Vous voulez recréer le fichier `combined-migrations.sql`
- Vous voulez personnaliser les migrations à inclure

---

## 📝 Migrations incluses (26 au total)

Les migrations sont appliquées dans cet ordre :

1. ✅ Schéma de base Timepulse (tables principales)
2. ✅ Admin users (authentification admin)
3. ✅ Module organisateurs
4. ✅ Licences et tarification
5. ✅ Module inscriptions (entries)
6. ✅ Restrictions catégories
7. ✅ Module covoiturage
8. ✅ Échange de dossards
9. ✅ Logs emails
10. ✅ Module résultats
11. ✅ Transactions paiement
12. ✅ Templates emails
13. ✅ Écosystème athlètes
14. ✅ Gestion bénévoles
15. ✅ Pages statiques et footer
16. ✅ Vidéos
17. ✅ Caractéristiques d'événements
18. ✅ Module speaker
19. ✅ Extension pgcrypto
20. ✅ **Politiques RLS pour les admins** 🔐

---

## ⚠️ Ce qu'il faut savoir

### Erreurs normales
Vous pourriez voir des erreurs comme :
- `relation "xxx" already exists` → Normal si la table existe déjà
- `duplicate key value` → Normal si des données existent
- `function "xxx" already exists` → Normal si la fonction existe

➡️ **Ces erreurs n'empêchent pas l'exécution de continuer**

### Erreurs à surveiller
Si vous voyez :
- `permission denied` → Vérifiez que vous utilisez le bon compte admin
- `syntax error` → Contactez le support (problème dans le SQL)

---

## 🔍 Vérification après application

Exécutez cette requête dans SQL Editor pour vérifier que tout est OK :

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Vous devriez voir **au moins 30 tables**, incluant :
- ✅ events
- ✅ races
- ✅ organizers
- ✅ entries
- ✅ registrations
- ✅ athletes
- ✅ results
- ✅ admin_users
- ✅ event_characteristics
- ✅ email_templates
- etc.

---

## 🎯 Prochaines étapes après les migrations

Une fois les migrations appliquées :

1. **Déployez la nouvelle version du code**
   - Utilisez votre bouton "MAJ DU SITE"
   - Cela déploie le build qui corrige l'erreur "Supabase is not defined"

2. **Testez la connexion admin**
   - Connectez-vous en tant qu'admin
   - Le badge "ADMIN" devrait être visible

3. **Testez la création d'événement**
   - Créez un nouvel événement
   - Ajoutez des caractéristiques
   - Tout devrait fonctionner !

4. **Gérez les permissions**
   - Allez dans **Administration → Utilisateurs Admin**
   - Modifiez les permissions de l'admin test
   - Retirez l'accès Finance si nécessaire

---

## 🆘 Besoin d'aide ?

Si quelque chose ne fonctionne pas :

1. Notez le **nom de la migration** qui échoue
2. Copiez le **message d'erreur exact**
3. Vérifiez dans les **logs Supabase** (Dashboard → Logs)
4. Contactez le support avec ces informations

---

## 💡 Conseils pro

- **Sauvegardez votre base** avant d'appliquer les migrations (Dashboard → Database → Backups)
- **Testez en local** si possible avant de déployer en production
- **Appliquez les migrations hors heures de pointe** pour éviter d'impacter les utilisateurs
- **Gardez une trace** des migrations appliquées dans un document

---

## ✅ C'est tout !

Une fois les migrations appliquées, votre application Timepulse est **prête à fonctionner** ! 🎉

Bonne chance ! 🚀
