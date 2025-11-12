# ⚡ Quick Deploy - Timepulse

## 🚀 Démarrage Ultra-Rapide

### Première Fois (Configuration - 10 min)

```bash
./setup-auto-deploy.sh
```

Suis les instructions à l'écran. Le script te guide étape par étape.

---

### Déployer des Modifications (30 secondes)

```bash
./deploy.sh "Ton message de commit"
```

C'est tout ! ✅

---

## 📝 Exemples Concrets

### Tu veux déployer un bug fix

```bash
./deploy.sh "Fix bug paiement"
```

### Tu veux déployer une nouvelle fonctionnalité

```bash
./deploy.sh "Ajout export Excel"
```

### Tu veux déployer une mise à jour

```bash
./deploy.sh "Update dashboard admin"
```

---

## 🎯 Ce Que Font Les Scripts

### `setup-auto-deploy.sh`
1. Configure Git
2. Crée le repo GitHub
3. Configure Vercel
4. Fait le premier déploiement

**Résultat :** Tout est prêt pour les déploiements automatiques

---

### `deploy.sh "Message"`
1. Vérifie que le build fonctionne
2. Commit les changements
3. Push vers GitHub
4. Vercel déploie automatiquement en 2 minutes

**Résultat :** Ton site est mis à jour en production

---

### `backup-database.sh`
1. Affiche le lien vers les backups Supabase
2. Crée un fichier d'info

**Résultat :** Tu sais où trouver les backups en cas de besoin

---

## ⚡ Workflow Quotidien

```bash
# 1. Modifier le code (dans ton éditeur)

# 2. Tester en local (optionnel)
npm run dev

# 3. Déployer
./deploy.sh "Description des changements"

# 4. Attendre 2 minutes

# 5. Vérifier sur ton URL Vercel
```

C'est aussi simple que ça ! 🎉

---

## 🆘 Problèmes ?

### Le script dit "Git not configured"

```bash
git config --global user.name "Ton Nom"
git config --global user.email "ton@email.com"
```

### Le build échoue

```bash
npm run build
```

Regarde l'erreur et corrige-la.

### Le site ne se met pas à jour

Va sur https://vercel.com/dashboard et vérifie les logs.

---

## 💡 Astuces

✅ **Messages de commit clairs** : "Fix bug X" plutôt que "corrections"
✅ **Déployer souvent** : Après chaque fonctionnalité
✅ **Tester avant** : `npm run build` pour vérifier

---

## 🎯 Résumé en 3 Lignes

1. **Configuration (1 fois)** : `./setup-auto-deploy.sh`
2. **Déploiement (quotidien)** : `./deploy.sh "Message"`
3. **Backup (avant gros changements)** : `./backup-database.sh`

**C'est tout ce que tu as besoin de savoir !** 🚀

Pour plus de détails, consulte [AUTOMATION-GUIDE.md](./AUTOMATION-GUIDE.md)
