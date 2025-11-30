# Module Speaker - Spécifications Complètes

## 📋 Vue d'ensemble

Le **Module Speaker** est une fonctionnalité innovante de Timepulse permettant aux speakers/commentateurs d'événements sportifs d'accéder aux données des participants pour préparer leurs commentaires en direct.

---

## 🎯 Objectifs

1. **Faciliter le travail des speakers** en leur donnant accès aux informations essentielles
2. **Améliorer la qualité des commentaires** grâce à des données riches et personnalisables
3. **Optimiser la préparation** avec des listes personnalisées et des favoris
4. **Valoriser les sponsors** en intégrant leurs informations dans l'outil
5. **Offrir une flexibilité totale** à l'organisateur sur ce qui est partagé

---

## 👥 Cas d'usage

### Pour l'organisateur
- Active le module pour un événement spécifique
- Définit les dates d'accès (ouverture/fermeture)
- Choisit quelles données sont visibles (indices, temps, historique)
- Génère un code unique pour le speaker
- Ajoute les sponsors à mentionner
- Consulte l'activité du speaker (logs)

### Pour le speaker
- Se connecte avec un code simple (8 caractères)
- Consulte la liste des inscrits par course
- Filtre les participants (sexe, catégorie, club, nationalité, indices)
- Marque des favoris avec des notes personnelles
- Crée des listes personnalisées pour la course
- Voit les sponsors à mentionner avec leur fréquence
- Exporte ses listes en PDF ou les sauvegarde sur tablette
- Accède aux statistiques de l'événement

---

## 🗄️ Architecture de Base de Données

### Tables principales

#### 1. `speaker_access`
Configuration globale de l'accès speaker pour un événement.

**Champs clés :**
- `access_code` : Code unique de 8 caractères (ex: `K3M9P2R7`)
- `is_enabled` : Activation on/off
- `start_date` / `end_date` : Période d'accès
- `show_*` : Booléens pour contrôler l'affichage des données
- `speaker_name` : Nom du speaker
- `custom_notes` : Notes de l'organisateur pour le speaker

#### 2. `speaker_favorites`
Athlètes marqués en favoris par le speaker.

**Fonctionnalités :**
- Icône cœur pour marquer un favori
- Notes personnelles (champ libre)
- Priorité (Haute=1, Moyenne=2, Basse=3)
- Unique par speaker/athlète

#### 3. `speaker_lists`
Listes personnalisées créées par le speaker.

**Caractéristiques :**
- Nom et description
- Couleur d'identification (8 couleurs)
- Spécifique à une course ou multi-courses
- Ordre personnalisable

#### 4. `speaker_list_entries`
Contenu des listes (athlètes ajoutés).

**Structure :**
- Lien avec une liste
- Lien avec une inscription (entry)
- Ordre dans la liste

#### 5. `speaker_sponsors`
Sponsors de l'événement à mentionner.

**Données :**
- Nom, logo, catégorie
- Description/message à mentionner
- Fréquence de mention (Haute, Moyenne, Basse)
- Mots-clés pour rappel
- Site web

#### 6. `speaker_activity_log`
Journal d'activité pour traçabilité.

**Utilité :**
- Audit des actions du speaker
- Statistiques d'utilisation
- Détails en JSON

---

## 🎨 Interfaces Utilisateur

### 1. Interface Organisateur

#### A. Activation du Module
**Emplacement :** Onglet "Speaker" dans le détail d'un événement

**Éléments :**
- Toggle ON/OFF pour activer le module
- Champ "Nom du speaker"
- Champ "Email du speaker" (optionnel)
- Date picker pour "Date d'ouverture"
- Date picker pour "Date de fermeture"
- Zone de texte "Notes pour le speaker"

#### B. Configuration des Données Visibles
**Checkboxes :**
- ☑️ Afficher les temps de référence
- ☑️ Afficher l'indice Timepulse
- ☐ Afficher l'indice BetRAIL
- ☐ Afficher l'indice UTMB
- ☐ Afficher l'historique des classements
- ☑️ Afficher les statistiques

