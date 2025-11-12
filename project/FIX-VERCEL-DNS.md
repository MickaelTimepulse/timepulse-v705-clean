# 🔧 CORRECTION DNS VERCEL : timepulsev2.com

## ❌ PROBLÈME
Vercel affiche : `216.198.79.1` (mauvaise IP)
Devrait être : `76.76.21.21` (bonne IP Vercel)

## ✅ SOLUTION : Réinitialiser le domaine sur Vercel

### ÉTAPE 1 : Supprimer le domaine de Vercel

1. Allez sur : https://vercel.com
2. Sélectionnez votre projet
3. **Settings** → **Domains**
4. Trouvez `timepulsev2.com`
5. Cliquez sur les **3 points `...`** à droite
6. Cliquez sur **Remove**
7. Confirmez la suppression

⚠️ Pas de panique ! Vous ne perdez pas le domaine, vous le déconnectez juste temporairement.

---

### ÉTAPE 2 : Ré-ajouter le domaine

1. Toujours dans **Settings** → **Domains**
2. En haut, il y a un champ "Add Domain"
3. Tapez : `timepulsev2.com`
4. Cliquez sur **Add**
5. Vercel va automatiquement :
   - Le détecter comme votre domaine
   - Configurer les bons DNS
   - Générer un certificat SSL

---

### ÉTAPE 3 : Vérifier la nouvelle configuration

Après quelques secondes, vous devriez voir :

```
timepulsev2.com
Status: Valid ✓
```

Si Vercel affiche encore des instructions DNS :
- **Ignorez-les** si vous avez acheté le domaine via Vercel
- Vercel gère tout automatiquement en arrière-plan

---

### ÉTAPE 4 : Attendre la propagation

- Temps d'attente : **5 à 30 minutes**
- Testez en navigation privée : https://timepulsev2.com

---

## 🎯 SI ÇA NE MARCHE PAS

### Option A : Le domaine n'a pas été acheté via Vercel

Si vous avez acheté `timepulsev2.com` ailleurs (OVH, Gandi, etc.) :

1. Sur Vercel, quand vous ajoutez le domaine, il affichera les DNS à configurer
2. Copiez ces DNS
3. Allez sur le site où vous avez acheté le domaine
4. Configurez les DNS manuellement

### Option B : Contacter le support Vercel

Si vraiment rien ne fonctionne :

1. Allez sur https://vercel.com/help
2. Cliquez sur "Contact Support"
3. Expliquez : "My domain timepulsev2.com shows wrong DNS 216.198.79.1 instead of 76.76.21.21"

---

## 📞 QUESTION IMPORTANTE

**Où avez-vous acheté timepulsev2.com ?**

- ✅ Via Vercel/Bolt → Suivez les étapes ci-dessus
- ❌ Via un autre site (OVH, Gandi, etc.) → Il faut configurer manuellement

