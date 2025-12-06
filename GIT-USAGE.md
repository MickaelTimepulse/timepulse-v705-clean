# 📦 Guide d'Utilisation Git - TimePulse v705 Clean

## 🎯 Repository GitHub
**URL:** `https://github.com/MickaelTimepulse/timepulse-v705-clean`

---

## 🚀 Scripts Disponibles

### 1️⃣ Push Automatique Complet (Recommandé)

**Windows:**
```bash
push-github-v705.bat
```

**Linux/Mac:**
```bash
./push-github-v705.sh
```

**Que fait ce script ?**
- ✅ Ajoute tous les fichiers modifiés (`git add .`)
- ✅ Demande un message de commit (ou génère automatiquement)
- ✅ Configure le remote GitHub
- ✅ Push vers `timepulse-v705-clean`

---

### 2️⃣ Push Rapide (Quick Push)

**Windows:**
```bash
quick-push.bat "Mon message de commit"
```

**Linux/Mac:**
```bash
./quick-push.sh "Mon message de commit"
```

**Exemples:**
```bash
# Avec message personnalisé
./quick-push.sh "Ajout effets diplômes"

# Sans message (génère automatiquement)
./quick-push.sh
```

---

### 3️⃣ Commandes NPM

**Push rapide:**
```bash
npm run git:push
```

**Voir le statut:**
```bash
npm run git:status
```

**Voir l'historique:**
```bash
npm run git:log
```

---

## 📝 Workflow Recommandé

### Méthode 1 : Script Complet (Débutant)
```bash
# Windows
push-github-v705.bat

# Linux/Mac
./push-github-v705.sh
```
👉 Idéal pour: Premier push, configuration initiale

---

### Méthode 2 : Quick Push (Rapide)
```bash
# Avec votre message
./quick-push.sh "Fix drapeaux diplômes"

# Ou via npm
npm run git:push
```
👉 Idéal pour: Mises à jour quotidiennes

---

### Méthode 3 : Commandes Git Manuelles
```bash
# 1. Ajouter les fichiers
git add .

# 2. Commiter
git commit -m "Votre message"

# 3. Pousser
git push origin main
```
👉 Idéal pour: Contrôle total

---

## 🔧 Configuration Initiale

Si vous clonez le projet ou changez de machine :

```bash
# 1. Configurer votre identité Git
git config user.name "Mickael TimePulse"
git config user.email "mickael@timepulse.fr"

# 2. Vérifier le remote
git remote -v

# 3. Si besoin, ajouter le remote
git remote add origin https://github.com/MickaelTimepulse/timepulse-v705-clean.git
```

---

## 🔐 Authentification GitHub

### Token d'Accès Personnel (Recommandé)

1. Aller sur GitHub → Settings → Developer settings → Personal access tokens
2. Générer un nouveau token (classic)
3. Cocher: `repo` (full control)
4. Copier le token

**Lors du push:**
- Username: `MickaelTimepulse`
- Password: `<votre_token>`

### Enregistrer les Credentials (Windows)

```bash
git config --global credential.helper wincred
```

### Enregistrer les Credentials (Linux/Mac)

```bash
git config --global credential.helper store
```

---

## 📊 Commandes Utiles

```bash
# Voir les modifications
git status

# Voir l'historique
git log --oneline -10

# Annuler le dernier commit (garder les modifications)
git reset --soft HEAD~1

# Voir les différences
git diff

# Créer une branche
git checkout -b nouvelle-branche

# Changer de branche
git checkout main
```

---

## ⚠️ Bonnes Pratiques

### ✅ À Faire
- Commit régulièrement (plusieurs fois par jour)
- Messages de commit clairs et descriptifs
- Tester avant de push (`npm run build`)
- Utiliser des branches pour les grosses features

### ❌ À Éviter
- Commit de fichiers sensibles (.env avec vraies clés)
- Messages vagues ("fix", "update")
- Push de node_modules (déjà dans .gitignore)
- Commit de code non testé

---

## 🆘 Résolution de Problèmes

### Erreur: "fatal: not a git repository"
```bash
git init
git remote add origin https://github.com/MickaelTimepulse/timepulse-v705-clean.git
```

### Erreur: "Authentication failed"
- Vérifier vos credentials GitHub
- Utiliser un token d'accès personnel

### Erreur: "Updates were rejected"
```bash
# Récupérer les dernières modifications
git pull origin main --rebase

# Puis push
git push origin main
```

### Conflit de merge
```bash
# 1. Résoudre manuellement les conflits dans les fichiers
# 2. Marquer comme résolu
git add .

# 3. Continuer le rebase
git rebase --continue
```

---

## 📚 Resources

- [Documentation Git](https://git-scm.com/doc)
- [GitHub Docs](https://docs.github.com)
- [Git Cheat Sheet](https://education.github.com/git-cheat-sheet-education.pdf)

---

## 🎉 Raccourcis Utiles

```bash
# Alias Git recommandés
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.unstage 'reset HEAD --'

# Puis utiliser:
git st      # au lieu de git status
git co main # au lieu de git checkout main
```
