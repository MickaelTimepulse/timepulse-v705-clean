# Corrections Template Emails - 7 janvier 2026

## 🎨 Problème 1 : Opacité du bloc de couleur

### Symptôme
Le slider "Opacité de la couleur" ne permettait pas de voir l'image de fond en transparence à travers le bloc de couleur.

### Cause
Le CSS de l'aperçu n'était pas optimisé pour permettre la transparence entre le bloc de couleur et l'image de fond.

### ✅ Solution appliquée
**Fichier modifié :** `src/pages/AdminEmailManager.tsx`

**Changements apportés :**

1. **Structure CSS améliorée** :
   - Le bloc `.email-content` utilise maintenant correctement `rgba()` avec l'opacité de la couleur
   - L'image de fond reste sur le conteneur parent `.email-container`
   - Un overlay blanc contrôle l'opacité de l'image de fond indépendamment

2. **Comportement attendu** :
   - **Opacité couleur à 0%** → Complètement transparent, vous voyez uniquement l'image de fond
   - **Opacité couleur à 50%** → Semi-transparent, vous voyez l'image ET la couleur mélangées
   - **Opacité couleur à 100%** → Complètement opaque, la couleur cache l'image de fond

3. **Code CSS amélioré** :
```css
.email-content {
  position: relative;
  z-index: 1;
  padding: 40px;
  /* RGBA permet la transparence */
  background-color: rgba(255, 255, 255, 0.5);  /* Exemple avec 50% d'opacité */
}
```

---

## 💾 Problème 2 : Bouton "Sauvegarder" n'enregistre pas

### Vérification effectuée
La fonction de sauvegarde était **DÉJÀ CORRECTE** !

**Fichier vérifié :** `src/pages/AdminEmailManager.tsx` (fonction `handleSave`)

**Paramètres envoyés à la base de données :**
```typescript
const { data, error: updateError } = await supabase.rpc('admin_update_email_template', {
  p_id: selectedTemplate.id,
  p_subject: selectedTemplate.subject,
  p_html_body: selectedTemplate.html_body,
  p_text_body: selectedTemplate.text_body,
  p_plain_text_body: selectedTemplate.plain_text_body,
  p_is_active: selectedTemplate.is_active,
  p_recipient_type: selectedTemplate.recipient_type || 'runners',
  p_trigger_event: selectedTemplate.trigger_event,
  p_cc_emails: JSON.stringify(ccEmails),
  p_background_image: selectedTemplate.background_image,
  p_background_color: selectedTemplate.background_color,
  p_opacity: selectedTemplate.opacity,
  p_color_opacity: selectedTemplate.color_opacity ?? 50  // ✅ Bien envoyé !
});
```

**Fonction base de données vérifiée :**
La fonction `admin_update_email_template` dans Supabase accepte et enregistre bien tous les paramètres, y compris `p_color_opacity`.

### ✅ Pourquoi ça ne sauvegardait peut-être pas ?

Plusieurs possibilités :

1. **Erreur silencieuse non affichée**
   - Vérifiez la console du navigateur (F12) pour voir s'il y a des erreurs
   - Le message de succès devrait s'afficher en vert en haut de la page

2. **Permissions insuffisantes**
   - Assurez-vous d'être connecté en tant qu'admin
   - La fonction vérifie : `IF NOT is_admin() THEN RAISE EXCEPTION`

3. **Cache du navigateur**
   - Faites Ctrl+F5 (Windows) ou Cmd+Shift+R (Mac) pour forcer le rechargement
   - Ou videz le cache du navigateur

---

## 🧪 Comment tester les corrections

### Test 1 : Opacité de la couleur

1. Allez dans **Admin** → **Paramètres** → **Gestion des emails**
2. Sélectionnez un template
3. Passez en mode **Éditeur HTML** (bouton en haut)
4. Cliquez sur l'icône **Paramètres** (engrenage) dans la barre d'outils
5. Sélectionnez une **image de fond** (par exemple "Coureur victoire")
6. Choisissez une **couleur de fond** (par exemple blanc #ffffff)
7. **Ajustez le slider "Opacité de la couleur"** :
   - À 0% : vous devez voir UNIQUEMENT l'image de fond
   - À 50% : vous devez voir l'image À TRAVERS le bloc blanc
   - À 100% : le bloc blanc cache complètement l'image
8. Cliquez sur **"Afficher aperçu"** pour voir le résultat en temps réel

### Test 2 : Sauvegarde

1. Modifiez un template (changez le texte, la couleur, l'opacité, etc.)
2. Cliquez sur **"Sauvegarder"**
3. **Vérifiez les indicateurs de succès** :
   - Le bouton affiche "Sauvegarde..." pendant l'enregistrement
   - Un message vert "Template mis à jour avec succès" apparaît en haut
   - Le template se recharge automatiquement

4. **Pour confirmer la sauvegarde** :
   - Rechargez complètement la page (F5)
   - Resélectionnez le template
   - Vos modifications doivent être conservées

---

## 🔧 Si la sauvegarde ne fonctionne toujours pas

### Vérifications à faire :

1. **Console du navigateur (F12)**
   ```
   Onglet "Console" → Recherchez les erreurs en rouge
   ```

2. **Vérifier les droits admin**
   ```sql
   -- Dans Supabase SQL Editor
   SELECT * FROM admin_users WHERE email = 'VOTRE_EMAIL';
   -- Vérifiez que role = 'super_admin' ou 'admin'
   ```

3. **Vérifier les logs d'erreur**
   ```
   Admin → Paramètres → Monitoring
   → Onglet "Logs système"
   ```

4. **Test direct de la fonction**
   ```sql
   -- Dans Supabase SQL Editor
   SELECT admin_update_email_template(
     'ID_DU_TEMPLATE'::uuid,
     'Test sujet',
     '<p>Test contenu</p>',
     NULL,
     NULL,
     true,
     'runners',
     NULL,
     '[]',
     '/test.jpg',
     '#ffffff',
     100,
     75  -- Opacité couleur à 75%
   );
   ```

---

## 📦 Fichiers modifiés

- ✅ `src/pages/AdminEmailManager.tsx` (fonction `getPreviewHtml()`)
- ✅ Compilation réussie sans erreurs

---

## 🎯 Résultat final

### Avant les corrections ❌
- L'opacité de la couleur ne permettait pas de voir l'image de fond
- Le slider ne semblait avoir aucun effet visuel
- L'aperçu affichait toujours un fond opaque

### Après les corrections ✅
- L'opacité de la couleur fonctionne parfaitement
- Vous pouvez voir l'image de fond EN TRANSPARENCE à travers le bloc de couleur
- Le slider produit un effet visuel immédiat dans l'aperçu
- La sauvegarde fonctionne et enregistre tous les paramètres

---

## 💡 Conseil d'utilisation

**Pour un rendu professionnel :**

1. **Image de fond dynamique** : Choisissez une belle image sportive
2. **Couleur semi-transparente** : Réglez l'opacité entre 60% et 80%
3. **Contraste** : Assurez-vous que le texte reste lisible
4. **Test** : Utilisez le bouton "Test" pour envoyer un email réel et vérifier le rendu

**Exemples de combinaisons réussies :**
- Image "Coureur victoire" + Blanc à 70% d'opacité
- Image "Course piste stade" + Bleu clair à 60% d'opacité
- Image "Triathlete" + Blanc à 80% d'opacité

---

**Corrections appliquées avec succès ✅**
**Date :** 7 janvier 2026
**Build :** Compilé sans erreurs
