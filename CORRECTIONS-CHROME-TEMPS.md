# Corrections à appliquer - Chrome + Temps moyen

## Problèmes résolus
1. ✅ Boutons invisibles dans Chrome (Vidéos, Résultats, Connexion)
2. ✅ Temps moyen à 00:00:00 sous les podiums

## Fichiers à copier depuis le serveur vers votre projet local

### 1. Header.tsx
**Fichier source :** `src/components/Layout/Header.tsx`
**À copier vers :** `C:\Users\micka\OneDrive\Bureau\NEW SITE\projet bolt\MAJ SITE 10_11_25\project\src\components\Layout\Header.tsx`

### 2. ExternalEventResults.tsx
**Fichier source :** `src/pages/ExternalEventResults.tsx`
**À copier vers :** `C:\Users\micka\OneDrive\Bureau\NEW SITE\projet bolt\MAJ SITE 10_11_25\project\src\pages\ExternalEventResults.tsx`

## Étapes pour déployer

1. **Copiez les 2 fichiers** ci-dessus vers votre projet local Windows

2. **Ouvrez un terminal** dans votre projet local :
   ```
   cd "C:\Users\micka\OneDrive\Bureau\NEW SITE\projet bolt\MAJ SITE 10_11_25\project"
   ```

3. **Buildez localement** pour vérifier :
   ```
   npm run build
   ```

4. **Déployez sur Vercel** :
   ```
   vercel --prod
   ```

   OU utilisez le script de déploiement automatique :
   ```
   .\deploy.bat
   ```

## Vérification après déploiement

1. Videz le cache de Chrome (Ctrl+Shift+Delete)
2. Rechargez la page avec Ctrl+F5
3. Vérifiez que les boutons apparaissent en haut à droite
4. Allez sur la page des 10 km de Saint-Baudelle
5. Vérifiez que le temps moyen s'affiche sous les podiums (devrait être environ 00:50:XX)

## Alternative : Déploiement direct

Si vous ne voulez pas copier les fichiers manuellement, vous pouvez :

1. Télécharger les fichiers directement depuis ce serveur
2. Les remplacer dans votre projet local
3. Faire un commit Git :
   ```
   git add .
   git commit -m "Fix: Chrome header buttons + average time calculation"
   git push
   ```
4. Vercel déploiera automatiquement si configuré avec Git

## Support

Si l'erreur 404 persiste après déploiement :
- Vérifiez les logs Vercel : https://vercel.com/dashboard
- Assurez-vous que le build réussit
- Vérifiez que le domaine pointe correctement vers le déploiement
