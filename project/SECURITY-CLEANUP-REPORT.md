# Rapport de Nettoyage de Sécurité

**Date:** 12 novembre 2025
**Alerte:** GitGuardian - 3 secrets exposés publiquement

## Actions Effectuées

### 1. Fichiers Supprimés
Les fichiers suivants contenant des credentials en clair ont été supprimés :

- `ADMIN-LOGIN-TROUBLESHOOTING.md` - Contenait le mot de passe admin
- `AJOUTER-VARIABLES-VERCEL.txt` - Contenait JWT et clés Supabase
- `ADMIN_CREDENTIALS.txt`
- `AdminUsers.txt`
- `COPY-AdminUsers.txt`
- `SETUP-GUIDE.txt`
- `LIRE-EN-PREMIER.txt`
- `LISEZ-MOI-EN-PREMIER.txt`
- `COMMENCER-ICI.txt`
- `COMMENCER-PAR-ICI.md`
- `VERIFICATION-COMPLETE.txt`
- `test-admin-login.html`
- `test-ffa-connection.html`
- `test-direct.html`
- `test-simple.html`
- `test-openai.html`
- `public/test-ffa-license-929636.html`

### 2. .gitignore Amélioré
Ajout de règles complètes pour empêcher l'exposition future de :
- Fichiers de configuration avec credentials
- Documentation contenant des secrets
- Tests avec credentials hardcodés
- Backups et dumps SQL
- Archives compressées
- Scripts de déploiement

## Actions Requises IMMÉDIATEMENT

### 🚨 CRITIQUE: Régénérer les Credentials Compromis

Les credentials suivants sont PUBLICS et doivent être changés :

#### 1. Mot de passe Admin
**Exposé:** `Timepulse2025@!` pour `mickael@timepulse.fr`

**Action:**
```sql
-- Connexion à Supabase Dashboard > SQL Editor
UPDATE admin_users
SET hashed_password = crypt('NOUVEAU_MOT_DE_PASSE_FORT_ICI', gen_salt('bf'))
WHERE email = 'mickael@timepulse.fr';
```

#### 2. Clés Supabase (SI EXPOSÉES)
Si votre Supabase ANON_KEY est compromise (visible dans AJOUTER-VARIABLES-VERCEL.txt), vous devrez :

1. Aller sur https://app.supabase.com
2. Projet > Settings > API
3. Réinitialiser la clé ANON_KEY
4. Mettre à jour dans Vercel
5. Mettre à jour dans `.env`

#### 3. JWT Secret
Si visible dans les fichiers, régénérer dans Supabase Dashboard.

### 🔐 Nettoyage GitHub

Les fichiers ont été supprimés localement mais sont toujours dans l'historique Git.

**Pour purger complètement l'historique:**

```bash
# ATTENTION: Ceci réécrit l'historique Git
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch ADMIN-LOGIN-TROUBLESHOOTING.md" \
  --prune-empty --tag-name-filter cat -- --all

git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch AJOUTER-VARIABLES-VERCEL.txt" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (DANGEREUX - coordonnez avec l'équipe)
git push origin --force --all
```

**Alternative plus sûre:**
Contactez le support GitHub pour purger les secrets de l'historique.

### 📋 Checklist de Sécurité

- [ ] Changer le mot de passe admin
- [ ] Régénérer les clés Supabase si compromises
- [ ] Mettre à jour les variables Vercel
- [ ] Purger l'historique Git des secrets
- [ ] Fermer les alertes GitGuardian
- [ ] Activer les alertes GitHub Secret Scanning
- [ ] Former l'équipe aux bonnes pratiques

## Prévention Future

### Règles à Suivre
1. **JAMAIS** commiter de credentials en clair
2. **TOUJOURS** utiliser des variables d'environnement
3. **VÉRIFIER** le .gitignore avant chaque commit
4. **UTILISER** des outils comme `git-secrets` ou `pre-commit hooks`
5. **AUDITER** régulièrement avec GitGuardian ou GitHub Advanced Security

### Outils Recommandés
- GitGuardian Shield (extension VS Code)
- git-secrets (hooks pre-commit)
- GitHub Secret Scanning (activé par défaut sur repos publics)

## Contact Support

En cas de doute, contactez :
- GitHub Support pour purger l'historique
- GitGuardian pour gérer les alertes
- Supabase Support pour régénérer les clés

---

**Status:** ⚠️ Fichiers supprimés - Credentials à régénérer
