# Mode Maintenance - Guide Complet

## Vue d'ensemble

Le mode maintenance est une fonctionnalité qui permet aux administrateurs de mettre temporairement le site hors ligne pour les visiteurs publics tout en maintenant l'accès à l'interface d'administration.

## Caractéristiques

### Page de Maintenance
- Design professionnel et moderne
- Image de fond : Tour Eiffel avec coureur (`/tour-eiffel-coureur.jpeg`)
- Message personnalisable
- Animations et effets visuels
- Bouton de rafraîchissement
- Responsive (mobile/desktop)

### Fonctionnalités
- Activation/désactivation en un clic
- Message personnalisable
- Accès admin toujours disponible
- Mise à jour en temps réel (vérification toutes les 30 secondes)
- Stockage des paramètres en base de données

## Utilisation

### Activer le Mode Maintenance

1. Se connecter en tant qu'administrateur
2. Aller dans **Administration → Paramètres**
3. Dans la section **Mode Maintenance** (en haut)
4. Modifier le message si nécessaire
5. Cliquer sur **"🔴 Activer la maintenance"**
6. Le site basculera en mode maintenance après 2 secondes

### Désactiver le Mode Maintenance

1. Se connecter en tant qu'administrateur
2. Aller dans **Administration → Paramètres**
3. Cliquer sur **"🟢 Désactiver la maintenance"**
4. Le site redeviendra accessible immédiatement

## Architecture Technique

### Base de Données

**Migration** : `20260107150000_add_maintenance_mode.sql`

Deux paramètres dans la table `settings` :
- `maintenance_mode` : 'true' ou 'false'
- `maintenance_message` : Message affiché sur la page

### Composants

#### 1. `src/pages/Maintenance.tsx`
Page affichée aux visiteurs quand le mode est activé :
- Design moderne avec gradient bleu
- Image de fond (Tour Eiffel)
- Animations de fond
- Message personnalisé
- Bouton de rafraîchissement
- Informations pratiques

#### 2. `src/components/MaintenanceCheck.tsx`
Composant HOC (Higher Order Component) qui :
- Vérifie le statut du mode maintenance toutes les 30 secondes
- Redirige vers `/maintenance` si activé (sauf admins)
- Permet l'accès aux routes `/admin/*` même en maintenance
- Affiche un loader pendant la vérification initiale

#### 3. `src/pages/AdminSettings.tsx`
Section dans les paramètres admin avec :
- Toggle on/off du mode maintenance
- Éditeur de message
- Indicateur visuel du statut
- Alertes de confirmation

### Routes

**Route maintenance** : `/maintenance`
- Accessible même en mode maintenance
- Affiche la page de maintenance
- Non protégée (publique)

**Routes admin** : `/admin/*`
- Toujours accessibles même en maintenance
- Permettent de gérer le site pendant la maintenance

## Design de la Page Maintenance

### Éléments Visuels

1. **Header**
   - Logo Timepulse
   - Titre "Timepulse"

2. **Card Principale**
   - Icône animée (clé à molette qui rebondit)
   - Titre "Maintenance en cours"
   - Message personnalisé
   - 2 cartes d'information :
     - Durée estimée
     - Améliorations en cours
   - Bouton de rafraîchissement
   - Contact support

3. **Background**
   - Image Tour Eiffel avec coureur (opacité 20%)
   - Gradient bleu (from-blue-900 via-blue-800 to-blue-900)
   - Animations de bulles colorées

### Couleurs

