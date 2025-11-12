# 🔄 GUIDE DE SYNCHRONISATION - VERSION 705

**Date:** 12 novembre 2025
**Version Bolt:** v705
**Objectif:** Synchroniser les fichiers Bolt vers votre environnement local

---

## 📋 PROBLÈME IDENTIFIÉ

Vos fichiers locaux ne correspondent pas aux fichiers sur Bolt, ce qui cause des différences entre :
- ✅ La version dans Bolt (v705)
- ❌ La version déployée sur Vercel

---

## 🎯 SOLUTION : 3 MÉTHODES

### **MÉTHODE 1 : Script PowerShell Automatique (RECOMMANDÉ)**

1. **Téléchargez le fichier** `SYNC-TO-LOCAL.ps1` depuis Bolt

2. **Placez-le dans votre dossier projet Bolt actuel** :
   ```
   C:\Users\micka\OneDrive\Bureau\NEW SITE\projet bolt\MAJ SITE 10_11_25\project\
   ```

3. **Exécutez en PowerShell** :
   ```powershell
   cd "C:\Users\micka\OneDrive\Bureau\NEW SITE\projet bolt\MAJ SITE 10_11_25\project"

   # Autoriser l'exécution de scripts (une seule fois)
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

   # Lancer la synchronisation
   .\SYNC-TO-LOCAL.ps1
   ```

4. **Le script va copier automatiquement** :
   - ✅ Tous les composants (Header, Footer, Home, Admin, etc.)
   - ✅ Toutes les pages
   - ✅ Toutes les bibliothèques
   - ✅ Les fichiers de configuration
   - ✅ **Version v705 dans le Footer**

---

### **MÉTHODE 2 : Archive ZIP Complète**

1. **Téléchargez** `BOLT-V705-SOURCE.tar.gz` depuis Bolt

2. **Extrayez l'archive** dans un dossier temporaire

3. **Copiez manuellement les dossiers** vers votre projet local :
   ```
   src/components/    → Remplacer
   src/pages/         → Remplacer
   src/lib/           → Remplacer
   src/contexts/      → Remplacer
   src/App.tsx        → Remplacer
   src/main.tsx       → Remplacer
   package.json       → Remplacer
   vite.config.ts     → Remplacer
   vercel.json        → Remplacer
   ```

---

### **MÉTHODE 3 : Copie Manuelle des Fichiers Critiques**

Si vous voulez minimiser les changements, copiez **uniquement** :

#### **1. Footer.tsx (avec v705)**
Chemin : `src/components/Layout/Footer.tsx`

Cherchez la ligne 183-185 et vérifiez qu'elle contient :
```tsx
<p className="text-gray-600 text-xs font-light">
  v705
</p>
```

#### **2. Header.tsx**
Chemin : `src/components/Layout/Header.tsx`

Vérifiez que le menu contient :
- Vidéos
- Résultats
- Connexion (dropdown avec : Espace Athlète, Admin Timepulse, Organisateur)

---

## ✅ APRÈS LA SYNCHRONISATION

Une fois les fichiers synchronisés, **rebuilder et déployer** :

```bash
# 1. Aller dans votre dossier local
cd "C:\Users\micka\OneDrive\Bureau\NEW SITE\projet bolt\MAJ SITE 10_11_25\project"

# 2. Nettoyer l'ancien build
rmdir /s /q dist
rmdir /s /q node_modules\.vite

# 3. Installer les dépendances (si nécessaire)
npm install

# 4. Build complet
npm run build

# 5. Vérifier la version dans le build
type dist\index.html | findstr "v705"

# 6. Déployer sur Vercel
npx vercel --prod
```

---

## 🔍 VÉRIFICATION

Une fois déployé :

1. ⏰ **Attendez 2-3 minutes** pour que Vercel propage les changements

2. 🌐 **Testez en navigation privée** : https://timepulsev2.com

3. 📍 **Vérifiez le footer** : vous devez voir **v705** en bas à droite (petit texte gris)

4. 🔄 **Si vous ne voyez pas v705** :
   - Videz le cache : CTRL + F5
   - Essayez en navigation privée
   - Vérifiez que Vercel a bien déployé : https://vercel.com/dashboard

---

## 🆘 SI ÇA NE FONCTIONNE TOUJOURS PAS

### **Vérification 1 : Le build contient-il v705 ?**

```bash
# Windows CMD
type dist\index.html | findstr "v705"

# PowerShell
Select-String -Path "dist\index.html" -Pattern "v705"
```

Si vous ne voyez PAS v705 dans le résultat → Le build est incorrect

### **Vérification 2 : Vercel a-t-il bien déployé ?**

1. Connectez-vous à https://vercel.com
2. Cliquez sur votre projet **timepulse-v2**
3. Regardez le dernier déploiement
4. Vérifiez la date/heure
5. Cliquez sur "Visit" pour tester

### **Vérification 3 : DNS pointe-t-il vers le bon projet ?**

```bash
nslookup timepulsev2.com
```

Doit pointer vers les serveurs Vercel (76.76.x.x)

---

## 📞 CONTACT

Si le problème persiste après ces 3 vérifications, dites-moi :

1. ✅ Quelle méthode avez-vous utilisée ?
2. ✅ Voyez-vous v705 dans `dist/index.html` localement ?
3. ✅ Quelle est la date/heure du dernier déploiement Vercel ?
4. ✅ Quelle version voyez-vous en ligne sur timepulsev2.com ?

---

**Version de ce guide :** 705
**Dernière mise à jour :** 12/11/2025 - 07:31 UTC
