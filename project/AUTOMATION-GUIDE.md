# 🤖 Guide d'Automatisation Timepulse

## 📋 Vue d'Ensemble

Ce guide explique comment utiliser les scripts d'automatisation pour gérer facilement le déploiement et la maintenance de Timepulse.

---

## 🚀 Scripts Disponibles

### 1. `setup-auto-deploy.sh` - Configuration Initiale

**À lancer UNE SEULE FOIS** lors de la première installation.

```bash
./setup-auto-deploy.sh
```

**Ce script fait :**
- ✅ Configure Git (nom, email)
- ✅ Initialise le dépôt Git
- ✅ Crée le .gitignore
- ✅ Te guide pour créer le repo GitHub
- ✅ Configure le remote GitHub
- ✅ Fait le premier commit et push
- ✅ Te guide pour configurer Vercel

**Durée : ~10 minutes** (avec la création des comptes GitHub/Vercel)

---

### 2. `deploy.sh` - Déploiement Automatique

**À lancer À CHAQUE FOIS** que tu veux déployer des modifications.

```bash
./deploy.sh "Message de commit"
```

**Exemples :**
```bash
./deploy.sh "Ajout page résultats"
./deploy.sh "Fix bug inscription"
./deploy.sh "Mise à jour dashboard admin"
```

**Ce script fait :**
1. ✅ Vérifie que le build fonctionne (`npm run build`)
2. ✅ Commit les changements avec ton message
3. ✅ Push vers GitHub
4. ✅ Vercel déploie automatiquement

**Durée : ~30 secondes** (hors temps de build Vercel)

---

### 3. `backup-database.sh` - Backup Base de Données

**À lancer AVANT** des opérations sensibles ou régulièrement.

```bash
./backup-database.sh
```

**Ce script fait :**
- ✅ Affiche le lien vers les backups Supabase
- ✅ Crée un fichier d'info pour traçabilité
- ✅ Te guide vers le Dashboard Supabase

**Note :** Supabase fait des backups automatiques quotidiens. Ce script est un aide-mémoire.

---

## 🎯 Workflow Complet

### Configuration Initiale (1 fois)

```bash
# 1. Configurer l'automatisation
./setup-auto-deploy.sh

# 2. Suivre les instructions à l'écran
# - Créer repo GitHub
# - Configurer Vercel
# - Ajouter variables d'environnement
```

---

### Déployer des Modifications (quotidien)

```bash
# 1. Modifier le code
# (éditer les fichiers avec ton éditeur)

# 2. Déployer
./deploy.sh "Description des changements"

# 3. Vérifier sur Vercel
# → https://vercel.com/dashboard
# → Attendre ~2 minutes
# → Tester l'URL
```

---

### Avant une Grosse Modification

```bash
# 1. Backup de sécurité
./backup-database.sh

# 2. Faire les modifications

# 3. Déployer
./deploy.sh "Grosse mise à jour"
```

---

## 📊 Exemples d'Utilisation

### Scénario 1 : Corriger un Bug

```bash
# 1. Corriger le bug dans le code
# 2. Tester en local (npm run dev)
# 3. Déployer
./deploy.sh "Fix: bug paiement Lyra"
```

**Résultat :** Code corrigé en ligne en 2 minutes

---

### Scénario 2 : Ajouter une Fonctionnalité

```bash
# 1. Développer la fonctionnalité
# 2. Tester en local
# 3. Déployer
./deploy.sh "Feature: export Excel pour organisateurs"
```

**Résultat :** Nouvelle fonctionnalité disponible en production

---

### Scénario 3 : Mise à Jour de la Base de Données

```bash
# 1. Backup préventif
./backup-database.sh

# 2. Créer la migration dans supabase/migrations/

# 3. Appliquer via Supabase Dashboard

# 4. Déployer le code qui utilise la nouvelle structure
./deploy.sh "DB: ajout table notifications"
```

**Résultat :** Base de données mise à jour + code adapté en ligne

---

## ⚠️ Résolution de Problèmes

### Erreur : "Git not configured"

```bash
git config --global user.name "Ton Nom"
git config --global user.email "ton@email.com"
```

Puis relance le script.

---

### Erreur : "Build failed"

Le script s'arrête si le build échoue. Pour voir l'erreur :

```bash
npm run build
```

Corrige les erreurs affichées, puis relance `./deploy.sh`.

---

### Erreur : "Remote not found"

Il manque le remote GitHub :

```bash
git remote add origin https://github.com/TON-COMPTE/timepulse-platform.git
```

Puis relance le script.

---

### Le Site Ne Se Met Pas à Jour

1. Vérifie que le push GitHub a fonctionné :
   ```bash
   git log
   ```

2. Va sur Vercel Dashboard : https://vercel.com/dashboard
   - Vérifie qu'un déploiement est en cours
   - Regarde les logs s'il y a une erreur

3. Vérifie les variables d'environnement dans Vercel :
   - Settings → Environment Variables
   - VITE_SUPABASE_URL doit être défini
   - VITE_SUPABASE_ANON_KEY doit être défini

---

## 🎓 Best Practices

### Messages de Commit Clairs

✅ **BON :**
```bash
./deploy.sh "Fix: erreur 500 lors de l'inscription"
./deploy.sh "Feature: ajout filtres sur résultats"
./deploy.sh "Update: amélioration performance dashboard"
```

❌ **MAUVAIS :**
```bash
./deploy.sh "corrections"
./deploy.sh "test"
./deploy.sh "update"
```

---

### Déployer Régulièrement

- ✅ Déployer après chaque fonctionnalité terminée
- ✅ Déployer après chaque bug fix
- ✅ Tester en local avant de déployer
- ❌ Ne pas accumuler des jours de modifications

---

### Tester Avant de Déployer

```bash
# 1. Test local
npm run dev
# → Tester manuellement les changements

# 2. Build
npm run build
# → Vérifier qu'il n'y a pas d'erreurs

# 3. Déployer
./deploy.sh "Message"
```

---

## 📞 Support

### En Cas de Blocage

1. **Vérifie les logs** :
   - Terminal pour les erreurs Git
   - Vercel Dashboard pour les erreurs de build

2. **Rollback si nécessaire** :
   - Vercel Dashboard → Deployments
   - Clique sur un ancien déploiement
   - "Promote to Production"

3. **Restaurer la base de données** :
   - Supabase Dashboard → Database → Backups
   - Point-in-time Recovery (7 derniers jours)

---

## 🎯 Résumé Rapide

### Configuration (1 fois)
```bash
./setup-auto-deploy.sh
```

### Déploiement (quotidien)
```bash
./deploy.sh "Message"
```

### Backup (avant gros changements)
```bash
./backup-database.sh
```

---

## 📚 Ressources

- **GitHub** : https://github.com
- **Vercel Dashboard** : https://vercel.com/dashboard
- **Supabase Dashboard** : https://supabase.com/dashboard
- **Documentation Vercel** : https://vercel.com/docs

---

## 🎉 Avantages de l'Automatisation

✅ **Gain de temps** : 30 secondes au lieu de 10 minutes
✅ **Moins d'erreurs** : Scripts testés et fiables
✅ **Traçabilité** : Historique Git complet
✅ **Rollback facile** : Retour arrière en 1 clic sur Vercel
✅ **Collaboratif** : Toute l'équipe peut déployer facilement

---

**Prêt à automatiser ? Lance `./setup-auto-deploy.sh` maintenant !** 🚀
