# 📧 Guide des Variables d'Emails - Timepulse

## 🎯 Vue d'ensemble

Le système de variables dynamiques permet de personnaliser automatiquement les emails envoyés aux athlètes en fonction de leurs données d'inscription et des options qu'ils ont sélectionnées.

## 📋 Variables Standards Disponibles

### 👤 Variables Athlète

| Variable | Description | Exemple |
|----------|-------------|---------|
| `{{athlete_name}}` | Nom complet (Prénom + Nom) | Jean Dupont |
| `{{athlete_first_name}}` | Prénom uniquement | Jean |
| `{{athlete_last_name}}` | Nom de famille | Dupont |
| `{{athlete_email}}` | Adresse email | jean.dupont@email.com |
| `{{athlete_phone}}` | Téléphone | +33 6 12 34 56 78 |
| `{{athlete_gender}}` | Genre | M / F |
| `{{athlete_birthdate}}` | Date de naissance | 15/03/1990 |
| `{{athlete_nationality}}` | Nationalité (code pays) | FRA |
| `{{athlete_club}}` | Nom du club | AC Paris |
| `{{athlete_license}}` | Numéro de licence FFA/FFTri | 929636 |

### 🎪 Variables Événement

| Variable | Description | Exemple |
|----------|-------------|---------|
| `{{event_name}}` | Nom de l'événement | Marathon de Paris 2025 |
| `{{event_date}}` | Date de l'événement | 06/04/2025 |
| `{{event_location}}` | Lieu de l'événement | Paris |
| `{{event_description}}` | Description de l'événement | Le plus grand marathon... |

### 🏃 Variables Course

| Variable | Description | Exemple |
|----------|-------------|---------|
| `{{race_name}}` | Nom de la course | Marathon 42km |
| `{{race_distance}}` | Distance | 42.195 km |

### 📝 Variables Inscription

| Variable | Description | Exemple |
|----------|-------------|---------|
| `{{bib_number}}` | Numéro de dossard | 12345 |
| `{{registration_date}}` | Date d'inscription | 15/11/2025 |
| `{{registration_time}}` | Heure d'inscription | 14:30 |
| `{{management_code}}` | Code de gestion unique | ABC123XYZ |
| `{{amount}}` | Montant total payé | 45,00 € |
| `{{payment_status}}` | Statut du paiement | paid / pending / failed |
| `{{entry_status}}` | Statut de l'inscription | confirmed / pending / cancelled |

## 🎨 Variables Dynamiques d'Options

### Fonctionnement

Les variables d'options sont **générées automatiquement** selon les options que vous configurez pour chaque course.

### Format

```
{{option_[nom_option]}}
{{option_[nom_option]_quantity}}
{{option_[nom_option]_price}}
```

Le nom de l'option est normalisé : espaces et caractères spéciaux sont remplacés par des underscores `_`.

### Exemples

#### Option "T-shirt"
Configuration dans l'admin :
- Nom : "T-shirt"
- Choix : XS, S, M, L, XL, XXL

Variables générées :
```
{{option_t_shirt}}         → Taille sélectionnée (ex: "L")
{{option_t_shirt_quantity}} → Quantité (ex: "1")
{{option_t_shirt_price}}    → Prix (ex: "15,00 €")
```

#### Option "Repas d'après course"
Configuration :
- Nom : "Repas d'après course"
- Choix : Végétarien, Classique, Sans gluten

Variables générées :
```
{{option_repas_d_apres_course}}         → "Végétarien"
{{option_repas_d_apres_course_quantity}} → "1"
{{option_repas_d_apres_course_price}}    → "12,00 €"
```

#### Option "Parking"
Configuration :
- Nom : "Parking"
- Type : Case à cocher

Variables générées :
```
{{option_parking}}         → "Oui" ou vide si non sélectionné
{{option_parking_quantity}} → "1" ou "0"
{{option_parking_price}}    → "5,00 €" ou "0 €"
```

## 💡 Exemples d'Utilisation

### Template d'Email de Confirmation

```html
<!DOCTYPE html>
<html>
<body>
  <h1>Confirmation d'inscription</h1>

  <p>Bonjour {{athlete_first_name}},</p>

  <p>Votre inscription pour <strong>{{event_name}}</strong> est confirmée !</p>

  <h2>Détails de votre inscription</h2>
  <ul>
    <li>Course : {{race_name}}</li>
    <li>Date : {{event_date}}</li>
    <li>Dossard : {{bib_number}}</li>
    <li>Code de gestion : {{management_code}}</li>
  </ul>

  <h2>Options sélectionnées</h2>
  <ul>
    <li>T-shirt : Taille {{option_t_shirt}}</li>
    <li>Repas : {{option_repas}}</li>
  </ul>

  <p>Montant payé : {{amount}}</p>

  <p>À très bientôt !</p>
</body>
</html>
```

### Résultat pour un athlète

```html
<!DOCTYPE html>
<html>
<body>
  <h1>Confirmation d'inscription</h1>

  <p>Bonjour Jean,</p>

  <p>Votre inscription pour <strong>Marathon de Paris 2025</strong> est confirmée !</p>

  <h2>Détails de votre inscription</h2>
  <ul>
    <li>Course : Marathon 42km</li>
    <li>Date : 06/04/2025</li>
    <li>Dossard : 12345</li>
    <li>Code de gestion : ABC123XYZ</li>
  </ul>

  <h2>Options sélectionnées</h2>
  <ul>
    <li>T-shirt : Taille L</li>
    <li>Repas : Végétarien</li>
  </ul>

  <p>Montant payé : 57,00 €</p>

  <p>À très bientôt !</p>
</body>
</html>
```

