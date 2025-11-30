# Guide de Déploiement Rapide - Timepulse

## 🎯 Objectif
Ce guide explique comment déployer rapidement les modifications de code faites dans Bolt vers la version production sur Vercel.

## 📊 Comprendre l'Architecture

### Données (Supabase)
```
┌─────────────────┐
│   SUPABASE      │ ← Base de données centralisée
│  (Production)   │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼──┐  ┌──▼───┐
│ Bolt │  │Vercel│
│ Dev  │  │ Prod │
└──────┘  └──────┘
```

**Important** : Les deux environnements utilisent la MÊME base de données Supabase.
- ✅ Les données saisies en production sont visibles dans Bolt
- ✅ Les données saisies dans Bolt sont visibles en production
- ✅ Aucun risque de perte de données

### Code (GitHub + Vercel)
```
┌──────┐    git push    ┌────────┐    auto    ┌────────┐
│ Bolt │ ──────────────→ │ GitHub │ ─────────→ │ Vercel │
└──────┘                 └────────┘             └────────┘
  Local                    Repository           Production
```

## 🚀 Méthode 1 : Déploiement Automatique (Recommandée)

### Prérequis
- Git configuré dans le projet
- Repository GitHub actif
- Vercel configuré pour déployer automatiquement depuis GitHub

### Commandes
```bash
# Depuis le terminal Bolt
git add .
git commit -m "Description des modifications"
git push origin main
```

**Résultat** : Vercel détecte automatiquement le push et déploie en ~2-3 minutes.

### Vérification
1. Va sur https://vercel.com/dashboard
2. Tu verras le déploiement en cours
3. Attends que le statut passe à "Ready"
4. Teste sur https://timepulsesport.com

## 🔧 Méthode 2 : Déploiement Manuel (Plus rapide)

Si tu veux déployer immédiatement sans passer par GitHub :

### Windows (Double-clic)
```
DEPLOYER.bat
```

### Commande manuelle
```bash
npm run deploy
```

**Résultat** : Déploiement direct sur Vercel en ~1-2 minutes.

## 📝 Workflow Recommandé

### Pour les petites modifications (texte, style, correction bug)
```bash
# 1. Faire les modifications dans Bolt
# 2. Tester localement
# 3. Déployer directement
npm run deploy
```

### Pour les grosses fonctionnalités
```bash
# 1. Faire les modifications dans Bolt
# 2. Tester localement
# 3. Commit sur GitHub
git add .
git commit -m "Nouvelle fonctionnalité: [description]"
git push origin main
# 4. Vercel déploie automatiquement
```

## 🔍 Vérifications Post-Déploiement

### Checklist de base
- [ ] Le site charge correctement
- [ ] La connexion admin fonctionne
- [ ] Les données s'affichent correctement
- [ ] Pas d'erreurs dans la console navigateur

### En cas de problème
```bash
# Voir les logs de déploiement
vercel logs

# Revenir à la version précédente
vercel rollback
```

## ⚡ Déploiement Express (30 secondes)

Pour un déploiement ultra-rapide sans questions :

### Windows
```bash
MAJ_DU_SITE.bat
```

### Linux/Mac
```bash
./deploy-quick.sh
```

Ces scripts font automatiquement :
1. Build du projet
2. Déploiement sur Vercel
3. Affichage de l'URL de production

## 🛡️ Sécurité des Données

### Ce qui est sauvegardé automatiquement
- ✅ Tous les événements créés
- ✅ Tous les organisateurs
- ✅ Toutes les inscriptions
- ✅ Tous les résultats
- ✅ Toutes les configurations
- ✅ Tous les emails envoyés

### Ce qui n'est PAS dans la base de données
- ❌ Le code de l'application (stocké sur GitHub)
- ❌ Les fichiers de configuration locale (.env)
- ❌ Les assets publics (images statiques)

## 📦 Sauvegarde Complète (Optionnelle)

Si tu veux une sauvegarde complète incluant le code :

```bash
# Sauvegarde de la base de données
npm run backup:full

# Exporter tout le projet
git archive -o timepulse-backup-$(date +%Y%m%d).zip HEAD
```

## 🔄 Synchronisation Bolt ↔ Production

### Scénario 1 : Modifications dans Bolt
```
Bolt (code modifié) → git push → GitHub → Vercel → Production (à jour)
                                               ↓
                                            Supabase (données inchangées)
```

### Scénario 2 : Saisie de données en Production
```
Production (saisie données) → Supabase → Visible immédiatement dans Bolt
```

### Scénario 3 : Migration base de données dans Bolt
```
Bolt (nouvelle migration) → Supabase (structure modifiée) → Visible immédiatement en Production
```

## ⏱️ Temps de Déploiement

| Méthode | Temps | Avantages |
|---------|-------|-----------|
| `DEPLOYER.bat` | 1-2 min | Ultra rapide, direct |
| `git push` → Vercel | 2-3 min | Historique git, rollback facile |
| `npm run deploy` | 1-2 min | Contrôle total |

## 🎓 Bonnes Pratiques

### Avant de déployer
1. ✅ Tester en local (dans Bolt)
2. ✅ Vérifier qu'il n'y a pas d'erreurs dans la console
3. ✅ Tester les fonctionnalités modifiées
4. ✅ Vérifier que le build passe : `npm run build`

### Après le déploiement
1. ✅ Tester la fonctionnalité en production
2. ✅ Vérifier les logs Vercel en cas d'erreur
3. ✅ Faire un rollback si nécessaire

### Fréquence recommandée
- 🟢 **Petites modifications** : Déployer immédiatement
- 🟡 **Fonctionnalités moyennes** : Déployer en fin de journée
- 🔴 **Grosses refonte** : Déployer après tests approfondis

## 📞 En Cas de Problème

### Le déploiement échoue
```bash
# Voir les erreurs détaillées
npm run build

# Si erreur TypeScript
npm run typecheck
```

### Les données ne s'affichent pas
1. Vérifier que Supabase est accessible
2. Vérifier les variables d'environnement sur Vercel
3. Vérifier les logs : `vercel logs`

### Version précédente fonctionnait mieux
```bash
# Retour à la version précédente
vercel rollback
```

## 🎯 Résumé : Flux de Travail Quotidien

```
1. Ouvrir Bolt
2. Faire les modifications
3. Tester localement
4. Double-clic sur DEPLOYER.bat (Windows)
   OU
   npm run deploy (commande)
5. Attendre 1-2 minutes
6. Tester sur timepulsesport.com
7. Continuer le travail
```

## ✨ Points Clés à Retenir

1. **Les données sont toujours en sécurité** : Elles sont dans Supabase, pas dans le code
2. **Le code doit être déployé** : Les modifications de Bolt ne sont pas automatiquement en production
3. **Le déploiement est rapide** : 1-2 minutes avec `npm run deploy`
4. **Rollback possible** : Tu peux toujours revenir en arrière
5. **Pas de perte de données** : Quoi qu'il arrive, les données restent dans Supabase

## 🔗 Liens Utiles

- **Production** : https://timepulsesport.com
- **Vercel Dashboard** : https://vercel.com/dashboard
- **Supabase Dashboard** : https://supabase.com/dashboard/project/[votre-projet-id]
- **Repository GitHub** : [URL de votre repo]

---

**Questions ?** N'hésite pas à demander de l'aide ! 🚀