#### C. Génération du Code
- Bouton "Générer un code d'accès"
- Affichage du code en gros (ex: `K3M9P2R7`)
- Bouton copier dans le presse-papiers
- QR Code pour partage facile
- Lien de connexion directe

#### D. Gestion des Sponsors
**Tableau avec :**
- Nom du sponsor
- Catégorie (Titre, Or, Argent, Bronze, etc.)
- Logo
- Fréquence de mention
- Mots-clés
- Actions (Modifier, Supprimer)

**Formulaire d'ajout :**
- Nom
- Catégorie (dropdown)
- Logo (upload)
- Description/message
- Fréquence (dropdown)
- Mots-clés (tags input)
- Site web
- Ordre d'affichage

#### E. Journal d'Activité
**Vue chronologique :**
- Horodatage
- Action effectuée
- Détails

**Exemples d'actions :**
- "Connexion au module"
- "Favori ajouté : Jean Dupont (#142)"
- "Liste créée : Top départ 10km"
- "Export PDF : Liste favoris"

---

### 2. Interface Speaker

#### A. Page de Connexion
**Design simple et épuré :**
- Logo Timepulse
- Titre "Accès Speaker"
- Champ de saisie du code (8 caractères)
- Bouton "Se connecter"
- Message d'erreur si code invalide

#### B. Tableau de Bord
**Header :**
- Nom de l'événement
- Nom du speaker
- Bouton déconnexion

**Statistiques globales (cards) :**
- Total des inscrits
- Répartition hommes/femmes
- Nombre de courses
- Remplissage moyen

**Navigation par onglets :**
1. Participants
2. Mes Favoris
3. Mes Listes
4. Sponsors
5. Statistiques

#### C. Onglet "Participants"
**Filtres avancés :**
- Sélecteur de course (dropdown)
- Recherche par nom/prénom/dossard
- Sexe (H/F/Tous)
- Catégorie (dropdown multi-select)
- Club (autocomplete)
- Nationalité (dropdown)
- Indice Timepulse (min/max)
- Bouton "Réinitialiser les filtres"

**Tableau des participants :**
Colonnes :
- ❤️ Favori (cliquable)
- Dossard
- Nom Prénom
- Sexe
- Catégorie
- Club
- Nationalité
- Indice Timepulse (si activé)
- Indice BetRAIL (si activé)
- Indice UTMB (si activé)
- Temps de référence (si activé)
- Actions (Ajouter à une liste, Notes)

**Interactions :**
- Clic sur ❤️ : Ajoute/retire des favoris
- Clic sur nom : Ouvre fiche détaillée
- Clic sur "Notes" : Ouvre modal de notes
- Tri par colonne

#### D. Onglet "Mes Favoris"
**Organisation par priorité :**
- Section "Priorité Haute" (badge rouge)
- Section "Priorité Moyenne" (badge orange)
- Section "Priorité Basse" (badge jaune)

**Cards athlète :**
- Photo (si disponible)
- Nom Prénom
- Dossard
- Course
- Indice(s)
- Notes personnelles (éditable)
- Bouton "Retirer des favoris"
- Bouton "Ajouter à une liste"

**Actions globales :**
- Bouton "Exporter en PDF"
- Bouton "Créer une liste à partir des favoris"

#### E. Onglet "Mes Listes"
**Vue d'ensemble :**
- Cards des listes créées
- Nom de la liste
- Couleur
- Nombre d'athlètes
- Course(s) concernée(s)
- Actions (Modifier, Supprimer, Exporter)

**Bouton "Créer une nouvelle liste" :**
Ouvre un modal :
- Nom de la liste
- Description
- Couleur (8 choix)
- Course spécifique ou multi-courses

**Vue détaillée d'une liste :**
- Tableau des athlètes
- Réorganisation par drag & drop
- Retrait d'un athlète
- Ajout d'athlètes depuis la recherche
- Export PDF avec mise en page professionnelle

