# 🔧 Guide de débogage - Sauvegarde Templates Emails

## ✅ Corrections appliquées

### 1. **Opacité simplifiée**
- ❌ **Avant** : Double couche (overlay blanc + fond avec rgba)
- ✅ **Maintenant** : Une SEULE couche de couleur avec opacité contrôlable
- L'image de fond reste à 100% d'opacité, c'est le bloc de couleur qui devient transparent

### 2. **Logs de débogage ajoutés**
Des messages console ont été ajoutés pour tracer la sauvegarde :
- 🔄 Au début de la sauvegarde
- 📝 Réponse de Supabase
- ✅ Succès
- ❌ Erreurs détaillées

---

## 🧪 Test immédiat

### Étape 1 : Ouvrir la console du navigateur
1. Appuyez sur **F12** (Windows) ou **Cmd+Option+I** (Mac)
2. Allez dans l'onglet **"Console"**
3. Laissez cette fenêtre ouverte

### Étape 2 : Tester la transparence
1. Allez dans **Admin → Paramètres → Gestion des emails**
2. Sélectionnez un template (ex: "Confirmation reprise de dossard")
3. Cliquez sur **"Éditeur HTML"** (en haut)
4. Cliquez sur l'icône **Paramètres** (engrenage ⚙️)
5. Sélectionnez une **image de fond** :
   - "Coureur victoire"
   - ou "Course piste stade"
6. Dans **"Couleur de fond derrière le texte"**, choisissez **blanc** (#ffffff)
7. **Bougez le slider "Opacité de la couleur"** :
   - **0%** : Transparent → vous devez voir UNIQUEMENT l'image
   - **50%** : Semi-transparent → vous voyez l'image À TRAVERS le blanc
   - **100%** : Opaque → le blanc cache l'image

### Étape 3 : Tester la sauvegarde
1. Modifiez le slider d'opacité (ex: mettez-le à 60%)
2. Cliquez sur **"Sauvegarder"**
3. **Regardez la console** (F12) :
   - Vous devez voir : `🔄 Sauvegarde du template...`
   - Puis : `📝 Réponse Supabase:`
   - Et enfin : `✅ Template sauvegardé avec succès!`

4. **Si vous voyez une erreur** ❌ :
   - Lisez le message d'erreur dans la console
   - Copiez-le et envoyez-le moi

---

## 🔍 Diagnostics possibles

### Erreur 1 : "Accès refusé. Droits administrateur requis"
**Cause :** Vous n'êtes pas connecté en tant qu'admin

**Solution :**
```sql
-- Dans Supabase SQL Editor
SELECT * FROM admin_users WHERE email = 'VOTRE_EMAIL';
```
Vérifiez que `role = 'super_admin'` ou `'admin'`

---

### Erreur 2 : "Permission denied for function admin_update_email_template"
**Cause :** Les permissions RLS ne sont pas configurées correctement

**Solution :**
Vérifiez que vous êtes bien connecté avec un compte admin :
```javascript
// Dans la console du navigateur
const { data: { user } } = await supabase.auth.getUser();
console.log('User:', user);
```

---

### Erreur 3 : Aucune erreur mais pas de sauvegarde
**Cause :** Cache du navigateur

**Solutions :**
1. **Vider le cache** : Ctrl+Shift+Delete (Windows) ou Cmd+Shift+Delete (Mac)
2. **Forcer le rechargement** : Ctrl+F5 ou Cmd+Shift+R
3. **Mode navigation privée** : Testez en mode privé pour éviter le cache

---

### Erreur 4 : "Template non trouvé"
**Cause :** L'ID du template n'existe pas

**Solution :**
```sql
-- Dans Supabase SQL Editor
SELECT id, name, template_key FROM email_templates;
```
Vérifiez que le template existe bien

---

## 📋 Checklist de diagnostic complète

Cochez ce qui est OK :

- [ ] La console (F12) est ouverte
- [ ] Je suis connecté en tant qu'admin
- [ ] Je vois les messages `🔄` dans la console quand je clique sur "Sauvegarder"
- [ ] Le slider d'opacité change l'aperçu en temps réel
- [ ] L'image de fond est visible
- [ ] Je peux voir l'image en transparence quand je baisse l'opacité

---

## 🔧 Test SQL direct

Si rien ne fonctionne, testez directement dans Supabase :

```sql
-- 1. Lister les templates
SELECT id, name, template_key, color_opacity
FROM email_templates
LIMIT 5;

-- 2. Tester la fonction de mise à jour
SELECT admin_update_email_template(
  'COPIER_ID_ICI'::uuid,  -- Remplacer par un vrai ID
  'Test sujet',
  '<p>Test contenu</p>',
  NULL,
  NULL,
  true,
  'runners',
  NULL,
  '[]',
  '/triathlete.jpeg',
  '#ffffff',
  100,
  75  -- Opacité à 75%
);

-- 3. Vérifier la modification
SELECT color_opacity, background_color
FROM email_templates
WHERE id = 'COPIER_ID_ICI'::uuid;
```

**Si cette requête fonctionne** → Le problème vient du frontend
**Si cette requête échoue** → Le problème vient de la base de données

---

## 📸 Ce que vous devriez voir

### Console après un clic sur "Sauvegarder" :
```
🔄 Sauvegarde du template... {id: "...", color_opacity: 60, ...}
📝 Réponse Supabase: {data: {...}, error: null}
✅ Template sauvegardé avec succès!
```

### Aperçu avec transparence :
- **Opacité 0%** : L'image du coureur est visible, pas de fond blanc
- **Opacité 50%** : Vous voyez l'image EN TRANSPARENCE à travers un voile blanc
- **Opacité 100%** : Le fond est complètement blanc, l'image est cachée

---

## ❓ Questions de diagnostic

**Envoyez-moi ces informations si ça ne fonctionne pas :**

1. **Que voyez-vous dans la console (F12) ?**
   - Copiez tous les messages qui apparaissent

2. **L'aperçu change-t-il quand vous bougez le slider ?**
   - Oui / Non

3. **Voyez-vous un message vert "Template mis à jour avec succès" ?**
   - Oui / Non / Message rouge d'erreur

4. **Si vous rechargez la page, vos modifications sont-elles conservées ?**
   - Oui / Non

5. **Quel navigateur utilisez-vous ?**
   - Chrome / Firefox / Safari / Edge / Autre

---

## 🚀 Prochaines étapes

Une fois que la sauvegarde fonctionne :

1. **Testez sur plusieurs templates** pour confirmer
2. **Envoyez un email de test** (bouton "Test")
3. **Vérifiez le rendu** dans votre boîte mail
4. Les emails HTML peuvent s'afficher différemment selon les clients email

---

**Dernière mise à jour :** 7 janvier 2026
**Build :** ✅ Compilé avec succès
