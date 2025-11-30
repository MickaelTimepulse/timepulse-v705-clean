# 📧 Guide de Gestion des Emails - Timepulse

## Vue d'ensemble

L'interface de gestion des emails Timepulse vous permet de personnaliser tous les emails envoyés automatiquement aux athlètes et organisateurs lors du processus d'inscription et de gestion des événements.

**URL**: `/admin/email-manager`

---

## 🎨 Fonctionnalités Principales

### 1. **Éditeur Visuel Avancé**
- Toolbar avec formatage (gras, italique, alignement)
- Insertion de liens et images
- Blocs prêts à l'emploi (titres, paragraphes, boutons, notes)
- Mode code HTML pour les utilisateurs avancés
- Aperçu en temps réel avec données d'exemple

### 2. **Design Personnalisable**
- **Images de fond** : 6 images professionnelles préchargées
  - Coureur victoire
  - Tour Eiffel coureur
  - Triathlon
  - Open water
  - Eclipse
- **Couleur de fond** : Sélecteur de couleur avec code hexadécimal
- **Opacité** : Curseur de 0% (transparent) à 100% (opaque)

### 3. **Variables Dynamiques**
- Insertion automatique de données personnalisées
- Variables disponibles selon le type d'email
- Copie en un clic dans le presse-papier

### 4. **Catégorisation des Emails**
- **Inscription** : Confirmations d'inscription
- **Paiement** : Confirmations et rappels de paiement
- **Rappels** : J-7, J-1, documents manquants
- **Confirmations** : Dossards, résultats, bénévolat
- **Modifications** : Changements, annulations, échanges

---

## 📋 Types d'Emails Disponibles

### Inscription (5 emails)
1. **Confirmation d'inscription**
   - Variables : `athlete_name`, `event_name`, `race_name`, `bib_number`, `registration_date`, `management_code`
   - Envoyé : Immédiatement après inscription

2. **Attribution du dossard**
   - Variables : `athlete_name`, `event_name`, `bib_number`, `race_name`
   - Envoyé : Quand le dossard est attribué

3. **Documents requis**
   - Variables : `athlete_name`, `event_name`, `missing_documents`, `deadline`, `upload_link`
   - Envoyé : Si documents manquants

4. **Certificat médical expiré**
   - Variables : `athlete_name`, `event_name`, `expiry_date`, `upload_link`
   - Envoyé : Rappel d'expiration

5. **Licence FFA vérifiée/non valide**
   - Variables : `athlete_name`, `event_name`, `license_number`, `license_type`, `error_message`
   - Envoyé : Après vérification FFA

### Paiement (2 emails)
1. **Confirmation de paiement**
   - Variables : `athlete_name`, `event_name`, `amount`, `payment_date`, `transaction_id`
   - Envoyé : Après paiement réussi

2. **Paiement en attente**
   - Variables : `athlete_name`, `event_name`, `amount`, `payment_link`
   - Envoyé : Paiement non finalisé

### Rappels (3 emails)
1. **Rappel J-7**
   - Variables : `athlete_name`, `event_name`, `event_date`, `race_name`, `bib_number`, `race_info`
   - Envoyé : 7 jours avant l'événement

2. **Rappel J-1**
   - Variables : `athlete_name`, `event_name`, `event_date`, `meeting_time`, `meeting_place`, `bib_number`
   - Envoyé : Veille de l'événement

3. **Résumé quotidien (organisateur)**
   - Variables : `organizer_name`, `event_name`, `new_registrations_count`, `total_registrations`, `revenue`
   - Envoyé : Quotidiennement

### Résultats (2 emails)
1. **Résultats disponibles**
   - Variables : `athlete_name`, `event_name`, `race_name`, `finish_time`, `rank`, `results_link`
   - Envoyé : Quand résultats publiés

2. **Attestation de participation**
   - Variables : `athlete_name`, `event_name`, `race_name`, `finish_time`, `certificate_link`
   - Envoyé : Avec l'attestation

### Modifications (5 emails)
1. **Modification d'inscription**
   - Variables : `athlete_name`, `event_name`, `modifications`, `management_code`
   - Envoyé : Après modification

2. **Annulation d'inscription**
   - Variables : `athlete_name`, `event_name`, `refund_amount`, `cancellation_date`
   - Envoyé : Lors d'annulation

3. **Demande d'échange de dossard**
   - Variables : `athlete_name`, `event_name`, `race_name`, `exchange_code`
   - Envoyé : Demande d'échange

4. **Échange de dossard accepté**
   - Variables : `buyer_name`, `seller_name`, `event_name`, `race_name`, `bib_number`
   - Envoyé : Échange confirmé

5. **Covoiturage - Correspondance**
   - Variables : `passenger_name`, `driver_name`, `event_name`, `departure_location`, `contact_info`
   - Envoyé : Match trouvé

### Bénévolat (2 emails)
1. **Confirmation bénévolat**
   - Variables : `volunteer_name`, `event_name`, `role`, `date`, `location`
   - Envoyé : Inscription bénévole

2. **Nouvelle inscription (organisateur)**
   - Variables : `organizer_name`, `athlete_name`, `event_name`, `race_name`, `registration_date`
   - Envoyé : Notification organisateur

---

## 🎯 Guide d'Utilisation

### Accéder à l'interface