- Fond principal : Dégradé bleu (#1e3a8a → #1e40af → #1e3a8a)
- Card : Blanc avec 95% opacité + backdrop-blur
- Accents : Bleu (#3b82f6), Vert (#10b981)
- Texte : Gris (#374151, #6b7280)

## Cas d'Usage

### Quand Activer la Maintenance ?

1. **Mises à jour majeures**
   - Déploiement de nouvelles fonctionnalités
   - Refonte de l'interface
   - Mise à jour de la base de données

2. **Maintenance technique**
   - Migration de serveur
   - Optimisations performance
   - Corrections de bugs critiques

3. **Interventions d'urgence**
   - Problèmes de sécurité
   - Pannes techniques
   - Restauration de backup

### Bonnes Pratiques

1. **Planifier la maintenance**
   - Prévenir les utilisateurs à l'avance
   - Choisir des heures creuses
   - Estimer la durée

2. **Message clair**
   - Expliquer la raison
   - Indiquer la durée estimée
   - Fournir un contact d'urgence

3. **Tests**
   - Vérifier que le mode s'active correctement
   - Tester l'accès admin
   - Vérifier la désactivation

## Exemples de Messages

### Message Standard
```
Nous effectuons actuellement une maintenance programmée pour améliorer votre expérience.
Le site sera de nouveau disponible très prochainement.
```

### Message avec Horaire
```
Maintenance programmée en cours.
Le site sera de nouveau accessible à 14h00 (heure de Paris).
Merci de votre patience.
```

### Message Urgence
```
Nous rencontrons actuellement un problème technique et travaillons activement à sa résolution.
Le service sera rétabli dans les plus brefs délais.
Pour toute urgence : support@timepulse.fr
```

### Message Mise à Jour
```
Nous installons de nouvelles fonctionnalités pour améliorer votre expérience !
Le site sera de nouveau en ligne d'ici 30 minutes.
Merci pour votre compréhension.
```

## Sécurité

### Contrôles d'Accès

- Seuls les **super admins** peuvent activer/désactiver le mode
- Les routes `/admin/*` restent accessibles aux admins authentifiés
- Toutes les autres routes sont bloquées pour les visiteurs
- Vérification automatique toutes les 30 secondes

### Stockage Sécurisé

- Paramètres stockés dans la table `settings`
- RLS (Row Level Security) activé
- Accès restreint aux admins

## Monitoring

### Vérification du Statut

Le composant `MaintenanceCheck` :
- Vérifie le statut toutes les 30 secondes
- Ne bloque pas le chargement initial
- Affiche un loader pendant la vérification
- Stocke le message dans localStorage

### Logs

Toutes les actions sont loguées :
- Activation du mode maintenance
- Désactivation du mode maintenance
- Modification du message
- Tentatives d'accès en mode maintenance

## Dépannage

### Le Site Reste en Maintenance

1. Vérifier dans la base de données :
```sql
SELECT * FROM settings WHERE key = 'maintenance_mode';
```

2. Forcer la désactivation si nécessaire :
```sql
UPDATE settings SET value = 'false' WHERE key = 'maintenance_mode';
```

### Les Admins Sont Bloqués

Vérifier que les routes admin ne sont pas bloquées dans `MaintenanceCheck.tsx` :
```typescript
if (!location.pathname.startsWith('/admin'))
```

### Message Non Mis à Jour

1. Vider le cache navigateur
2. Vérifier localStorage
3. Rafraîchir la page avec Ctrl+Shift+R

## Code Source

### Fichiers Modifiés

1. `supabase/migrations/20260107150000_add_maintenance_mode.sql`
2. `src/pages/Maintenance.tsx`
3. `src/components/MaintenanceCheck.tsx`
4. `src/pages/AdminSettings.tsx`
5. `src/App.tsx`

### Commandes Git

```bash
# Vérifier les modifications
git status

# Commiter les changements
git add .
git commit -m "feat: ajout mode maintenance avec page professionnelle"

# Déployer
npm run build
vercel --prod
```

## Support

Pour toute question ou problème :
- Email : support@timepulse.fr
- Documentation : Voir ce fichier
- Admin : Se connecter à `/admin/settings`

---

**Dernière mise à jour** : 7 Janvier 2026
**Version** : 1.0.0
**Statut** : ✅ Production Ready
