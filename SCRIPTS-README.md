# 📜 Scripts d'Automatisation Timepulse

## 🎯 Vue d'Ensemble

Ce dossier contient des scripts pour automatiser le déploiement et la maintenance de Timepulse.

---

## 📂 Scripts Disponibles

| Script | Usage | Quand l'utiliser |
|--------|-------|------------------|
| `setup-auto-deploy.sh` | Configuration initiale | **1 fois** au début |
| `deploy.sh` | Déployer sur GitHub + Vercel | **Quotidien** |
| `deploy.bat` | Version Windows | **Quotidien** (Windows) |
| `backup-database.sh` | Info backups Supabase | Avant gros changements |

---

## ⚡ Démarrage Rapide

### 1️⃣ Première Installation (Mac/Linux)

```bash
chmod +x *.sh
./setup-auto-deploy.sh
```

### 1️⃣ Première Installation (Windows)

Double-clic sur `setup-auto-deploy.bat` (si créé)
Ou utiliser Git Bash et suivre les instructions Mac/Linux

---

### 2️⃣ Déployer des Modifications

**Mac/Linux :**
```bash
./deploy.sh "Mon message"
```

**Windows :**
```cmd
deploy.bat "Mon message"
```

---

## 🔄 Workflow Type

```
1. Modifier le code
2. Tester en local (npm run dev)
3. Déployer : ./deploy.sh "Description"
4. Attendre 2 minutes
5. Vérifier sur Vercel
```

---

## 📚 Documentation

- **Guide Rapide** : [QUICK-DEPLOY.md](./QUICK-DEPLOY.md)
- **Guide Complet** : [AUTOMATION-GUIDE.md](./AUTOMATION-GUIDE.md)
- **Déploiement Production** : [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 🎉 Avantages

✅ Déploiement en 30 secondes au lieu de 10 minutes
✅ Pas d'erreurs manuelles
✅ Historique complet des changements
✅ Rollback facile en cas de problème

---

## 🆘 Aide

Consulte [AUTOMATION-GUIDE.md](./AUTOMATION-GUIDE.md) pour la résolution de problèmes.

---

**Questions ? Contacte l'équipe Timepulse !** 🚀
