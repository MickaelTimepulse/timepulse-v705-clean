# ✅ Améliorations de lisibilité - Emails avec image de fond

## 🎨 Modifications appliquées

### 1. **Police plus grosse**
- Texte normal : **18px** (au lieu de 14-16px)
- Titres : **32px** (au lieu de 24px)
- Footer : **14px** (pour rester discret)

### 2. **Ombre portée triple couche**
Pour un contraste maximum sur n'importe quelle image :
```css
text-shadow:
  0 2px 8px rgba(0, 0, 0, 0.6),    /* Ombre douce */
  0 0 4px rgba(0, 0, 0, 0.8),      /* Halo noir */
  0 1px 3px rgba(0, 0, 0, 0.9);    /* Contour net */
```

### 3. **Texte en blanc**
Tous les textes sont maintenant en **blanc (#ffffff)** pour un contraste optimal.

### 4. **Police plus grasse**
- Texte normal : `font-weight: 500`
- Texte important (strong/b) : `font-weight: 800`
- Titres : `font-weight: 800`

### 5. **Interligne augmenté**
- `line-height: 1.8` (au lieu de 1.5-1.6)

---

## 🎯 Résultat visuel

### Avant (difficile à lire) :
```
Bonjour [nom]              ← Petit, noir, pas de contraste
Félicitations...
```

### Après (très lisible) :
```
Bonjour [nom]              ← GROS, BLANC, avec ombre noire
Félicitations...              Contraste maximal !
```

---

## 🧪 Test immédiat

1. **Ctrl+F5** (vider le cache)
2. Admin → Gestion des emails
3. "Confirmation reprise de dossard"
4. ⚙️ Paramètres → Image : "Coureur victoire"
5. **Slider d'opacité à 0%**

### Vous devriez voir :
- ✅ Texte **beaucoup plus gros**
- ✅ Texte en **blanc** avec **ombre noire**
- ✅ **Très lisible** même sur l'image
- ✅ Contraste fort

---

**Date** : 7 janvier 2026
**Status** : ✅ Prêt à tester avec Ctrl+F5
