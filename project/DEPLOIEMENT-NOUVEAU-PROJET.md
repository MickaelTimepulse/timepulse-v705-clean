# 🚀 Déploiement sur un NOUVEAU projet Vercel

## Pourquoi un nouveau projet ?

Le projet Vercel actuel a un **cache corrompu** qui empêche le déploiement. La solution la plus rapide est de créer un **nouveau projet Vercel propre**.

## 📋 Étapes de déploiement

### 1️⃣ Exécuter le script de déploiement

**Windows:**
```bash
deploy-nouveau-projet.bat
```

**Linux/Mac:**
```bash
./deploy-nouveau-projet.sh
```

### 2️⃣ Créer le nouveau projet Vercel

Une fois le build terminé, exécutez:

```bash
vercel --name timepulse-v2-clean --prod --yes
```

**Répondez aux questions:**
- `Set up and deploy "project"?` → **Y**
- `Which scope do you want to deploy to?` → Votre compte
- `Link to existing project?` → **N** (créer un nouveau)
- `What's your project's name?` → **timepulse-v2-clean**
- `In which directory is your code located?` → **./** (appuyez sur Entrée)

### 3️⃣ Configurer les variables d'environnement

Une fois déployé, allez sur:
https://vercel.com/dashboard

1. Ouvrez le projet **timepulse-v2-clean**
2. Allez dans **Settings** → **Environment Variables**
3. Ajoutez ces variables (copiez depuis `.env`):

```
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_cle_anon
```

4. **Redéployez** pour appliquer les variables:
```bash
vercel --prod --yes
```

### 4️⃣ (Optionnel) Configurer un domaine personnalisé

1. Dans **Settings** → **Domains**
2. Ajoutez: `timepulse.fr` et `www.timepulse.fr`
3. Suivez les instructions pour configurer les DNS

## ✅ C'est tout !

Votre nouveau projet sera accessible sur:
- URL temporaire: `https://timepulse-v2-clean.vercel.app`
- Domaine personnalisé: `https://timepulse.fr` (après configuration DNS)

## 🗑️ Supprimer l'ancien projet (optionnel)

Une fois le nouveau projet en production:

1. Allez sur https://vercel.com/dashboard
2. Ouvrez l'**ancien projet** (timepulsev2)
3. **Settings** → **General** → en bas: **Delete Project**

---

💡 **Note**: Le nouveau projet n'aura AUCUN cache corrompu et fonctionnera parfaitement !
