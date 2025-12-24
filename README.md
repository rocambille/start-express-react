[![GitHub tag](https://img.shields.io/github/tag/rocambille/start-express-react?include_prereleases=&sort=semver&color=white)](https://github.com/rocambille/start-express-react/tags/)
[![License](https://img.shields.io/badge/license-MIT-white)](https://github.com/rocambille/start-express-react/blob/main/LICENSE.md)
[![Issues - start-express-react](https://img.shields.io/github/issues/rocambille/start-express-react)](https://github.com/rocambille/start-express-react/issues)

<div align="right">

[in english?](./README.en-US.md)

</div>

<div align="center">

# StartER - Un framework Express + React complet et lisible

Framework React + Express pensé pour le prototypage rapide et l’apprentissage.  
Conçu pour être compris avant tout, et facilement adaptable grâce à un système de clonage de modules.

⭐️ Si vous trouvez ce projet utile, **laissez une étoile** pour soutenir le projet ! [![GitHub Stars](https://img.shields.io/github/stars/rocambille/start-express-react.svg?style=social)](https://github.com/rocambille/start-express-react)

[![Use this template](https://img.shields.io/badge/Démarrer-Use_this_template-2ea44f?style=for-the-badge)](https://github.com/rocambille/start-express-react/generate)

[![Read the manual](https://img.shields.io/badge/Apprendre-Read_the_manual-blue?style=for-the-badge)](https://github.com/rocambille/start-express-react/wiki)

</div>

## Vue d'ensemble

![](https://raw.githubusercontent.com/rocambille/start-express-react/refs/heads/main/src/react/assets/images/architecture.png)

StartER est un **starter full-stack** combinant Express (backend) et React (frontend) dans un seul projet cohérent.
Il est conçu à la fois comme un **outil pédagogique** et comme une base de production solide pour **prototyper** rapidement des applications web modernes.

## Technologies incluses

### Côté serveur et client

* [**Express**](https://expressjs.com/) : framework minimaliste pour créer des serveurs web et des API avec Node.js.
* [**React**](https://fr.react.dev/learn) : bibliothèque JavaScript pour construire des interfaces utilisateur interactives et modulaires.

### Outils et écosystème

Dans l'ordre alphabétique (liste non exhaustive) :

* [**Biome**](https://biomejs.dev/) : linter, formateur et analyseur statique performant pour garantir un code propre.
* [**Docker**](https://docs.docker.com/) : conteneurisation pour des environnements de développement et de déploiement reproductibles.
* [**MySQL**](https://dev.mysql.com/doc/refman/8.4/en/) : système de gestion de bases de données relationnelles.
* [**Pico CSS**](https://picocss.com/) : kit CSS minimaliste et sémantique.
* [**React Router (Mode Data)**](https://reactrouter.com/home) : gestionnaire de routes pour React.
* [**TypeScript**](https://www.typescriptlang.org/) : superset de JavaScript ajoutant des types statiques.
* [**Vite**](https://vite.dev/guide/) : outil de build rapide pour le développement et la production.
* [**Vitest**](https://vitest.dev/guide/) : framework de test intégré à Vite.
* [**Zod**](https://zod.dev/) : validation et typage de schémas TypeScript.

## Installation et utilisation

Une documentation complète est disponible dans le [wiki du projet](https://github.com/rocambille/start-express-react/wiki).

Pour débuter, consultez les pages principales :

* [Installation](https://github.com/rocambille/start-express-react/wiki/Installation)
* [Database](https://github.com/rocambille/start-express-react/wiki/Database)
* [Express](https://github.com/rocambille/start-express-react/wiki/Express)
* [React](https://github.com/rocambille/start-express-react/wiki/React)

## Structure des fichiers sources

```
.
├── .env
├── .env.sample
├── compose.yaml
├── compose.prod.yaml
├── Dockerfile
├── index.html
├── server.ts
└── src
    ├── database
    │   └── schema.sql
    ├── express
    │   ├── routes.ts
    │   └── modules
    │       └── ...
    ├── react
    │   ├── routes.tsx
    │   └── components
    │       └── ...
    └── types
        └── index.d.ts
```

## Commandes de base

| Commande                                                        | Description                                                                      |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `docker compose up --build`                                     | Build et démarre les services (ajouter `-d` pour démarrer en mode détaché).      |
| `docker compose -f compose.prod.yaml up --build -d`             | Build et démarre l'application en mode production.                               |
| `docker compose logs -t`                                        | Affiche les logs avec timestamps.                                                |
| `docker compose run --build --rm server npm run database:sync`  | Synchronise la base de données avec `src/database/schema.sql` (`-- --use-seeder` pour remplir la base de données avec `src/database/seeder.sql`).                   |
| `docker compose run --build --rm server npm run test`           | Exécute les tests.                                                               |
| `npm run biome:check`                                           | Contrôle la qualité du code avec Biome (exécuté en pre-commit).                  |
| `npm run types:check`                                           | Contrôle la cohérence des types TypeScript (exécuté en pre-commit).              |
| `npm run make:clone <source> <destination> <OldName> <NewName>` | Clone un module ou un fichier en renommant automatiquement les identifiants.     |
| `npm run make:purge`                                            | Supprime les modules par défaut (`-- --keep-auth` pour conserver `user` et `auth`). |

## REST cheatsheet

StartER repose sur une architecture **RESTful**, où chaque ressource (par exemple `items` ou `users`) expose un ensemble d'*endpoints* structurés autour des opérations CRUD/BREAD classiques :

* **Browse** : parcourir toutes les ressources
* **Read** : lire une ressource spécifique
* **Add** : créer une nouvelle ressource
* **Edit** : modifier une ressource existante
* **Destroy** : supprimer une ressource

Ce tableau récapitule les conventions utilisées dans les modules Express du projet (comme `itemRoutes`), les méthodes HTTP associées et les réponses attendues.
Il sert de référence rapide lorsque vous développez vos propres modules ou testez vos API.

| Opération | Méthode | Chemin d'URL   | Corps de la requête | SQL    | Réponse (succès)               | Réponse (erreur)                                                        |
| --------- | ------- | -------------- | ------------------- | ------ | ------------------------------ | ----------------------------------------------------------------------- |
| Browse    | GET     | /api/items     | —                   | SELECT | 200 (OK), liste des items.     | —                                                                       |
| Read      | GET     | /api/items/:id | —                   | SELECT | 200 (OK), un item.             | 404 (Not Found), si id invalide.                                        |
| Add       | POST    | /api/items     | Données de l'item   | INSERT | 201 (Created), id d'insertion. | 400 (Bad Request), si corps invalide.                                   |
| Edit      | PUT     | /api/items/:id | Données de l'item   | UPDATE | 204 (No Content).              | 400 (Bad Request), si corps invalide ; 404 (Not Found), si id invalide. |
| Destroy   | DELETE  | /api/items/:id | —                   | DELETE | 204 (No Content).              | —                                                                       |

## Licence

Ce projet est distribué sous licence [MIT](./LICENSE.md).
Vous êtes libre de l'utiliser, le modifier et le redistribuer à des fins éducatives ou professionnelles.
