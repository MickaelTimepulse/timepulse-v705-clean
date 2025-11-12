# 🚀 Comment déployer depuis Bolt vers Vercel

## Le problème
Bolt est un environnement de développement isolé. Vos modifications ici ne sont PAS automatiquement déployées sur Vercel.

## ✅ Solution étape par étape

### 1️⃣ Télécharger le code depuis Bolt

Dans Bolt, cliquez sur le bouton **"Export"** ou **"Download"** pour télécharger tout le projet en ZIP.

### 2️⃣ Extraire et préparer le code

```bash
# Décompresser le ZIP
unzip timepulse-project.zip

# Aller dans le dossier
cd timepulse-project
```

### 3️⃣ Pousser vers GitHub

**Si vous avez déjà un repository GitHub :**

```bash
# Initialiser git si nécessaire
git init

# Ajouter tous les fichiers
git add .

# Créer un commit
git commit -m "Update from Bolt - Latest version with admin fixes"

# Ajouter votre remote GitHub (remplacer par votre URL)
git remote add origin https://github.com/VOTRE-USERNAME/timepulse.git

# Pousser vers GitHub
git push -u origin main
```

**Si vous n'avez PAS de repository GitHub :**

1. Allez sur [github.com](https://github.com)
2. Créez un nouveau repository (ex: "timepulse")
3. Suivez les instructions GitHub pour pousser votre code

### 4️⃣ Connecter à Vercel (si pas déjà fait)

1. Allez sur [vercel.com](https://vercel.com)
2. Cliquez sur **"New Project"**
3. Importez votre repository GitHub
4. Ajoutez vos variables d'environnement :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_STRIPE_PUBLIC_KEY` (optionnel)
5. Déployez !

### 5️⃣ Mises à jour futures

Chaque fois que vous modifiez le code sur Bolt :

```bash
# Télécharger depuis Bolt
# Extraire
# Puis :
git add .
git commit -m "Description des modifications"
git push
```

Vercel redéploiera automatiquement !

---

## 🎯 Alternative : Utiliser le CLI Vercel

```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Déployer depuis Bolt
vercel --prod
```

---

## 📝 Note importante

**Vos variables d'environnement** (fichier `.env`) ne sont PAS dans Git.
Vous devez les configurer manuellement sur Vercel :

1. Vercel Dashboard → Votre projet
2. Settings → Environment Variables
3. Ajouter toutes les variables du fichier `.env`

---

## ✅ Vérification

Une fois déployé, testez :
- `https://votre-domaine.vercel.app/`
- `https://votre-domaine.vercel.app/admin/login`

Tout devrait fonctionner ! 🎉
