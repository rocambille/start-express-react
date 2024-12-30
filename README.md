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
    Fetcher-)Express: requête (HTTP)
    activate Express
    Express-)Module: appel
    activate Module
    Module-)DB: requête SQL
    activate DB
    DB--)Module: données
    deactivate DB
    Module--)Express: json
    deactivate Module
    Express--)Fetcher: réponse HTTP
    deactivate Express
    Fetcher--)React: render
    deactivate Fetcher
```

Il est pré-configuré avec un ensemble d'outils pour aider des juniors à produire du code de qualité industrielle, tout en restant un outil pédagogique :

- **Docker** : Plateforme de conteneurisation permettant de standardiser et d'automatiser les environnements de développement et de déploiement, garantissant des configurations reproductibles.  
- **TypeScript** : Superset de JavaScript ajoutant des types statiques, facilitant la maintenance et réduisant les erreurs.  
- **React** : Bibliothèque JavaScript pour construire des interfaces utilisateur interactives et modulaires.  
- **React Router** : Gestionnaire de routage pour les applications React, permettant la création de chemins et de composants dynamiques.  
- **Vite** : Outil de construction rapide et léger pour les applications front-end, avec un serveur de développement ultra-rapide et une optimisation des bundles pour la production.  
- **Express** : Framework minimaliste pour créer des serveurs web et des API avec Node.js.  
- **MySQL** : Système de gestion de bases de données relationnelles performant, utilisé pour stocker et interroger les données.  
- **Biome** : Outil tout-en-un pour le linting, le formatage et l'analyse statique de code, conçu pour assurer la qualité et la lisibilité du code de manière performante et moderne.  
- **Jest** : Framework de test JavaScript.  

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

1. Installez Docker et Docker compose.
1. Installez Node (nécessaire pour exécuter les vérifications de pre-commit).
2. Installez le plugin **Biome** dans VSCode et configurez-le.
3. Clonez ce dépôt, puis accédez au répertoire cloné.
4. Créez un fichier d'environnement (`.env`) à la racine du répertoire cloné : vous pouvez copier le fichier `.env.sample` comme modèle (**ne le supprimez pas**).
5. Lancez la commande `docker compose up --build`.

## Les choses à retenir

### Commandes de base

| Commande                                  | Description                                                                                       |
|-------------------------------------------|---------------------------------------------------------------------------------------------------|
| `docker compose up --build`               | Build et démarre les services                                                                     |
| `docker compose run --build server test`  | Build et exécute les tests                                                                        |
| `npm install`                             | Installe les dépendances localement ((nécessaire pour exécuter les vérifications de pre-commit))  |
| `npm run check`                           | Contrôle la qualité du code et la cohérence des types (exécuté en pre-commit)                     |

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
│   │   │   └── item/
│   │   │       ├── itemActions.ts
│   │   │       └── itemRepository.ts
│   │   └── router.ts
|   ├── react/
│   │   ├── components/
│   │   │   └── ...
│   │   ├── pages/
│   │   │   └── ...
│   │   ├── App.tsx
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

```plaintext
MYSQL_ROOT_PASSWORD=
MYSQL_DATABASE=starter
```

**Les variables sont utilisés** dans `server/database/client.ts` :

```typescript
const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

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

**Créer une route** dans `src/express/router.ts` :

```typescript
// ...

/* ************************************************************************* */
// Define Your API Routes Here
/* ************************************************************************* */

// Define item-related routes
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
import databaseClient from "../../../database/client";

import type { Result, Rows } from "../../../database/client";

class ItemRepository {
  async readAll() {
    const [rows] = await databaseClient.query<Rows>("select * from item");

    return rows as Item[];
  }
}

export default new ItemRepository();
```

### REST

| Opération | Méthode | Chemin d'URL | Corps de la requête | SQL    | Réponse (Succès)               | Réponse (Erreur)                                                       |
|-----------|---------|--------------|---------------------|--------|--------------------------------|------------------------------------------------------------------------|
| Browse    | GET     | /items       |                     | SELECT | 200 (OK), liste des items.     |                                                                        |
| Read      | GET     | /items/:id   |                     | SELECT | 200 (OK), un item.             | 404 (Not Found), si id invalide.                                       |
| Add       | POST    | /items       | Données de l'item   | INSERT | 201 (Created), id d'insertion. | 400 (Bad Request), si corps invalide.                                  |
| Edit      | PUT     | /items/:id   | Données de l'item   | UPDATE | 204 (No Content).              | 400 (Bad Request), si corps invalide. 404 (Not Found), si id invalide. |
| Destroy   | DELETE  | /items/:id   |                     | DELETE | 204 (No Content).              |                                                                        |

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