#### F. Onglet "Sponsors"
**Cards sponsors par catégorie :**
1. Sponsors Titre
2. Sponsors Or
3. Sponsors Argent
4. Sponsors Bronze
5. Partenaires

**Informations par sponsor :**
- Logo
- Nom
- Description/message à mentionner
- Fréquence de mention (badge)
- Mots-clés (tags)
- Site web (lien)

**Fonctionnalités :**
- Marquer comme "Mentionné" (coche verte)
- Compteur de mentions
- Notes personnelles

#### G. Onglet "Statistiques"
**Graphiques et données :**
- Répartition par catégorie d'âge (graphique en barres)
- Répartition par sexe (pie chart)
- Répartition par club (top 10)
- Répartition par nationalité (carte ou liste)
- Évolution des inscriptions dans le temps
- Taux de remplissage par course

**Données exportables :**
- Bouton "Exporter en PDF"
- Bouton "Partager les statistiques"

---

## 🔧 Fonctionnalités Techniques

### 1. Authentification
- Système sans compte utilisateur
- Code unique de 8 caractères alphanumériques
- Session stockée dans localStorage
- Expiration automatique à la date de fermeture
- Vérification côté serveur à chaque requête

### 2. Génération du Code
**Algorithme :**
```typescript
function generateAccessCode(): string {
  // 8 caractères aléatoires (A-Z, 0-9)
  // Vérification d'unicité en BDD
  // Format : K3M9P2R7
}
```

### 3. Filtres et Recherche
- Filtrage côté client pour réactivité
- Recherche fuzzy sur nom/prénom
- Combinaison de plusieurs filtres
- Sauvegarde des filtres actifs
- Reset rapide

### 4. Export PDF
**Bibliothèque :** jsPDF ou pdfmake

**Contenu du PDF :**
- En-tête avec logo Timepulse et nom événement
- Date et heure de génération
- Nom de la liste / type d'export
- Tableau des athlètes avec données sélectionnées
- Footer avec nom du speaker

**Mises en page :**
- Format A4 portrait
- Tableau responsive
- Numérotation des pages
- Section sponsors en fin de document

### 5. Gestion des Favoris
**Interactions :**
- Clic sur cœur : Toggle favori
- Animation de l'icône
- Confirmation visuelle (toast)
- Compteur en temps réel
- Synchronisation immédiate

### 6. Création de Listes
**Workflow :**
1. Clic sur "Créer une liste"
2. Modal avec formulaire
3. Validation et création
4. Redirection vers la liste vide
5. Ajout d'athlètes depuis recherche ou favoris

**Drag & Drop :**
- Réorganisation de l'ordre
- Sauvegarde automatique
- Indicateur visuel pendant le drag

### 7. Logs d'Activité
**Actions loggées :**
- Connexion/Déconnexion
- Ajout/retrait de favori
- Création/modification/suppression de liste
- Export PDF
- Consultation de fiche athlète
- Mention d'un sponsor

**Format JSON :**
```json
{
  "athlete_id": "uuid",
  "athlete_name": "Jean Dupont",
  "bib_number": 142,
  "action_type": "favorite_added"
}
```

---

## 📱 Responsive Design

### Desktop (> 1024px)
- Tableau pleine largeur
- Sidebar pour filtres
- 3 colonnes pour les cards

### Tablet (768px - 1024px)
- Tableau scrollable horizontal
- Filtres repliables
- 2 colonnes pour les cards

### Mobile (< 768px)
- Vue liste (pas de tableau)
- Filtres en modal
- 1 colonne pour les cards
- Navigation bottom bar

---

## 🎨 Design System

### Couleurs
- **Primaire :** Bleu Timepulse `#0066CC`
- **Secondaire :** Orange `#FF6B35`
- **Favoris :** Rouge `#E63946`
- **Succès :** Vert `#06D6A0`
- **Alerte :** Orange `#FFB703`

### Typographie
- **Titres :** Inter Bold
- **Corps :** Inter Regular
- **Dossards :** Monospace

### Icônes
- Lucide React
- Taille standard : 20px
- Taille grande (actions) : 24px

