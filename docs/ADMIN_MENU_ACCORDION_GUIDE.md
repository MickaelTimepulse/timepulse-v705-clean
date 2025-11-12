# 🎨 Menu Admin avec Accordéon - Guide d'Utilisation

## 🎯 Vue d'ensemble

Le menu admin de Timepulse utilise maintenant un système d'accordéon pour réduire/afficher les sections selon vos besoins. Cette fonctionnalité améliore la navigation et permet de mieux organiser l'espace.

---

## ✨ Fonctionnalités

### 1. **Sections Pliables**
Chaque section peut être réduite ou étendue en cliquant sur l'en-tête de section.

### 2. **Indicateurs Visuels**
- **Chevron Droit (▶)** : Section fermée
- **Chevron Bas (▼)** : Section ouverte
- **Badge Numérique** : Nombre d'items dans la section

### 3. **Couleurs par Section**
Chaque section a son propre code couleur :
- 🔵 **Vue d'ensemble** → Bleu
- 🟢 **Gestion** → Vert
- 🟠 **Finance** → Orange
- 🟣 **Communication** → Violet
- 🔷 **Site Web** → Cyan
- 🔴 **Administration** → Rouge

### 4. **États par Défaut**
Par défaut, ces sections sont ouvertes au chargement :
- ✅ Vue d'ensemble
- ✅ Gestion
- ✅ Communication

Les autres sections (Finance, Site Web, Administration) sont fermées par défaut.

---

## 🎮 Utilisation

### Ouvrir/Fermer une Section

```
┌─────────────────────────────────────┐
│ 🟢 GESTION                    5  ▼ │ ← Cliquer ici
├─────────────────────────────────────┤
│   👥 Organisateurs                  │
│   📅 Événements                     │
│   📝 Inscriptions                   │
│   🏆 Résultats                      │
│   👤 Athlètes                       │
└─────────────────────────────────────┘

Devient :

┌─────────────────────────────────────┐
│ 🟢 GESTION                    5  ▶ │ ← Section fermée
└─────────────────────────────────────┘
```

### Navigation Rapide

1. **Repérer la section** par sa couleur
2. **Vérifier le compteur** pour voir combien d'items
3. **Cliquer pour ouvrir** si nécessaire
4. **Cliquer sur l'item** désiré

---

## 🎨 Design Visuel

### En-tête de Section Fermée
```
┌─────────────────────────────────────┐
│ 🟣 COMMUNICATION          5      ▶ │
│   (fond violet clair)               │
└─────────────────────────────────────┘
```

### En-tête de Section Ouverte
```
┌─────────────────────────────────────┐
│ 🟣 COMMUNICATION          5      ▼ │
│   (fond violet clair)               │
├─────────────────────────────────────┤
│   🎨 Gestionnaire d'Emails          │
│   📬 Templates                      │
│   📖 Variables                      │
│   🖼️ Assets                         │
│   📊 Monitoring Emails              │
└─────────────────────────────────────┘
```

### Effets au Survol
- L'en-tête de section change de couleur au survol
- Les icônes s'agrandissent légèrement
- Les items individuels ont un effet de dégradé rose/violet

---

## 💡 Avantages

### Pour l'Utilisateur

✅ **Gain d'Espace** : Menu plus compact
✅ **Navigation Ciblée** : Focus sur les sections nécessaires
✅ **Repérage Rapide** : Compteurs et couleurs
✅ **Organisation Claire** : Sections logiquement regroupées
✅ **Moins de Défilement** : Sections fermées = moins de scroll

### Pour l'Expérience

✅ **Interface Moderne** : Design d'accordéon professionnel
✅ **Feedback Visuel** : Indicateurs clairs d'état
✅ **Personnalisable** : L'utilisateur contrôle ce qu'il voit
✅ **Animations Fluides** : Transitions douces

---

## 🔧 Personnalisation des Sections Ouvertes

Par défaut, certaines sections sont ouvertes. Vous pouvez modifier ce comportement dans le code :

```typescript
const [expandedSections, setExpandedSections] = useState<Set<string>>(
  new Set(['overview', 'events', 'communication'])
  // Ajouter ou retirer des sections ici
);
```

