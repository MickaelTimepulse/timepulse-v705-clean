# Images à Uploader pour les Templates Email

## 📍 Emplacement
Toutes les images doivent être uploadées dans : `/public/email_assets/`

## 🖼️ Liste des Images Nécessaires

### 1. **marathon-runners.jpg**
- **Utilisé pour** : Rappel J-7, Email de bienvenue admin, Inscription validée
- **Type** : Coureurs de marathon en pleine course
- **Dimensions recommandées** : 1200x400px minimum
- **Poids** : < 500KB

### 2. **runner-victory.jpg**
- **Utilisé pour** : Résultats disponibles, Confirmation paiement
- **Type** : Coureur franchissant la ligne d'arrivée / victoire
- **Dimensions recommandées** : 1200x400px minimum
- **Poids** : < 500KB

### 3. **running-outdoor.jpg**
- **Utilisé pour** : Confirmation de remboursement, Emails généraux
- **Type** : Course à pied en extérieur (nature, route)
- **Dimensions recommandées** : 1200x400px minimum
- **Poids** : < 500KB

### 4. **starting-line.jpg**
- **Utilisé pour** : Notification échange de dossard, Info départ course
- **Type** : Ligne de départ avec coureurs, banderole START
- **Dimensions recommandées** : 1200x400px minimum
- **Poids** : < 500KB

### 5. **trail-running.jpg**
- **Utilisé pour** : Suppression de compte, Annulation inscription
- **Type** : Trail running, course nature
- **Dimensions recommandées** : 1200x400px minimum
- **Poids** : < 500KB

### 6. **athletics-track.jpg**
- **Utilisé pour** : Confirmation inscription, Modification inscription
- **Type** : Piste d'athlétisme, coureurs sur piste
- **Dimensions recommandées** : 1200x400px minimum
- **Poids** : < 500KB

## ✅ Critères de Qualité

1. **Résolution** : Minimum 1200px de largeur
2. **Format** : JPG ou JPEG (meilleure compression)
3. **Poids** : Maximum 500KB par image
4. **Ratio** : 3:1 (paysage horizontal)
5. **Luminosité** : Images claires pour que le texte blanc soit lisible
6. **Thème** : UNIQUEMENT du sport (running, trail, athlétisme)

## 🚫 À ÉVITER Absolument

- Pizza, nourriture
- Animaux (chats, chiens)
- Villes, monuments
- Câbles, technologie
- Images de stock génériques sans rapport avec le sport

## 📝 Après Upload

Une fois les 6 images uploadées dans `/public/email_assets/`, les templates email les utiliseront automatiquement via l'URL :
```
https://votre-domaine.com/email_assets/[nom-image].jpg
```

## 🔄 Sources Recommandées

- Unsplash.com (rechercher "marathon", "running race", "athletics")
- Pexels.com (télécharger puis uploader localement)
- Adobe Stock (si vous avez une licence)
- Photos Timepulse de vos propres événements

## 🎯 Pourquoi des Images Locales ?

1. **Contrôle total** : Vous choisissez vos images
2. **Performance** : Pas de dépendance externe
3. **Branding** : Vous pouvez utiliser VOS photos d'événements
4. **Fiabilité** : Les liens externes peuvent casser