1. Connectez-vous en tant qu'administrateur
2. Allez dans **Paramètres** > **Templates d'emails**
3. Cliquez sur "Gestionnaire d'emails" ou accédez directement à `/admin/email-manager`

### Éditer un template

#### Étape 1 : Sélectionner le template
1. Utilisez les filtres par catégorie en haut
2. Recherchez un template spécifique
3. Cliquez sur le template dans la liste de gauche

#### Étape 2 : Personnaliser le design
1. Cliquez sur l'icône **Settings** (⚙️) dans la toolbar
2. Choisissez une image de fond (optionnel)
3. Sélectionnez une couleur de fond
4. Ajustez l'opacité avec le curseur

#### Étape 3 : Modifier le contenu
1. **Sujet** : Modifiez le sujet de l'email
2. **Corps** : Utilisez l'éditeur pour le contenu
   - Utilisez les boutons de formatage
   - Insérez des variables en cliquant dessus
   - Ajoutez des blocs prêts à l'emploi

#### Étape 4 : Utiliser les variables
1. Les variables disponibles sont affichées en bleu
2. Cliquez sur une variable pour la copier
3. Collez-la dans votre texte au format `{{variable}}`

#### Étape 5 : Prévisualiser
1. Cliquez sur **Aperçu** 👁️
2. Visualisez l'email avec des données d'exemple
3. Vérifiez le rendu sur mobile et desktop

#### Étape 6 : Sauvegarder
1. Activez/désactivez le template avec le toggle
2. Cliquez sur **Sauvegarder** 💾
3. Confirmation affichée en vert

### Dupliquer un template

1. Sélectionnez le template à dupliquer
2. Cliquez sur **Dupliquer** 📋
3. Le nouveau template est créé en mode "Inactif"
4. Modifiez-le selon vos besoins

---

## 💡 Bonnes Pratiques

### Design
- **Hiérarchie visuelle** : Utilisez des titres, sous-titres et paragraphes
- **Espacement** : Aérez votre contenu avec des marges
- **Couleurs** : Restez cohérent avec la charte Timepulse
- **Images de fond** : Utilisez une opacité de 70-90% pour la lisibilité
- **Mobile-first** : Testez toujours sur mobile

### Contenu
- **Clarté** : Messages courts et précis
- **Action** : Un appel à l'action clair par email
- **Personnalisation** : Utilisez toutes les variables pertinentes
- **Ton** : Professionnel mais chaleureux
- **Erreurs** : Relisez avant de sauvegarder

### Techniques
- **Variables** : Ne modifiez JAMAIS le format `{{variable}}`
- **HTML** : Mode code pour utilisateurs avancés uniquement
- **Test** : Envoyez-vous un email de test
- **Backup** : Dupliquez avant modifications majeures

---

## 🔧 Blocs Prêts à l'Emploi

### Titre
```html
<h1 style="color: #1f2937; font-size: 24px; font-weight: bold; margin: 16px 0;">Votre Titre</h1>
```

### Paragraphe
```html
<p style="color: #4b5563; margin: 12px 0;">Votre paragraphe</p>
```

### Bouton
```html
<a href="URL" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 500;">
  Texte du bouton
</a>
```

### Note/Encadré
```html
<div style="background-color: #f3f4f6; border-left: 4px solid #2563eb; padding: 16px; margin: 16px 0;">
  Votre note importante
</div>
```

### Informations importantes
```html
<div style="background-color: #f3f4f6; border-left: 4px solid #2563eb; padding: 16px; margin: 16px 0;">
  <p style="margin: 4px 0;"><strong>Label :</strong> {{variable}}</p>
  <p style="margin: 4px 0;"><strong>Label :</strong> {{variable}}</p>
</div>
```

---

## ❓ FAQ

### Comment ajouter une nouvelle image de fond ?
1. Uploadez l'image dans `/public/`
2. Modifiez le fichier `EmailTemplateEditor.tsx`
3. Ajoutez l'option dans `backgroundImageOptions`

### Les variables ne fonctionnent pas
- Vérifiez le format : `{{variable}}` (accolades doubles)
- Pas d'espaces : `{{ variable }}` ❌ / `{{variable}}` ✅
- Variable exacte : Respectez les majuscules/minuscules

### Comment tester un email ?
1. Dupliquez le template
2. Désactivez l'original
3. Activez le duplicata
4. Faites une inscription test

### Puis-je utiliser du CSS ?
Oui ! Le HTML et CSS inline sont supportés. Préférez le CSS inline pour la compatibilité email.

### Comment restaurer un template ?
Les templates par défaut peuvent être réinsérés via la migration SQL `20251106230000_add_email_template_design_fields.sql`

---

## 🚀 Raccourcis Clavier

- **Ctrl/Cmd + S** : Sauvegarder (à venir)
- **Ctrl/Cmd + P** : Aperçu (à venir)
- **Ctrl/Cmd + D** : Dupliquer (à venir)

---

## 📞 Support

Pour toute question ou problème :
- 📧 Email : support@timepulse.fr
- 📱 Téléphone : +33 (0)1 XX XX XX XX
- 📖 Documentation complète : [docs.timepulse.fr](https://docs.timepulse.fr)

---

**Dernière mise à jour** : 6 novembre 2025
**Version** : 2.0