### Options Disponibles
- `'overview'` - Vue d'ensemble
- `'events'` - Gestion
- `'finance'` - Finance
- `'communication'` - Communication
- `'website'` - Site Web
- `'system'` - Administration

### Exemples

**Tout ouvrir par défaut :**
```typescript
new Set(['overview', 'events', 'finance', 'communication', 'website', 'system'])
```

**Tout fermer par défaut :**
```typescript
new Set([])
```

**Ouvrir uniquement Vue d'ensemble :**
```typescript
new Set(['overview'])
```

---

## 📊 Structure des Sections

| Section | Nombre d'Items | Par Défaut |
|---------|----------------|------------|
| 🔵 Vue d'ensemble | 2 | ✅ Ouvert |
| 🟢 Gestion | 5 | ✅ Ouvert |
| 🟠 Finance | 2 | ❌ Fermé |
| 🟣 Communication | 5 | ✅ Ouvert |
| 🔷 Site Web | 2 | ❌ Fermé |
| 🔴 Administration | 4-5* | ❌ Fermé |

*5 items si Super Admin (avec Déploiement), 4 sinon

---

## 🎯 Workflows Recommandés

### Workflow Quotidien (Admin Standard)

**Sections à garder ouvertes :**
- 🔵 Vue d'ensemble → Dashboard et Monitoring
- 🟢 Gestion → Inscriptions et Événements
- 🟣 Communication → Emails

**Sections à ouvrir au besoin :**
- 🟠 Finance → Fin de journée/semaine
- 🔷 Site Web → Modifications de contenu
- 🔴 Administration → Configuration système

### Workflow Organisateur

**Sections principales :**
- 🔵 Vue d'ensemble → Monitoring temps réel
- 🟢 Gestion → Tout ouvert en permanence
- 🟣 Communication → Templates emails

### Workflow Finance

**Sections principales :**
- 🔵 Vue d'ensemble → Dashboard
- 🟠 Finance → Tout ouvert
- 🟢 Gestion → Inscriptions pour vérification

### Workflow Contenu

**Sections principales :**
- 🔷 Site Web → Tout ouvert
- 🟣 Communication → Templates
- 🔵 Vue d'ensemble → Preview

---

## 🚀 Raccourcis Clavier (Futur)

Fonctionnalités prévues :
- `Ctrl + 1-6` → Basculer les sections
- `Ctrl + E` → Tout développer
- `Ctrl + R` → Tout réduire

---

## 🎨 Code Technique

### Structure des Sections

```typescript
const sections = {
  overview: {
    title: 'Vue d\'ensemble',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    hoverBg: 'hover:bg-blue-100'
  },
  // ... autres sections
};
```

### Gestion de l'État

```typescript
// État des sections expandées
const [expandedSections, setExpandedSections] = useState<Set<string>>(
  new Set(['overview', 'events', 'communication'])
);

// Toggle une section
const toggleSection = (section: string) => {
  const newExpanded = new Set(expandedSections);
  if (newExpanded.has(section)) {
    newExpanded.delete(section);
  } else {
    newExpanded.add(section);
  }
  setExpandedSections(newExpanded);
};
```

### Comptage des Items

```typescript
const sectionCounts = menuItems.reduce((acc, item) => {
  if (item.superAdminOnly && !isSuperAdmin) return acc;
  if (item.section) {
    acc[item.section] = (acc[item.section] || 0) + 1;
  }
  return acc;
}, {} as Record<string, number>);
```

---

## 📝 Notes de Développement

### Animations
- Transitions CSS natives pour fluidité
- Durée : 200ms
- Easing : ease-in-out

### Accessibilité
- Boutons avec labels clairs
- États visuels distincts (ouvert/fermé)
- Contraste suffisant pour tous les éléments

### Performance
- Pas de re-render inutile
- État local pour chaque toggle
- Comptage optimisé des items

---

## 🔄 Historique

### Version 2.1 (07/11/2025)
- ✅ Ajout du système d'accordéon
- ✅ Compteurs d'items par section
- ✅ Indicateurs visuels chevron
- ✅ États par défaut configurables
- ✅ Animations de transition

### Version 2.0 (07/11/2025)
- ✅ Organisation en 6 sections
- ✅ Codes couleurs par section

---

**Dernière mise à jour** : 07/11/2025
**Version** : 2.1
