# StartER

Ce projet est un framework pédagogique, suivant une architecture React-Express-MySQL :

```mermaid
sequenceDiagram
    box Web Client
    participant React as React
    participant Fetcher as Fetcher
    end
    box Web Server
    participant Express as Express
    participant Module as Module
    end
    box DB Server
    participant DB as MySQL Server
    end

    React-)Fetcher: event
    activate Fetcher
    Fetcher-)Express: request (HTTP)
    activate Express
    Express-)Module: route
    activate Module
    Module-)DB: request (SQL)
    activate DB
    DB--)Module: data
    deactivate DB
    Module--)Express: json
    deactivate Module
    Express--)Fetcher: response (HTTP)
    deactivate Express
    Fetcher--)React: render
    deactivate Fetcher
```

Il est pré-configuré avec un ensemble d'outils pour aider des juniors à produire du code de qualité industrielle, tout en restant un outil pédagogique :

- [**React**](https://react.dev/learn) : Bibliothèque JavaScript pour construire des interfaces utilisateur interactives et modulaires.  
- [**Express**](https://expressjs.com/) : Framework minimaliste pour créer des serveurs web et des API avec Node.js.  
- [**MySQL**](https://dev.mysql.com/doc/refman/8.4/en/) : Système de gestion de bases de données relationnelles performant, utilisé pour stocker et interroger les données.  

Sous le capot (liste non exhaustive) :

- [**TypeScript**](https://www.typescriptlang.org/) : Superset de JavaScript ajoutant des types statiques, facilitant la maintenance et réduisant les erreurs.  
- [**Biome**](https://biomejs.dev/) : Outil tout-en-un pour le linting, le formatage et l'analyse statique de code, conçu pour assurer la qualité et la lisibilité du code de manière performante et moderne.  
- [**Docker**](https://docs.docker.com/) : Plateforme de conteneurisation permettant de standardiser et d'automatiser les environnements de développement et de déploiement, garantissant des configurations reproductibles.  
- [**Vite**](https://vite.dev/guide/) : Outil de construction rapide et léger pour les applications front-end, avec un serveur de développement ultra-rapide et une optimisation des bundles pour la production.  
- [**React Router (Library)**](https://reactrouter.com/home) : Gestionnaire de routage pour les applications React, permettant la création de chemins et de composants dynamiques.  
- [**Pico CSS**](https://picocss.com/) : Kit CSS minimaliste et léger qui donne la priorité à la syntaxe sémantique.  
- [**Zod**](https://zod.dev/) : Bibliothèque de déclaration et de validation de schéma axée sur TypeScript.  
- [**Jest**](https://jestjs.io/) : Framework de test JavaScript.  

## Table des matières

- [StartER](#starter)
  - [Table des matières](#table-des-matières)
  - [Utilisateurs Windows](#utilisateurs-windows)
  - [Installation et utilisation](#installation-et-utilisation)
  - [Les choses à retenir](#les-choses-à-retenir)
    - [Commandes de base](#commandes-de-base)
    - [Structure des fichiers sources](#structure-des-fichiers-sources)
    - [Mettre en place la base de données](#mettre-en-place-la-base-de-données)
    - [Développer la partie back-end](#développer-la-partie-back-end)
    - [REST](#rest)
    - [Autres bonnes pratiques](#autres-bonnes-pratiques)
  - [FAQ](#faq)
    - [Logs](#logs)
    - [Contribution](#contribution)

## Utilisateurs Windows

Assurez-vous de lancer ces commandes dans un terminal Git pour éviter [les problèmes de formats de nouvelles lignes](https://en.wikipedia.org/wiki/Newline#Issues_with_different_newline_formats) :

```sh
git config --global core.eol lf
git config --global core.autocrlf false
```

## Installation et utilisation

Suivez les [premiers pas](https://github.com/rocambille/start-express-react/wiki/Premiers-pas) dans notre wiki.

## Les choses à retenir

### Commandes de base

| Commande                                            | Description                                                                 |
|-----------------------------------------------------|-----------------------------------------------------------------------------|
| `docker compose up --build`                         | Build et démarre les services (ajouter `-d` pour démarrer en mode détaché)  |
| `docker compose -f compose.prod.yaml up --build -d` | Build et démarre en production                                              |
| `docker exec -it your-mysql mysql -u root -p`       | Exécute un client MySQL dans le container `your-mysql`                      |
| `docker compose run --build --rm server test`       | Exécute les tests                                                           |
| `npm run check`                                     | Contrôle la qualité du code avec Biome (exécuté en pre-commit)              |
| `npm run check-types`                               | Contrôle la cohérence des types avec TypeScript (exécuté en pre-commit)     |

### Structure des fichiers sources

```plaintext
my-project/
├── src/
|   ├── database/
│   |   ├── checkConnection.ts
│   |   ├── client.ts
│   |   └── schema.sql
│   ├── express/
│   │   ├── modules/
│   │   │   └── ...
│   │   └── routes.ts
|   ├── react/
│   │   ├── components/
│   │   │   └── ...
│   │   ├── pages/
│   │   │   └── ...
│   │   └── routes.tsx
|   ├── types/
│   │   └── index.d.ts
|   ├── entry-client.tsx
|   └── entry-server.tsx
├── index.html
└── server.ts
```

### Mettre en place la base de données

**Créer et remplir le fichier `.env`** à la racine :

```env
MYSQL_ROOT_PASSWORD=YOUR_MYSQL_ROOT_PASSWORD
MYSQL_DATABASE=YOUR_MYSQL_DATABASE_NAME
```

**Les variables sont utilisés** dans `server/database/client.ts` :

```typescript
const { MYSQL_ROOT_PASSWORD, MYSQL_DATABASE } = process.env;

import mysql from "mysql2/promise";

const client = mysql.createPool(
  `mysql://root:${MYSQL_ROOT_PASSWORD}@database:3306/${MYSQL_DATABASE}`,
);

export default client;
```

**Créer une table** dans `src/database/schema.sql` :

```sql
create table item (
  id int unsigned primary key auto_increment not null,
  title varchar(255) not null,
  user_id int unsigned not null,
  foreign key(user_id) references user(id)
);
```

**Insérer des données** dans `src/database/schema.sql` :

```sql
insert into item(id, title, user_id)
values
  (1, "Stuff", 1),
  (2, "Doodads", 1);
```

**Synchroniser la BDD avec le schema** :

```sh
docker compose up --build
```

### Développer la partie back-end

**Utiliser les routes d'un module** dans `src/express/routes.ts` :

```typescript
// ...

/* ************************************************************************* */

import itemRoutes from "./modules/item/itemRoutes";

router.use(itemRoutes);

/* ************************************************************************* */

// ...
```

**Créer une route** dans `src/express/modules/itemRoutes.ts` :

```typescript
// ...

/* ************************************************************************* */

import itemActions from "./modules/item/itemActions";

router.get("/api/items", itemActions.browse);

/* ************************************************************************* */

// ...
```

**Définir une action** dans `src/express/modules/item/itemActions.ts` :

```typescript
import type { RequestHandler } from "express";

import itemRepository from "./itemRepository";

const browse: RequestHandler = async (req, res, next) => {
  try {
    const items = await itemRepository.readAll();

    res.json(items);
  } catch (err) {
    next(err);
  }
};

export default { browse };
```

**Accéder aux données** dans `src/express/modules/item/itemRepository.ts` :

```typescript
import databaseClient, {
  type Result,
  type Rows,
} from "../../../database/client";

class ItemRepository {
  async readAll() {
    const [rows] = await databaseClient.query<Rows>("select * from item");

    return rows as Item[];
  }
}

export default new ItemRepository();
```

### REST

| Opération | Méthode | Chemin d'URL    | Corps de la requête | SQL     | Réponse (Succès)                | Réponse (Erreur)                                                        |
|-----------|---------|-----------------|---------------------|---------|---------------------------------|-------------------------------------------------------------------------|
| Browse    | GET     | /api/items      |                     | SELECT  | 200 (OK), liste des items.      |                                                                         |
| Read      | GET     | /api/items/:id  |                     | SELECT  | 200 (OK), un item.              | 404 (Not Found), si id invalide.                                        |
| Add       | POST    | /api/items      | Données de l'item   | INSERT  | 201 (Created), id d'insertion.  | 400 (Bad Request), si corps invalide.                                   |
| Edit      | PUT     | /api/items/:id  | Données de l'item   | UPDATE  | 204 (No Content).               | 400 (Bad Request), si corps invalide. 404 (Not Found), si id invalide.  |
| Destroy   | DELETE  | /api/items/:id  |                     | DELETE  | 204 (No Content).               |                                                                         |

### Autres bonnes pratiques

- **Sécurité** :
  - Validez et échappez toujours les entrées des utilisateurs.
  - Utilisez HTTPS pour toutes les communications réseau.
  - Stockez les mots de passe de manière sécurisée en utilisant des hash forts (ex : argon2).
  - Revoyez et mettez à jour régulièrement les dépendances.

- **Code** :
  - Suivez les principes SOLID pour une architecture de code propre et maintenable.
  - Utilisez TypeScript pour bénéficier de la vérification statique des types.
  - Adoptez un style de codage cohérent avec Biome.
  - Écrivez des tests pour toutes les fonctionnalités critiques.

## FAQ

### Logs

Pour accéder aux logs de votre projet en ligne (pour suivre le déploiement ou surveiller les erreurs), connectez-vous à votre VPS (`ssh user@host`). Ensuite, allez dans votre projet spécifique et exécutez `docker compose logs -t -f`.

### Contribution

Nous accueillons avec plaisir les contributions ! Veuillez suivre ces étapes pour contribuer :

1. **Fork** le dépôt.
2. **Clone** votre fork sur votre machine locale.
3. Créez une nouvelle branche pour votre fonctionnalité ou bug fix (`git switch -c feature/your-feature-name`).
4. **Commit** vos modifications (`git commit -m 'Add some feature'`).
5. **Push** vers votre branche (`git push origin feature/your-feature-name`).
6. Créez une **Pull Request** sur le dépôt principal.

**Guide de Contribution** :

- Assurez-vous que votre code respecte les standards de codage en exécutant `npm run check` avant de pousser vos modifications.
- Ajoutez des tests pour toute nouvelle fonctionnalité ou correction de bug.
- Documentez clairement vos modifications dans la description de la pull request.
