# Tournée Nath

Outil de planification de tournées pour le Foyer de l'Enfance — optimisation automatique des trajets chauffeurs.

## Stack technique

- **Framework** : Next.js 16 (App Router, TypeScript)
- **UI** : Tailwind CSS v4, shadcn/ui
- **Base de données** : PostgreSQL (Coolify-managed on VPS)
- **ORM** : Drizzle ORM + node-postgres
- **Hébergement** : Coolify (self-hosted PaaS)
- **Domaine** : `tournee.chezgilles.ovh`

## Développement local

```bash
# Cloner le repo
git clone https://github.com/GillesClosset/tournee.git
cd tournee

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env.local
# Remplir DATABASE_URL, ORS_API_KEY, ORS_BASE_URL dans .env.local

# Lancer le serveur de développement
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Base de données

### Avec Drizzle Kit (recommandé)

```bash
npx drizzle-kit push       # Pousser le schéma vers la DB
npx drizzle-kit generate   # Générer une migration SQL depuis le diff du schéma
npx drizzle-kit studio     # Navigateur visuel à https://local.drizzle.studio
```

### Avec SQL brut

```bash
psql $DATABASE_URL -f db/migrations/001_create_drivers.sql
# ... appliquer chaque fichier dans l'ordre
```

## Scripts disponibles

| Commande               | Description                      |
| ---------------------- | -------------------------------- |
| `npm run dev`          | Serveur de développement         |
| `npm run build`        | Build de production (standalone) |
| `npm run start`        | Démarrer le build de production  |
| `npm run test`         | Tests unitaires (Vitest)         |
| `npm run lint`         | Linting (ESLint)                 |
| `npm run format`       | Formatage (Prettier)             |
| `npm run format:check` | Vérification du formatage        |

## Déploiement en production

Le déploiement se fait via **Coolify** sur un VPS. Voir [ARCHITECTURE.md § 12](./ARCHITECTURE.md#12-environnements--déploiement) pour les instructions détaillées.

En résumé :

1. Coolify build l'image Docker depuis le `Dockerfile` à la racine
2. Les variables d'environnement sont configurées dans Coolify
3. Auto-deploy sur push vers `main`

## Repo GitHub

[https://github.com/GillesClosset/tournee](https://github.com/GillesClosset/tournee)
