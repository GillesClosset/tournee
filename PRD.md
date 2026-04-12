# PRD — Tournée Nath

## Application de Planification de Tournées d'Accompagnement

| Champ              | Valeur                        |
| ------------------ | ----------------------------- |
| **Version**        | 1.0 — Draft                   |
| **Date**           | 2026-04-11                    |
| **Business Owner** | Nath (Direction de l'Enfance) |
| **Statut**         | En validation                 |

---

## Table des matières

1. [Résumé Exécutif](#1-résumé-exécutif)
2. [Problème](#2-problème)
3. [Personas & Utilisateurs](#3-personas--utilisateurs)
4. [Objectifs & Métriques de Succès](#4-objectifs--métriques-de-succès)
5. [Périmètre Fonctionnel — MVP](#5-périmètre-fonctionnel--mvp)
6. [Epics & User Stories](#6-epics--user-stories)
7. [Exigences Fonctionnelles Détaillées](#7-exigences-fonctionnelles-détaillées)
8. [Modèle de Données (haut niveau)](#8-modèle-de-données-haut-niveau)
9. [Architecture Technique](#9-architecture-technique)
10. [Exigences Non-Fonctionnelles](#10-exigences-non-fonctionnelles)
11. [Contraintes & Hypothèses](#11-contraintes--hypothèses)
12. [Risques & Mitigations](#12-risques--mitigations)
13. [Hors Périmètre MVP](#13-hors-périmètre-mvp)
14. [Annexes](#14-annexes)

---

## 1. Résumé Exécutif

**Tournée Nath** est une application web destinée au foyer de l'enfance, permettant de planifier les tournées hebdomadaires de chauffeurs qui réalisent des accompagnements de mineurs (scolaires, médicaux, familiaux, loisirs) dans la région de Nice et ses environs principalement.

Aujourd'hui, cette planification est réalisée manuellement à partir d'un tableau Excel de demandes. L'application automatise la génération de tournées optimisées en tenant compte des contraintes métier (priorités, types d'accompagnement, disponibilités chauffeurs) et logistiques (temps de trajet, stationnement, nombre de véhicules), tout en conservant la possibilité pour l'utilisateur d'ajuster manuellement le résultat.

**Valeur clé** : transformer un processus manuel de plusieurs heures en une génération assistée en quelques minutes, avec un résultat plus fiable et optimisé.

---

## 2. Problème

### Situation actuelle

- La planification des tournées est **100% manuelle** : Nath reçoit un Excel de demandes et construit le planning chauffeur par chauffeur, jour par jour.
- L'optimisation des trajets (distances, temps) repose sur l'**expérience et l'intuition** de l'opératrice.
- Les modifications en cours de semaine (annulations, ajouts) nécessitent de **recalculer manuellement** les impacts.
- Le risque d'erreur est significatif : oubli de priorité, trajet sous-optimal, conflit d'horaires chauffeur.
- Le temps consacré à cette tâche empêche de se concentrer sur d'autres missions à valeur ajoutée.

### Douleurs principales

| Douleur                     | Impact                                                            |
| --------------------------- | ----------------------------------------------------------------- |
| Temps de planification      | Plusieurs heures par semaine                                      |
| Optimisation trajets        | Trajets potentiellement sous-optimaux, surcoût carburant          |
| Gestion des priorités       | Risque d'oublier une priorité critique (médical, manque effectif) |
| Modifications mid-week      | Recalcul manuel fastidieux                                        |
| Transmission aux chauffeurs | Format Excel spécifique à construire manuellement                 |

---

## 3. Personas & Utilisateurs

### Persona principale : Nath — Coordinatrice des tournées

| Attribut             | Description                                                       |
| -------------------- | ----------------------------------------------------------------- |
| **Rôle**             | Business owner, unique utilisatrice de l'application              |
| **Contexte**         | Foyer de l'enfance, gère les accompagnements de mineurs           |
| **Fréquence**        | Utilisation hebdomadaire (1x/semaine) + modifications ponctuelles |
| **Compétences tech** | Utilisatrice Excel avancée, à l'aise avec les outils web          |
| **Objectif**         | Gagner du temps sur la planification tout en gardant le contrôle  |
| **Frustration**      | Le processus manuel est chronophage et sujet aux erreurs          |

### Utilisateurs secondaires (indirects)

- **Les chauffeurs** (Yannick, Solange, Ali, Aymen) : reçoivent le planning Excel généré. Ils n'utilisent pas l'application directement.

---

## 4. Objectifs & Métriques de Succès

### Objectifs

| #   | Objectif                          | Mesure                                                             |
| --- | --------------------------------- | ------------------------------------------------------------------ |
| O1  | Réduire le temps de planification | De plusieurs heures à < 30 minutes par semaine                     |
| O2  | Optimiser les trajets             | Réduction mesurable du kilométrage total vs planification manuelle |
| O3  | Fiabiliser les priorités          | Aucune mission prioritaire oubliée dans la génération              |
| O4  | Faciliter les modifications       | Modification mid-week en < 5 minutes                               |
| O5  | Maintenir le format de sortie     | Excel généré identique au format actuel                            |

### Critères de succès MVP

- Nath peut importer un Excel de demandes et obtenir une proposition de tournées en < 2 minutes.
- Les tournées générées respectent toutes les contraintes métier documentées.
- Nath peut modifier manuellement chaque aspect de la tournée générée.
- L'export Excel est directement utilisable par les chauffeurs (format identique à l'existant).
- Les modifications mid-week (annulation, ajout) sont possibles sans recommencer de zéro.

---

## 5. Périmètre Fonctionnel — MVP

### Inclus dans le MVP

| Domaine                   | Fonctionnalités                                                                                                                           |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Référentiels**          | CRUD chauffeurs, véhicules, points de passage (villas/lieux)                                                                              |
| **Configuration semaine** | Saisie des horaires chauffeurs par semaine, attribution véhicules                                                                         |
| **Import**                | Import Excel des demandes hebdomadaires, validation, résolution des points de passage                                                     |
| **Génération**            | Algorithme d'optimisation des tournées avec contraintes métier et logistiques                                                             |
| **Édition**               | Visualisation, réordonnancement, modification horaires, annulation arrêts, ajout tâches manuelles                                         |
| **Re-génération**         | Re-calcul de tournée après modifications (annulations/ajouts) sans annuler les missions précédement validées et non annulées manuellement |
| **Export**                | Génération Excel au format attendu (multi-onglets, par chauffeur/demi-journée)                                                            |
| **Ré-import**             | Import d'un Excel de tournée existant pour modifications                                                                                  |
| **Auth**                  | Authentification sécurisée (single user)                                                                                                  |

### Hors MVP → voir [section 13](#13-hors-périmètre-mvp)

---

## 6. Epics & User Stories

### Epic 1 : Gestion des Référentiels

> _En tant que Nath, je veux gérer ma base de chauffeurs, véhicules et points de passage pour que l'application dispose des données nécessaires à la génération._

| ID    | User Story                                                                                                                                                                                 | Priorité | Points |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | ------ |
| US1.1 | En tant que Nath, je veux ajouter/modifier/désactiver des chauffeurs (nom, statut actif) pour refléter l'équipe actuelle.                                                                  | Must     | 3      |
| US1.2 | En tant que Nath, je veux ajouter/modifier/désactiver des véhicules (nom, immatriculation) pour refléter le parc disponible.                                                               | Must     | 2      |
| US1.3 | En tant que Nath, je veux ajouter/modifier/supprimer des points de passage avec leurs attributs (nom, adresse, difficulté stationnement, type villa/RDV) pour constituer ma base de lieux. | Must     | 5      |
| US1.4 | En tant que Nath, je veux que l'application géocode automatiquement les adresses des points de passage pour disposer des coordonnées GPS.                                                  | Must     | 3      |

**Critères d'acceptation clés :**

- Un point de passage a obligatoirement : nom, adresse, type (villa ou lieu de RDV), difficulté stationnement (oui/non).
- Le géocodage valide que l'adresse existe et affiche les coordonnées résolues.
- Les chauffeurs et véhicules peuvent être désactivés (soft delete) pour l'historique.

---

### Epic 2 : Configuration Hebdomadaire

> _En tant que Nath, je veux configurer les disponibilités des chauffeurs et l'attribution des véhicules pour chaque semaine._

| ID    | User Story                                                                                                                  | Priorité | Points |
| ----- | --------------------------------------------------------------------------------------------------------------------------- | -------- | ------ |
| US2.1 | En tant que Nath, je veux saisir les horaires de chaque chauffeur pour chaque jour de la semaine (plage horaire début-fin). | Must     | 5      |
| US2.2 | En tant que Nath, je veux attribuer un véhicule à chaque chauffeur actif pour chaque jour.                                  | Must     | 3      |
| US2.3 | En tant que Nath, je veux pouvoir dupliquer la configuration d'une semaine précédente comme base pour la semaine suivante.  | Should   | 3      |
| US2.4 | En tant que Nath, je veux marquer un chauffeur comme indisponible certains jours (congés, maladie).                         | Must     | 2      |

**Critères d'acceptation clés :**

- L'interface affiche une grille semaine (lundi → dimanche) avec les chauffeurs en ligne.
- Chaque cellule permet de saisir l'heure de début, l'heure de fin, et le véhicule attribué.
- Contrainte : un véhicule ne peut pas être attribué à deux chauffeurs au même moment.
- Les plages horaires supportent le chevauchement partiel (ex: chauffeur 1 finit à 14h, chauffeur 2 commence à 15h → même véhicule possible).

---

### Epic 3 : Import des Demandes

> _En tant que Nath, je veux importer le fichier Excel des demandes pour alimenter la planification de la semaine._

| ID    | User Story                                                                                                                                                                       | Priorité | Points |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------ |
| US3.1 | En tant que Nath, je veux importer un fichier Excel contenant les demandes d'accompagnement de la semaine.                                                                       | Must     | 5      |
| US3.2 | En tant que Nath, je veux que l'application parse et valide automatiquement les données (format heures, noms, missions).                                                         | Must     | 5      |
| US3.3 | En tant que Nath, je veux que l'application identifie automatiquement les points de passage connus dans la base et les associe aux demandes.                                     | Must     | 5      |
| US3.4 | En tant que Nath, je veux être alertée quand une adresse/villa du fichier n'est pas reconnue, et pouvoir créer un nouveau point de passage directement.                          | Must     | 3      |
| US3.5 | En tant que Nath, je veux que l'application détecte et classifie automatiquement le type de mission (accompagnement, récupération, ou les deux) à partir du texte de la mission. | Must     | 5      |
| US3.6 | En tant que Nath, je veux que l'application détecte et classifie le type d'accompagnement (scolaire, médical, loisir, famille) à partir du contexte de la mission.               | Should   | 3      |

**Critères d'acceptation clés :**

- Format d'entrée attendu : Excel avec colonnes Jour | Villa/Lieu | Heure | Nom mineur | Mission | Observations.
- Les jours sont séparés par des lignes vides.
- Les heures supportent les formats variés : "8h", "08h00", "8H30", "9h30", "15h-16h".
- Si une plage horaire est détectée (ex: "15h-16h"), elle est interprétée comme une mission avec durée.
- La détection de "accompagnement" / "récupération" / "raccompagnement" dans le texte de mission est insensible à la casse et tolérante aux fautes de frappe courantes.
- Le rapport de validation liste clairement : nombre de demandes importées, points de passage non reconnus, erreurs de format.

---

### Epic 4 : Génération Automatique des Tournées

> _En tant que Nath, je veux que l'application génère des tournées optimisées pour chaque chauffeur en respectant les contraintes métier et logistiques._

| ID    | User Story                                                                                                                                                            | Priorité | Points |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------ |
| US4.1 | En tant que Nath, je veux que l'application calcule les temps de trajet entre tous les points de passage impliqués dans la semaine.                                   | Must     | 8      |
| US4.2 | En tant que Nath, je veux que l'application génère une proposition de tournées optimisées en respectant les plages horaires des chauffeurs.                           | Must     | 13     |
| US4.3 | En tant que Nath, je veux que les priorités soient calculées automatiquement selon les critères métier (type accompagnement, distance, effectif site, demande villa). | Must     | 8      |
| US4.4 | En tant que Nath, je veux pouvoir forcer la priorité d'une mission manuellement (override).                                                                           | Must     | 3      |
| US4.5 | En tant que Nath, je veux que la tournée distingue une partie obligatoire et une partie facultative si le chauffeur accepte de dépasser sa plage.                     | Should   | 5      |
| US4.6 | En tant que Nath, je veux que le temps de stationnement (+20min) et le temps d'accompagnement (+10min) apparaissent séparément dans chaque segment.                   | Must     | 3      |

**Critères d'acceptation clés :**

Règles logistiques appliquées par l'algorithme :

- **Point de départ/retour** : 117 avenue Simone Veil, 06200 Nice (fixe pour tous les chauffeurs).
- **Temps de trajet** : calculé via API de routage.
- **Stationnement difficile** : +20 min si le lieu de destination a l'attribut "difficulté stationnement". Affiché séparément : "X min trajet + 20 min stationnement difficile".
- **Accompagnement depuis villa** : +10 min si la mission contient "accompagnement" ET le point de départ est une villa.
- **Sens de parcours** :
  - Mission "accompagnement" → chauffeur va à la Villa puis à la destination de mission.
  - Mission "récupération"/"raccompagnement" → chauffeur va à la destination de mission puis à la Villa.
  - Si les deux mots sont présents → les missions sont exécutées dans l'ordre d'apparition dans le texte.
- **Plage horaire** : si la mission a une plage (ex: "15h-16h") sans autre indication, c'est un aller-retour. Si une indication est présente, elle est suivie (pas nécessairement un A/R). Durant uen plage horaire, un chauffeur peut accomplir uen autre mission. Deux chaufeurs peuvent combler une plage horaire, l'un faisant l'aller et l'autre le retour.
- **Véhicules** : max 2 véhicules simultanés. Un véhicule peut être partagé entre chauffeurs si leurs plages ne se chevauchent pas.

Règles de priorité (auto-calculées) :

1. Type d'accompagnement : médical > scolaire > famille > loisir (loisir jamais prioritaire).
2. Distance : plus longue distance priorisée (pour éviter retards de trajet).
3. Manque d'effectif sur un site : signalé comme prioritaire.
4. Villa avec peu de demande : priorisée selon le type.
5. Marquage "Prioritaire" explicite dans l'Excel d'entrée : toujours respecté.
6. Override manuel de l'utilisateur : priorité maximale.

---

### Epic 5 : Édition Manuelle des Tournées

> _En tant que Nath, je veux pouvoir ajuster manuellement les tournées générées avant de les valider._

| ID    | User Story                                                                                                                                          | Priorité | Points |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------ |
| US5.1 | En tant que Nath, je veux visualiser les tournées générées par chauffeur et par jour avec les horaires, temps de trajet et détails de chaque arrêt. | Must     | 8      |
| US5.2 | En tant que Nath, je veux réordonner les arrêts d'une tournée par glisser-déposer et voir les horaires recalculés automatiquement.                  | Must     | 5      |
| US5.3 | En tant que Nath, je veux modifier manuellement l'heure d'un arrêt.                                                                                 | Must     | 3      |
| US5.4 | En tant que Nath, je veux annuler un arrêt et voir l'impact sur la tournée restante.                                                                | Must     | 3      |
| US5.5 | En tant que Nath, je veux déplacer un arrêt d'un chauffeur à un autre.                                                                              | Must     | 5      |
| US5.6 | En tant que Nath, je veux ajouter manuellement une tâche libre (texte) à la tournée d'un chauffeur (ex: "course métro", "récup médocs").            | Must     | 3      |
| US5.7 | En tant que Nath, je veux ajouter une nouvelle demande d'accompagnement en cours de semaine et demander une re-génération partielle.                | Must     | 5      |
| US5.8 | En tant que Nath, je veux pouvoir annuler toutes mes modifications et revenir à la dernière version générée ou confirmée.                           | Should   | 3      |

**Critères d'acceptation clés :**

- Toute modification d'ordre ou d'ajout/suppression recalcule automatiquement les horaires en aval.
- Le système alerte si une modification provoque un dépassement de plage horaire du chauffeur.
- Le système alerte si une mission prioritaire est déplacée trop tard dans la journée.

---

### Epic 6 : Export & Ré-import

> _En tant que Nath, je veux exporter les tournées en Excel et pouvoir ré-importer un planning existant._

| ID    | User Story                                                                                                                     | Priorité | Points |
| ----- | ------------------------------------------------------------------------------------------------------------------------------ | -------- | ------ |
| US6.1 | En tant que Nath, je veux exporter les tournées confirmées en fichier Excel au format exact attendu par les chauffeurs.        | Must     | 8      |
| US6.2 | En tant que Nath, je veux importer un fichier Excel de tournée (précédemment exporté) pour y apporter des modifications.       | Must     | 5      |
| US6.3 | En tant que Nath, je veux que l'export contienne toutes les métadonnées : "Foyer de l'enfance", véhicule, chauffeur, horaires. | Must     | 3      |

**Critères d'acceptation clés :**

Format de sortie Excel (conforme à l'existant) :

- Un onglet par créneau chauffeur par jour. Nommage : "{Jour} {plage}" (ex: "Lundi 7h00-14h00", "Lundi Matin", "Lundi Aprés midi").
- 3 onglets par jour en semaine (correspondant aux 3 chauffeurs actifs). 1 onglet le weekend.
- Ligne 1 : "Foyer de l'enfance" (A1) + info véhicule/chauffeur/horaires (D1).
- Ligne 2 : Date du jour (cellules A2:E2 fusionnées).
- Ligne 4 : En-têtes : Villa | heure | nom mineur | missions | observation.
- Lignes 5+ : Arrêts de la tournée dans l'ordre chronologique.
- Si un chauffeur n'est pas disponible : l'onglet existe avec "pas de chauffeur" dans D1.

---

### Epic 7 : Authentification

> _En tant que Nath, je veux que l'application soit sécurisée par un login._

| ID    | User Story                                                                                   | Priorité | Points |
| ----- | -------------------------------------------------------------------------------------------- | -------- | ------ |
| US7.1 | En tant que Nath, je veux me connecter avec email/mot de passe pour accéder à l'application. | Must     | 3      |
| US7.2 | En tant que Nath, je veux pouvoir réinitialiser mon mot de passe si je l'oublie.             | Should   | 2      |

---

## 7. Exigences Fonctionnelles Détaillées

### 7.1 Import Excel — Format d'entrée

Le fichier d'entrée est un Excel à feuille unique ("Feuil1") avec la structure suivante :

| Colonne | Contenu                             | Exemples                                               |
| ------- | ----------------------------------- | ------------------------------------------------------ |
| A       | Jour de la semaine + date           | "Lundi 16-Mars", "mercredi 18 mars"                    |
| B       | Nom de la villa / lieu de départ    | "Clair-Castel", "Béluga", "appart"                     |
| C       | Heure demandée                      | "8h", "08h30", "9H30", "15h-16h", "17h30-19h00"        |
| D       | Nom du mineur                       | "THABET AUZERY Ghofrane", "BILLELO Noemie"             |
| E       | Mission / Adresse de destination    | "accompagnement scolaire Collège Emile Roux"           |
| F       | Observations / priorité (optionnel) | "Prioritaire", "arrêt de bus la chaumière prioritaire" |

**Règles de parsing :**

- Les jours sont séparés par une ou plusieurs lignes vides.
- Le format de la colonne A est libre (l'app doit extraire le jour de la semaine).
- Les heures ont des formats variés à normaliser.
- La colonne B contient le nom d'un point de passage de la base → matching par nom (fuzzy).
- La colonne D peut être vide (tâche logistique sans mineur associé).
- La colonne E contient la mission texte libre. Les mots-clés "accompagnement", "récupération", "raccompagnement", "retour" sont détectés pour déterminer le sens de parcours.
- La colonne F est optionnelle et peut contenir le mot "Prioritaire" ou des instructions complémentaires.

### 7.2 Algorithme de génération — Logique métier

#### Étape 1 : Pré-traitement

1. Parser toutes les demandes importées.
2. Pour chaque demande, résoudre le point de passage (villa/lieu) et la destination de mission.
3. Calculer (ou récupérer du cache) la matrice des temps de trajet entre tous les points impliqués + le point de départ fixe (117 av. Simone Veil).
4. Calculer le score de priorité de chaque demande.

#### Étape 2 : Attribution aux chauffeurs

1. Regrouper les demandes par jour.
2. Pour chaque jour, identifier les chauffeurs disponibles et leurs plages horaires.
3. Attribuer les demandes aux chauffeurs en respectant :
   - Les plages horaires (une demande à 8h ne peut aller qu'à un chauffeur actif à 8h).
   - La capacité temporelle (somme des temps de trajet + temps d'arrêt ≤ plage horaire).
   - Les priorités (les missions prioritaires sont attribuées en premier).

#### Étape 3 : Optimisation de l'ordre

1. Pour chaque tournée (chauffeur × jour), optimiser l'ordre des arrêts pour minimiser le temps de trajet total.
2. Respecter les contraintes de temps fixes (heures imposées dans les demandes).
3. Appliquer les majorations : +20min stationnement, +10min accompagnement villa.
4. Identifier les arrêts qui dépassent la plage horaire → les marquer comme "facultatifs".

#### Étape 4 : Validation

1. Vérifier qu'aucune demande n'est orpheline (non attribuée).
2. Si des demandes ne peuvent pas être placées, les signaler à l'utilisateur avec la raison.
3. Générer un rapport de synthèse : nombre de demandes traitées, temps total de trajet par chauffeur, alertes.

### 7.3 Calcul des temps de trajet

#### Source de données

**API recommandée : OpenRouteService (ORS)**

- Gratuit : 2000 requêtes de direction/jour, 500 requêtes de matrice/jour.
- Basé sur OpenStreetMap, excellente couverture France/PACA.
- Endpoint matrice disponible (essentiel pour l'optimisation VRP).
- Alternative de repli : OSRM (Open Source Routing Machine) — auto-hébergeable.

#### Stratégie de cache

- **Cache agressif** : les distances entre points de passage connus sont calculées une fois et stockées en base (table `travel_time_cache`).
- **Durée de validité du cache** : 30 jours (les temps de trajet de base changent peu).
- **Invalidation** : quand un point de passage change d'adresse.
- **Impact** : après quelques semaines d'utilisation, la quasi-totalité des trajets seront servis depuis le cache. Les appels API ne seront nécessaires que pour les nouvelles adresses.

### 7.4 Système de priorités

Les priorités sont calculées comme un **score numérique** combinant plusieurs critères pondérés :

| Critère                        | Poids | Logique                                                     |
| ------------------------------ | ----- | ----------------------------------------------------------- |
| Type d'accompagnement          | 40%   | médical=100, scolaire=70, famille=50, loisir=0              |
| Marquage "prioritaire" (Excel) | 30%   | Oui=100, Non=0                                              |
| Distance depuis le dépôt       | 15%   | Normalisée : plus longue distance = score plus élevé        |
| Demande villa faible           | 10%   | Villa avec peu de demandes hebdomadaires = score plus élevé |
| Effectif site signalé          | 5%    | Si le site est en sous-effectif = +100                      |

L'override manuel par Nath **remplace** le score calculé et force l'arrêt au niveau de priorité maximum.

---

## 8. Modèle de Données (haut niveau)

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   drivers    │     │   vehicles   │     │    locations     │
│─────────────│     │──────────────│     │─────────────────│
│ id           │     │ id           │     │ id              │
│ name         │     │ name         │     │ name            │
│ is_active    │     │ license_plate│     │ address         │
│ created_at   │     │ is_active    │     │ latitude        │
│ updated_at   │     │ created_at   │     │ longitude       │
└──────┬───────┘     └──────┬───────┘     │ parking_diff    │
       │                    │             │ location_type   │
       │                    │             │ is_active       │
       │                    │             └────────┬────────┘
       │                    │                      │
       ▼                    ▼                      │
┌──────────────────────────────────┐               │
│      driver_availabilities       │               │
│──────────────────────────────────│               │
│ id                               │               │
│ schedule_id (FK)                 │               │
│ driver_id (FK)                   │               │
│ vehicle_id (FK)                  │               │
│ day_of_week                      │               │
│ start_time                       │               │
│ end_time                         │               │
└──────────────┬───────────────────┘               │
               │                                   │
               ▼                                   │
┌──────────────────────────┐                       │
│    weekly_schedules      │                       │
│──────────────────────────│                       │
│ id                       │                       │
│ week_start_date          │                       │
│ status (draft/confirmed) │                       │
│ created_at               │                       │
│ updated_at               │                       │
└──────────┬───────────────┘                       │
           │                                       │
           ▼                                       ▼
┌──────────────────────────────┐   ┌───────────────────────────────┐
│     mission_requests         │   │       tours                   │
│──────────────────────────────│   │───────────────────────────────│
│ id                           │   │ id                            │
│ schedule_id (FK)             │   │ schedule_id (FK)              │
│ day_of_week                  │   │ driver_availability_id (FK)   │
│ location_id (FK)             │   │ status (generated/modified/   │
│ requested_time               │   │         confirmed)            │
│ time_range_end (nullable)    │   │ generated_at                  │
│ minor_name                   │   │ confirmed_at                  │
│ mission_text                 │   └───────────────┬───────────────┘
│ mission_type (accomp/recup/  │                   │
│               both)          │                   ▼
│ accompaniment_type (scolaire/│   ┌───────────────────────────────┐
│   medical/loisir/famille)    │   │       tour_stops              │
│ priority_score               │   │───────────────────────────────│
│ priority_override (nullable) │   │ id                            │
│ is_priority_flagged          │   │ tour_id (FK)                  │
│ observations                 │   │ sequence_order                │
│ raw_row_data (JSON)          │   │ location_id (FK)              │
│ status (pending/assigned/    │   │ mission_request_id (FK, null) │
│         cancelled)           │   │ scheduled_time                │
└──────────────────────────────┘   │ travel_time_minutes           │
                                   │ parking_extra_minutes         │
┌──────────────────────────────┐   │ accompaniment_extra_minutes   │
│    travel_time_cache         │   │ is_optional                   │
│──────────────────────────────│   │ is_manual_task                │
│ id                           │   │ manual_task_text              │
│ origin_location_id (FK)      │   │ notes                         │
│ dest_location_id (FK)        │   └───────────────────────────────┘
│ duration_seconds             │
│ distance_meters              │
│ cached_at                    │
└──────────────────────────────┘
```

---

## 9. Architecture Technique

### Stack recommandée

| Couche               | Technologie                                   | Justification                                                                                |
| -------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **Frontend**         | Next.js (App Router, dernière version stable) | SSR, hosting Vercel natif, écosystème React mature                                           |
| **UI**               | Tailwind CSS + shadcn/ui                      | Composants accessibles, personnalisables, pas de dépendance lourde                           |
| **Base de données**  | Supabase (PostgreSQL)                         | Requis par le client, auth intégrée, API REST auto-générée                                   |
| **Auth**             | Supabase Auth                                 | Email/password, intégré, simple pour single user                                             |
| **Routage/Trajets**  | OpenRouteService API (gratuit)                | 2000 req/jour, matrice de distances, basé OSM                                                |
| **Routage backup**   | OSRM public ou auto-hébergé                   | Fallback si ORS indisponible                                                                 |
| **Excel I/O**        | ExcelJS                                       | Lecture/écriture Excel avec support des cellules fusionnées, styles                          |
| **Hosting**          | Vercel                                        | Requis par le client, CI/CD natif avec Next.js                                               |
| **Algorithme optim** | Custom TypeScript (côté serveur)              | Heuristique VRP avec fenêtres temporelles — suffisant pour 3-4 chauffeurs et ~20 arrêts/jour |

Important: Vérifier et s'assurer que chaque composant technique utilise la dernière version stable disponible.

### Architecture simplifiée

```
┌─────────────────────────────────────────────────────────────┐
│                        Vercel                                │
│                                                              │
│  ┌──────────────────────┐    ┌────────────────────────────┐ │
│  │   Next.js Frontend   │    │   Next.js API Routes       │ │
│  │   (App Router, RSC)  │───▶│   /api/import              │ │
│  │                      │    │   /api/generate             │ │
│  │   - Dashboard        │    │   /api/tours                │ │
│  │   - Import Excel     │    │   /api/export               │ │
│  │   - Tour Editor      │    │   /api/locations            │ │
│  │   - Config semaine   │    │   /api/drivers              │ │
│  │   - Référentiels     │    │                             │ │
│  └──────────────────────┘    └──────────┬─────────────────┘ │
│                                         │                    │
└─────────────────────────────────────────┼────────────────────┘
                                          │
                    ┌─────────────────────┼──────────────────┐
                    │                     ▼                   │
                    │  ┌──────────────────────────────────┐  │
                    │  │          Supabase                 │  │
                    │  │  - PostgreSQL (données)           │  │
                    │  │  - Auth (login)                   │  │
                    │  │  - Row Level Security             │  │
                    │  └──────────────────────────────────┘  │
                    └────────────────────────────────────────┘
                                          │
                    ┌─────────────────────┼──────────────────┐
                    │                     ▼                   │
                    │  ┌──────────────────────────────────┐  │
                    │  │    OpenRouteService API           │  │
                    │  │  - Directions                     │  │
                    │  │  - Distance Matrix                │  │
                    │  │  - Geocoding                      │  │
                    │  └──────────────────────────────────┘  │
                    └────────────────────────────────────────┘
```

### Algorithme d'optimisation — Approche technique

Étant donné l'échelle du problème (3-4 chauffeurs, ~15-20 arrêts/jour), un **algorithme heuristique en deux phases** est suffisant et exécutable côté serveur (API Route Next.js) :

**Phase 1 — Construction gloutonne (Greedy Construction)**

1. Trier les demandes par heure demandée.
2. Pour chaque demande (en ordre de priorité décroissante) :
   - Identifier les chauffeurs disponibles à cette heure.
   - Calculer le coût d'insertion pour chaque chauffeur (temps de trajet depuis son dernier arrêt).
   - Attribuer au chauffeur avec le coût le plus faible.

**Phase 2 — Amélioration locale (Local Search)**

1. Appliquer des opérateurs d'amélioration itérativement :
   - **Relocate** : déplacer un arrêt d'une tournée à une autre si ça réduit le temps total.
   - **2-opt intra-tournée** : inverser un segment de la tournée si ça réduit le trajet.
   - **Exchange** : échanger deux arrêts entre deux tournées si c'est bénéfique.
2. Arrêter quand aucune amélioration n'est trouvée (convergence locale).

Cette approche produit des résultats proches de l'optimal pour cette taille de problème, en quelques secondes.

---

## 10. Exigences Non-Fonctionnelles

| Catégorie          | Exigence                                    | Cible                                                             |
| ------------------ | ------------------------------------------- | ----------------------------------------------------------------- |
| **Performance**    | Génération de tournées complète (1 semaine) | < 30 secondes                                                     |
| **Performance**    | Chargement de page                          | < 2 secondes                                                      |
| **Performance**    | Import/parsing Excel                        | < 5 secondes                                                      |
| **Disponibilité**  | Uptime                                      | 99% (usage professionnel heures ouvrées)                          |
| **Sécurité**       | Authentification                            | Email/mot de passe, sessions sécurisées                           |
| **Sécurité**       | Données                                     | Chiffrement en transit (HTTPS), RLS Supabase                      |
| **Compatibilité**  | Navigateurs                                 | Chrome, Firefox, Edge (dernières versions)                        |
| **Compatibilité**  | Excel                                       | Format .xlsx en entrée et sortie                                  |
| **UX**             | Responsive                                  | Desktop-first (usage bureau), fonctionnel sur tablette            |
| **Maintenabilité** | Stack                                       | Dernières versions stables de toutes les dépendances              |
| **Données**        | RGPD                                        | Données mineurs sensibles — accès restreint, pas de partage tiers |

---

## 11. Contraintes & Hypothèses

### Contraintes

| #   | Contrainte                                                         | Source |
| --- | ------------------------------------------------------------------ | ------ |
| C1  | Hébergement sur Vercel                                             | Client |
| C2  | Base de données Supabase                                           | Client |
| C3  | Dernières versions stables de la stack                             | Client |
| C4  | Accès sécurisé avec identifiants                                   | Client |
| C5  | Format Excel de sortie identique à l'existant                      | Client |
| C6  | Pas de budget pour API de routage payante                          | Client |
| C7  | Point de départ/retour fixe : 117 av. Simone Veil, 06200 Nice      | Client |
| C8  | 2 véhicules, 4 chauffeurs (3 actifs/jour en semaine, 1 le weekend) | Client |

### Hypothèses

| #   | Hypothèse                                                                         | Risque si fausse                            |
| --- | --------------------------------------------------------------------------------- | ------------------------------------------- |
| H1  | Le format de l'Excel d'entrée est relativement stable d'une semaine à l'autre     | Parsing à adapter fréquemment               |
| H2  | OpenRouteService gratuit reste disponible et suffisant en volume                  | Besoin de migrer vers OSRM auto-hébergé     |
| H3  | L'utilisatrice (Nath) est l'unique utilisatrice pour le MVP                       | Architecture à revoir pour multi-users      |
| H4  | ~80-100 demandes par semaine, ~20 points de passage uniques                       | Algorithme à revoir si volume x10           |
| H5  | Les adresses des villas/lieux sont stables dans le temps                          | Géocodage à refaire rarement                |
| H6  | La classification auto des missions (type, sens) est fiable à 90%+                | Nath doit vérifier et corriger manuellement |
| H7  | Le format exact de l'Excel de sortie est bien représenté par les exemples fournis | Ajustements du template nécessaires         |

---

## 12. Risques & Mitigations

| #   | Risque                                                           | Probabilité | Impact | Mitigation                                                                                         |
| --- | ---------------------------------------------------------------- | ----------- | ------ | -------------------------------------------------------------------------------------------------- |
| R1  | Parsing Excel fragile (formats incohérents, fautes de frappe)    | Élevée      | Moyen  | Parsing tolérant + rapport de validation détaillé + possibilité de corriger avant génération       |
| R2  | API OpenRouteService indisponible ou rate-limited                | Moyenne     | Élevé  | Cache agressif + fallback OSRM + mode dégradé (distances à vol d'oiseau × facteur)                 |
| R3  | Classification automatique des missions insuffisante             | Moyenne     | Moyen  | Interface de revue post-import + dictionnaire de mots-clés enrichi progressivement                 |
| R4  | L'algorithme d'optimisation ne satisfait pas les attentes métier | Moyenne     | Élevé  | Approche itérative : commencer avec une heuristique simple, améliorer basé sur le feedback de Nath |
| R5  | Format Excel de sortie ne correspond pas exactement à l'attendu  | Faible      | Moyen  | Validation précoce du template avec Nath sur un cas réel                                           |
| R6  | Données sensibles (noms de mineurs, adresses)                    | Faible      | Élevé  | RLS Supabase, pas de partage tiers, HTTPS, auth obligatoire                                        |
| R7  | Dépendance à un seul utilisateur pour le feedback                | Élevée      | Moyen  | Sessions de validation fréquentes et courtes pendant le développement                              |

---

## 13. Hors Périmètre MVP

Les éléments suivants sont explicitement **hors du périmètre MVP** mais pourront être envisagés dans des versions ultérieures :

| Fonctionnalité                                         | Raison de l'exclusion                              | Version cible |
| ------------------------------------------------------ | -------------------------------------------------- | ------------- |
| Visualisation cartographique des tournées              | Nice-to-have, pas critique pour le workflow        | v2            |
| Application mobile pour les chauffeurs                 | Les chauffeurs reçoivent l'Excel, pas besoin d'app | v2+           |
| Historique et statistiques des tournées passées        | Pas prioritaire pour le premier usage              | v2            |
| Multi-utilisateurs et gestion des droits               | Un seul utilisateur pour le MVP                    | v2            |
| Notifications (email, SMS) aux chauffeurs              | Workflow actuel par Excel suffit                   | v3            |
| Intégration calendrier (Google Calendar, etc.)         | Pas demandé                                        | v3            |
| Templates de semaines récurrentes                      | Utile mais pas critique                            | v2            |
| Gestion des tâches annexes (courses, médocs) par l'app | Ajoutées manuellement pour le MVP                  | v2            |
| Prise en compte du trafic en temps réel                | Pas de budget API, temps de trajet moyen suffisant | v3            |
| Suivi GPS des chauffeurs en temps réel                 | Hors périmètre métier                              | Non planifié  |

---

## 14. Annexes

### A. Points de passage connus (à créer dans la base)

Liste extraite des exemples Excel (à compléter avec les adresses réelles par Nath) :

| Nom                    | Type     | Adresse       | Stationnement difficile |
| ---------------------- | -------- | ------------- | ----------------------- |
| Clair-Castel           | Villa    | _À compléter_ | _À compléter_           |
| Béluga                 | Villa    | _À compléter_ | _À compléter_           |
| Alta Riba              | Villa    | _À compléter_ | _À compléter_           |
| Poulido                | Villa    | _À compléter_ | _À compléter_           |
| La Palombière          | Villa    | _À compléter_ | _À compléter_           |
| Corallines             | Villa    | _À compléter_ | _À compléter_           |
| B.AYRES (Buenos Aires) | Villa    | _À compléter_ | _À compléter_           |
| Couronne d'Or          | Villa    | _À compléter_ | _À compléter_           |
| Appart                 | Lieu RDV | _À compléter_ | _À compléter_           |
| La Plaine              | Lieu RDV | _À compléter_ | _À compléter_           |

### B. Chauffeurs actuels

| Nom     | Plage horaire habituelle  | Notes                     |
| ------- | ------------------------- | ------------------------- |
| Yannick | 7h-15h (parfois 7h-17h30) | Semaine                   |
| Solange | 7h-14h (parfois 6h30-14h) | Semaine                   |
| Ali     | 15h-23h                   | Semaine (après-midi/soir) |
| Aymen   | Variable                  | Weekend + remplacements   |

### C. Véhicules actuels

| Nom     | Immatriculation |
| ------- | --------------- |
| Dacia 1 | HE-271-AT       |
| Dacia 2 | HH-147-GZ       |

### D. Destinations fréquentes (extraites des exemples)

| Destination                     | Adresse                              | Type d'accompagnement |
| ------------------------------- | ------------------------------------ | --------------------- |
| Collège Emile Roux              | _À géocoder_                         | Scolaire              |
| Collège Jules Verne             | Cagnes-sur-Mer                       | Scolaire              |
| École Macé                      | 5 rue Macé, Cannes                   | Scolaire              |
| Apprentis d'Auteuil             | Grasse                               | Scolaire              |
| Collège La Fontonne             | Antibes                              | Scolaire              |
| ITEP                            | _À géocoder_                         | Scolaire              |
| Montjoye                        | 38 rue Pastorelli, Nice              | Famille (VM)          |
| PAJE                            | 33 Bd Pierre Sola, Nice              | Famille (VM)          |
| MSD Nice Cessole                | _À géocoder_                         | Famille (VM)          |
| MSD Grasse                      | _À géocoder_                         | Famille (VM)          |
| Orthophoniste Alexia Concession | 7 Bd Gorbella, Nice                  | Médical               |
| CMP La Fontonne                 | Antibes                              | Médical               |
| CMP Vence                       | 44 av Foch, Vence                    | Médical               |
| Danse Art Academy               | 2720 chemin de St Bernard, Vallauris | Loisir                |
| ARPAS                           | 19 av Auguste Renoir, Cagnes-sur-Mer | _À classer_           |

### E. Glossaire

| Terme                  | Définition                                                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Villa**              | Lieu d'hébergement d'un ou plusieurs mineurs (foyer, maison d'enfants). Point de départ ou d'arrivée des accompagnements. |
| **Lieu de RDV**        | Point de passage qui n'est pas une villa (appartement, point de rencontre).                                               |
| **Accompagnement**     | Mission où le chauffeur va chercher le mineur à la villa et le dépose à destination.                                      |
| **Récupération**       | Mission où le chauffeur va chercher le mineur à destination et le ramène à la villa.                                      |
| **Raccompagnement**    | Synonyme de récupération.                                                                                                 |
| **VM**                 | Visite médiatisée — rencontre encadrée entre un mineur et sa famille.                                                     |
| **MSD**                | Maison des Solidarités Départementales.                                                                                   |
| **Tournée**            | Ensemble ordonné d'arrêts à réaliser par un chauffeur sur une demi-journée.                                               |
| **Partie facultative** | Arrêts supplémentaires possibles si le chauffeur accepte de dépasser sa plage horaire.                                    |
| **BDC**                | Bon de commande.                                                                                                          |

---

_Document généré le 2026-04-11 — En attente de validation par la Business Owner._