---

## 🔒 Sécurité

### Contrôles d'Accès
- Vérification du code à chaque requête
- Expiration automatique après date de fermeture
- Rate limiting sur l'authentification
- Logs de toutes les tentatives de connexion

### Données Visibles
- Uniquement ce que l'organisateur a autorisé
- Pas d'accès aux données de paiement
- Pas d'accès aux emails/téléphones
- Pas de modification des inscriptions

### Audit
- Log de toutes les actions
- Consultation par l'organisateur
- Durée de rétention : 1 an
- Export des logs possible

---

## 🚀 Évolutions Futures

### Phase 2
- Notifications push pour les speakers
- Chat intégré organisateur ↔️ speaker
- Import de données externes (ex: résultats antérieurs)
- Prédictions de temps basées sur l'IA

### Phase 3
- Mode multi-speakers (plusieurs speakers par événement)
- Synchronisation en temps réel pendant la course
- Intégration avec les résultats live
- Statistiques avancées avec ML

### Phase 4
- Application mobile native
- Mode hors-ligne avec sync
- Reconnaissance vocale pour notes
- Intégration caméras/drones

---

## 📊 Métriques de Succès

### KPIs à suivre
- Nombre d'organisateurs activant le module
- Nombre de connexions speaker
- Nombre de favoris créés
- Nombre de listes créées
- Nombre d'exports PDF
- Temps moyen passé dans le module
- Taux de satisfaction (feedback)

---

## 🎓 Formation et Documentation

### Pour les Organisateurs
- Vidéo tutoriel (5 min)
- Guide PDF avec captures d'écran
- FAQ dédiée
- Support par email/chat

### Pour les Speakers
- Guide de démarrage rapide (1 page)
- Vidéo démo (3 min)
- Tutoriel interactif au premier usage
- Tooltip contextuel dans l'interface

---

## 💡 Différenciation Concurrentielle

### Points Uniques
1. **Simplicité d'accès** : Juste un code, pas de compte
2. **Personnalisation totale** : Listes, favoris, notes
3. **Intégration sponsors** : Valorisation des partenaires
4. **Export professionnel** : PDF prêt à imprimer
5. **Contrôle organisateur** : Données partagées au choix
6. **Indices multiples** : Timepulse, BetRAIL, UTMB
7. **Historique** : Résultats passés des athlètes (future)

### Avantage Timepulse
- Écosystème complet (inscription + chrono + speaker)
- Données riches et fiables (FFA, FFTri)
- Expertise du terrain depuis 2009
- Innovation continue

---

## 📅 Roadmap de Développement

### Sprint 1 (Semaine 1-2)
- ✅ Migration BDD
- ⏳ Interface organisateur (activation + config)
- ⏳ Interface speaker (connexion + dashboard)

### Sprint 2 (Semaine 3-4)
- ⏳ Onglet Participants avec filtres
- ⏳ Gestion des favoris
- ⏳ Création de listes

### Sprint 3 (Semaine 5-6)
- ⏳ Export PDF
- ⏳ Gestion sponsors
- ⏳ Statistiques

### Sprint 4 (Semaine 7-8)
- ⏳ Tests et optimisations
- ⏳ Documentation
- ⏳ Déploiement en production

---

## ✅ Checklist de Lancement

### Technique
- [ ] Migration BDD appliquée
- [ ] Tests unitaires écrits
- [ ] Tests d'intégration validés
- [ ] Performance optimisée
- [ ] Sécurité auditée
- [ ] Responsive vérifié
- [ ] Export PDF testé

### Contenu
- [ ] Vidéos tutorielles produites
- [ ] Documentation rédigée
- [ ] FAQ complétée
- [ ] Emails de lancement préparés

### Marketing
- [ ] Page dédiée sur le site
- [ ] Articles de blog
- [ ] Posts réseaux sociaux
- [ ] Newsletter aux organisateurs
- [ ] Webinar de présentation

---

**Document créé le :** 18 novembre 2025
**Version :** 1.0
**Auteur :** Timepulse Development Team