## 🔧 Fonctions Backend Disponibles

### `get_registration_email_variables(entry_id)`

Récupère toutes les variables pour une inscription donnée.

```sql
SELECT * FROM get_registration_email_variables('uuid-de-l-inscription');
```

Retourne un objet JSON avec toutes les variables :
```json
{
  "athlete_name": "Jean Dupont",
  "athlete_email": "jean@email.com",
  "event_name": "Marathon de Paris",
  "bib_number": "12345",
  "option_t_shirt": "L",
  "option_repas": "Végétarien",
  ...
}
```

### `replace_email_variables(template_html, variables)`

Remplace les variables dans un template HTML.

```sql
SELECT replace_email_variables(
  '<p>Bonjour {{athlete_first_name}}</p>',
  '{"athlete_first_name": "Jean"}'::jsonb
);
-- Résultat : '<p>Bonjour Jean</p>'
```

### `prepare_registration_email(entry_id, template_key)`

Prépare un email complet prêt à envoyer.

```sql
SELECT * FROM prepare_registration_email(
  'uuid-de-l-inscription',
  'registration_confirmation'
);
```

Retourne :
- `subject` : Sujet avec variables remplacées
- `html_body` : HTML avec variables remplacées
- `to_email` : Email du destinataire
- `variables` : Objet JSON avec toutes les variables utilisées

## 📖 Accès depuis l'Interface Admin

### 1. Gestionnaire d'Emails
`/admin/email-manager`

- Éditeur visuel complet
- Bouton "Guide des variables" en haut à droite
- Liste des variables disponibles dans chaque template

### 2. Variables d'Emails (Page dédiée)
`/admin/email-variables`

- Liste complète de toutes les variables
- Recherche de variables
- Catégories organisées
- Exemples d'utilisation
- Documentation sur les options dynamiques

### 3. Menu Admin

Dans le menu latéral :
- **📖 Variables d'Emails** - Documentation complète
- **🎨 Gestionnaire d'Emails** - Édition des templates
- **📬 Templates Emails** - Gestion simple
- **📊 Monitoring Emails** - Suivi des envois

## 🎯 Bonnes Pratiques

### ✅ À Faire

1. **Tester avec l'aperçu** : Utilisez toujours l'aperçu avant d'activer un template
2. **Variables explicites** : Utilisez des noms d'options clairs et compréhensibles
3. **Valeurs par défaut** : Prévoyez du contenu alternatif si une variable est vide
4. **Options conditionnelles** : Les variables d'options n'apparaissent que si l'athlète a choisi l'option

### ❌ À Éviter

1. Ne pas utiliser de variables inexistantes
2. Ne pas oublier les doubles accolades `{{ }}`
3. Ne pas utiliser d'espaces dans les noms de variables
4. Ne pas supposer qu'une option sera toujours sélectionnée

## 🔄 Workflow Complet

### Pour l'Organisateur

1. **Créer l'événement** avec ses courses
2. **Configurer les options** (T-shirt, Repas, Parking, etc.)
3. **Personnaliser les emails** dans le gestionnaire
4. **Utiliser les variables** standards + options dynamiques
5. **Tester avec l'aperçu**
6. **Activer les templates**

### Pour le Système

1. Athlète s'inscrit et sélectionne des options
2. Système génère automatiquement toutes les variables
3. Template d'email est récupéré
4. Variables sont remplacées par les vraies valeurs
5. Email personnalisé est envoyé
6. Toutes les options sélectionnées apparaissent dans l'email

## 🚀 Cas d'Usage Avancés

### Email avec Options Multiples

```html
<h2>Votre commande</h2>
<table>
  <tr>
    <td>Course {{race_name}}</td>
    <td>{{amount}}</td>
  </tr>
  <tr>
    <td>T-shirt {{option_t_shirt}}</td>
    <td>{{option_t_shirt_price}}</td>
  </tr>
  <tr>
    <td>Repas {{option_repas}}</td>
    <td>{{option_repas_price}}</td>
  </tr>
  <tr>
    <td>Parking</td>
    <td>{{option_parking_price}}</td>
  </tr>
</table>
```

### Personnalisation selon le Genre

Bien que les variables soient automatiques, vous pouvez adapter le ton :

```html
<p>
  Cher{{athlete_gender}}  <!-- Affiche "Cher" ou "Chère" -->
  {{athlete_first_name}},
</p>
```

### Rappels Personnalisés

```html
<p>Bonjour {{athlete_first_name}},</p>

<p>Plus que 7 jours avant {{event_name}} !</p>

<p>Pensez à récupérer votre dossard n°{{bib_number}} et votre t-shirt {{option_t_shirt}}.</p>

<p>Rendez-vous à {{event_location}} le {{event_date}} !</p>
```

## 📚 Ressources

- Interface de gestion : `/admin/email-variables`
- Gestionnaire d'emails : `/admin/email-manager`
- Support technique : admintimepulse@timepulse.fr

---

**Dernière mise à jour** : 07/11/2025
**Version** : 2.0
