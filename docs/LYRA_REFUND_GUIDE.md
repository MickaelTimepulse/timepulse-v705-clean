# Guide des Remboursements Lyra Collect

## Vue d'ensemble

Le système de remboursement Timepulse est entièrement automatisé et fonctionne avec **tous les moyens de paiement** acceptés par Lyra Collect :
- 💳 **Cartes bancaires** (CB, Visa, Mastercard)
- 📱 **Apple Pay**
- 👛 **Google Pay**

Les remboursements sont traités directement via l'API Lyra et crédités sur le compte bancaire du participant sous **3 à 5 jours ouvrés**.

---

## Comment effectuer un remboursement

### Depuis l'interface Admin

1. **Accéder à la page "Inscriptions"**
   - Menu Admin → Inscriptions
   - Liste complète de toutes les inscriptions de la plateforme

2. **Rechercher l'inscription**
   - Utilisez la barre de recherche (nom, email, dossard)
   - Filtrez par événement, statut, etc.

3. **Ouvrir le détail de l'inscription**
   - Cliquez sur l'icône "œil" 👁️ de l'inscription concernée

4. **Lancer le remboursement**
   - Cliquez sur le bouton "Rembourser"
   - Choisissez le type de remboursement :
     - **Remboursement complet** : Montant total de l'inscription
     - **Remboursement partiel** : Saisissez un montant personnalisé

5. **Options avancées**
   - ✅ **Inclure les frais de transaction** : Rembourse également les frais bancaires (optionnel)
   - 📝 **Motif du remboursement** : Message interne (visible uniquement par l'admin)

6. **Confirmer le remboursement**
   - Vérifiez le montant
   - Cliquez sur "Confirmer le remboursement"

---

## Processus automatisé

Lorsque vous effectuez un remboursement, le système :

1. ✅ **Vérifie l'éligibilité** de l'inscription
   - Statut confirmé
   - Montant valide
   - Pas de remboursement déjà effectué

2. 🔍 **Recherche la transaction Lyra**
   - Identifie la transaction de paiement originale
   - Récupère l'UUID de la transaction

3. 💳 **Traite le remboursement via Lyra API**
   - Appel à l'API Lyra (`Transaction/CancelOrRefund`)
   - Remboursement sur la même carte/compte utilisé pour le paiement
   - Compatible avec CB, Apple Pay, Google Pay

4. 📧 **Envoie un email de confirmation**
   - Email automatique au participant
   - Récapitulatif du remboursement
   - Délai de réception (3-5 jours ouvrés)

5. 💾 **Met à jour la base de données**
   - Statut de l'inscription : `refunded`
   - Enregistrement du montant et de la date
   - Historique complet dans les logs

---

## États de remboursement

| Statut | Description |
|--------|-------------|
| `none` | Aucun remboursement demandé |
| `partial` | Remboursement partiel effectué |
| `full` | Remboursement complet effectué |

---

## Cas particuliers

### Transaction Lyra introuvable

Si aucune transaction Lyra n'est trouvée (inscription manuelle, paiement hors ligne, etc.) :
- ⚠️ Le système **enregistre le remboursement** dans la base
- ⚠️ Un message vous indique qu'un **traitement manuel** est nécessaire
- 👉 Vous devez traiter le remboursement dans le [back-office Lyra](https://secure.lyra.com/)

### Remboursement partiel

Utile pour :
- Annulation d'une option
- Modification de l'inscription
- Geste commercial

Le participant reçoit le montant partiel, l'inscription reste active.

### Remboursement avec frais de transaction

Option recommandée pour :
- Annulation pour cause de force majeure
- Erreur de l'organisateur
- Geste commercial

⚠️ **Attention** : Les frais de transaction sont à la charge de l'organisateur.

---

## Mode TEST vs PRODUCTION

### Mode TEST
- Les remboursements sont simulés
- Aucun argent réel n'est transféré
- Utilisez les [cartes de test Lyra](https://docs.lyra.com/fr/collect/testing.html)
- Permet de tester le processus complet

### Mode PRODUCTION
- Remboursements réels
- Argent crédité sur le compte du participant
- Délai : 3 à 5 jours ouvrés
- Notification par email au participant

---

## Vérification d'un remboursement

### Depuis Timepulse
1. Page Admin → Inscriptions
2. Recherchez l'inscription
3. Vérifiez le statut : `refunded` ou `partially refunded`
4. Consultez l'historique dans les détails

### Depuis Lyra Back-Office
1. Connectez-vous à [secure.lyra.com](https://secure.lyra.com/)
2. Menu → Transactions
3. Recherchez la transaction par montant, date ou email
4. Vérifiez le statut : `REFUNDED` ou `CANCELLED`

---

## Délais de remboursement

| Moyen de paiement | Délai moyen |
|-------------------|-------------|
| Carte bancaire CB | 3-5 jours ouvrés |
| Visa / Mastercard | 3-5 jours ouvrés |
| Apple Pay | 3-5 jours ouvrés |
| Google Pay | 3-5 jours ouvrés |

💡 **Note** : Le délai peut varier selon la banque du participant.

---

## Résolution des problèmes

### Erreur : "Transaction Lyra non trouvée"
**Cause** : Paiement hors ligne ou inscription manuelle

**Solution** :
1. Enregistrez le remboursement dans Timepulse (marqué comme `manual`)
2. Traitez le remboursement manuellement :
   - Via le back-office Lyra si paiement CB
   - Par virement bancaire si paiement espèces/chèque

### Erreur : "Inscription déjà remboursée"
**Cause** : Un remboursement a déjà été traité

**Solution** :
- Vérifiez l'historique dans l'inscription
- Consultez le back-office Lyra pour confirmation

### Erreur : "Montant supérieur au paiement"
**Cause** : Montant de remboursement invalide

**Solution** :
- Vérifiez le montant payé initialement
- Ajustez le montant du remboursement

---

## Support Lyra

En cas de problème technique avec l'API Lyra :

📧 **Support technique** : support@lyra.com
📞 **Téléphone** : +33 4 75 43 32 26
🌐 **Documentation** : [docs.lyra.com](https://docs.lyra.com/)
🔐 **Back-office** : [secure.lyra.com](https://secure.lyra.com/)

---

## Sécurité

✅ Toutes les opérations de remboursement sont :
- **Authentifiées** : Accès admin uniquement
- **Tracées** : Logs complets dans la base de données
- **Sécurisées** : Communication HTTPS avec Lyra
- **Auditées** : Historique complet des remboursements

---

## Checklist avant production

Avant de passer en mode PRODUCTION, vérifiez :

- [ ] Clés API Lyra PRODUCTION configurées
- [ ] Mode `LYRA_MODE=PRODUCTION` dans les variables d'environnement
- [ ] Tests de remboursement effectués en mode TEST
- [ ] Vérification des emails de confirmation
- [ ] Accès au back-office Lyra configuré
- [ ] Formation de l'équipe admin effectuée

---

## Tableau de bord des remboursements

Pour un suivi global des remboursements :

1. Admin → Finance (à venir)
2. Filtres disponibles :
   - Par période
   - Par événement
   - Par organisateur
   - Par statut

---

**Dernière mise à jour** : 21 novembre 2025
**Version** : 2.0
**Compatibilité** : Lyra Collect API V4
