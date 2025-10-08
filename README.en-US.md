[![GitHub tag](https://img.shields.io/github/tag/rocambille/start-express-react?include_prereleases=&sort=semver&color=white)](https://github.com/rocambille/start-express-react/tags/)
[![License](https://img.shields.io/badge/license-MIT-white)](https://github.com/rocambille/start-express-react/blob/main/LICENSE.md)
[![issues - start-express-react](https://img.shields.io/github/issues/rocambille/start-express-react)](https://github.com/rocambille/start-express-react/issues)

<div align="right">

[![en-US](https://img.shields.io/badge/lang-en--US-green.svg)](./README.en-US.md)
[![fr-FR](https://img.shields.io/badge/lang-fr--FR-white.svg)](./README.md)

</div>

<div align="center">

# StartER – A modern full-stack Express + React starter

🔧 **Educational framework** for building web applications in Express + React with integrated production tools.

⭐️ If you find this project useful, **add a star** to support the project! [![GitHub Stars](https://img.shields.io/github/stars/rocambille/start-express-react.svg?style=social)](https://github.com/rocambille/start-express-react)

[![Use this template](https://img.shields.io/badge/Start-Use_this_template-2ea44f?style=for-the-badge)](https://github.com/rocambille/start-express-react/generate)

[![Read the manual](https://img.shields.io/badge/Learn-Read_the_manual-blue?style=for-the-badge)](https://github.com/rocambille/start-express-react/wiki/Home-en-US)

</div>

## Overview

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

The framework comes pre-configured with a set of tools to help junior developers produce industrial-quality code, while remaining an educational tool:

- [**Express**](https://expressjs.com/): Minimalist framework for building web servers and APIs with Node.js.
- [**React**](https://react.dev/learn): JavaScript library for building interactive and modular user interfaces.

Under the hood (in alphabetical order, non-exhaustive list):

- [**Biome**](https://biomejs.dev/): All-in-one tool for linting, formatting, and static code analysis, designed to ensure code quality and readability in a powerful and modern way.
- [**Docker**](https://docs.docker.com/): Containerization platform for standardizing and automating development and deployment environments, ensuring reproducible configurations.
- [**MySQL**](https://dev.mysql.com/doc/refman/8.4/en/): Relational database management system used to store and query data.
- [**Pico CSS**](https://picocss.com/): Minimalist and lightweight CSS kit that prioritizes semantic syntax.
- [**React Router (Data Mode)**](https://reactrouter.com/home): Routing manager for React applications, allowing the creation of dynamic paths and components.
- [**TypeScript**](https://www.typescriptlang.org/): JavaScript superset that adds static types, eases maintenance, and reduces errors.
- [**Vite**](https://vite.dev/guide/): Fast and lightweight build tool for front-end applications, with a blazing-fast development server and optimized bundles for production.
- [**Vitest**](https://vitest.dev/guide/): JavaScript testing framework.
- [**Zod**](https://zod.dev/): TypeScript-based schema declaration and validation library.

## Installation and Usage

Complete documentation is available in our [wiki](https://github.com/rocambille/start-express-react/wiki/Home-en-US).

To get started, refer to the following pages:

* [Installation](https://github.com/rocambille/start-express-react/wiki/Installation-en-US)
* [Database](https://github.com/rocambille/start-express-react/wiki/Database-en-US)
* [Express](https://github.com/rocambille/start-express-react/wiki/Express-en-US)
* [React](https://github.com/rocambille/start-express-react/wiki/React-en-US)

## Things to remember

### Directory structure

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
    │   └── schema.sql
    ├── express
    │   ├── routes.ts
    │   └── modules
    │       └── ...
    ├── react
    │   ├── routes.tsx
    │   ├── components
    │   │   └── ...
    │   └── pages
    │       └── ...
    └── types
        └── index.d.ts
```

### Basic Commands

| Command | Description |
|------------------------------------------------------------------|-----------------------------------------------------------------------------|
| `docker compose up --build` | Build and start services (add `-d` to start in detached mode) |
| `docker compose -f compose.prod.yaml up --build -d` | Build and start in production mode |
| `docker compose logs -t` | Displays logs with timestamps |
| `docker compose run --build --rm server npm run database:sync` | Synchronizes database contents with `src/database/schema.sql` |
| `docker compose run --build --rm server npm run test` | Runs tests |
| `npm run biome:check` | Checks code quality with Biome (executed on pre-commit) |
| `npm run types:check` | Checks type consistency with TypeScript (executed on pre-commit) |
| `npm run make:clone <path to existing module> <path for new module>  <OldName> <NewName>` | Clone a module or file, renaming identifiers automatically |
| `npm run make:purge` | Removes default modules. Add `-- --keep-auth` to preserve user and auth modules. |

### Example: Clone Command 
#### Cloning a Single File

To clone a single file `itemActions.ts` into a new file `itemActionsCloned.ts`:

```bash
npm run make:clone src/express/modules/item/itemActions.ts src/express/modules/item/itemActionsCloned.ts itemActions clonedItemActions
```

#### Cloning a Whole Module

To clone the entire `item` module folder into a new folder `itemCloned`:

```bash
npm run make:clone src/express/modules/item src/express/modules/itemCloned Item ItemCloned
```


### REST cheatsheet

| Operation | Method | URL Path | Request Body | SQL | Response (Success) | Response (Error) |
|-----------|---------|-----------------|---------------------|---------|---------------------------------|-------------------------------------------------------------------------|
| Browse | GET | /api/items | | SELECT | 200 (OK), list of items. | |
| Read | GET | /api/items/:id | | SELECT | 200 (OK), one item. | 404 (Not Found), if invalid id. |
| Add | POST | /api/items | Item Data | INSERT | 201 (Created), insert id. | 400 (Bad Request), if invalid body. |
| Edit | PUT | /api/items/:id | Item Data | UPDATE | 204 (No Content). | 400 (Bad Request), if invalid body. 404 (Not Found), if invalid id. |
| Destroy | DELETE | /api/items/:id | | DELETE | 204 (No Content). | |
