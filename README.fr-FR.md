<div align="right">

[in english?](./README.md)

</div>

<div align="center">

# StartER 🚀

## Apprenez le développement fullstack. Livrez vite.

[![GitHub tag](https://img.shields.io/github/tag/rocambille/start-express-react?include_prereleases=&sort=semver&color=white)](https://github.com/rocambille/start-express-react/tags/)
[![License](https://img.shields.io/badge/license-MIT-white)](https://github.com/rocambille/start-express-react/blob/main/LICENSE.md)
[![Issues - start-express-react](https://img.shields.io/github/issues/rocambille/start-express-react)](https://github.com/rocambille/start-express-react/issues)
[![GitHub Stars](https://img.shields.io/github/stars/rocambille/start-express-react.svg?style=social)](https://github.com/rocambille/start-express-react)

[![Use this template](https://img.shields.io/badge/Démarrer-Use_this_template-2ea44f?style=for-the-badge)](https://github.com/rocambille/start-express-react/generate)
[![Read the manual](https://img.shields.io/badge/Apprendre-Read_the_manual-blue?style=for-the-badge)](https://github.com/rocambille/start-express-react/wiki/home-fr-FR)

**Un framework pédagogique Express + React conçu pour la clarté, le prototypage et la co-création avec l'IA.**

</div>

## 📚 Pourquoi StartER ?

StartER est un framework open-source pour **apprendre** et **construire** des applications web fullstack. Il fournit :

* Backend Express
* Frontend React
* Types et contrats partagés pour la vérification de l'API
* Une architecture "sans magie" où vous comprenez chaque ligne

Que vous soyez étudiant·e, en reconversion, ou développeur·se expérimenté·e qui prototype une nouvelle idée, StartER vous offre une base solide et lisible.

Si vous recherchez un "starter Express + React" ou un "boilerplate Node React", ce dépôt est un template pratique.

## 🧠 Conçu pour l'ère de l'IA

Le code lisible et explicite de StartER le rend particulièrement adapté à la **co-création humain-IA**. La plupart des frameworks masquent leur logique derrière des abstractions opaques, provoquant des hallucinations chez les agents IA. La transparence de StartER leur offre un modèle mental optimal, ce qui en fait l'outil idéal pour le prototypage rapide.

![](https://raw.githubusercontent.com/rocambille/start-express-react/refs/heads/main/src/react/assets/images/architecture.png)

## ⚡ Démarrage Rapide

```bash
# 1. Cloner le projet (ou utiliser le bouton "Use this template")
git clone https://github.com/rocambille/start-express-react.git mon-projet
cd mon-projet

# 2. Installer les dépendances et initialiser la base de données
npm install
cp .env.sample .env
npm run database:reset

# 3. Lancer l'application
npm run dev
```
> L'application est disponible sur `http://localhost:5173`

## ✨ Pourquoi le prototypage avec StartER est plus rapide

### 🧬 Clonage de modèles plutôt qu'hallucination

Ne laissez pas l'IA "deviner" votre architecture. Utilisez `make:clone` pour répliquer la logique fonctionnelle.

```bash
npm run make:clone -- src/express/modules/item src/express/modules/task Item Task
```
Cela garantit la cohérence en clonant vos modèles de code *réels*. Votre agent IA reste ainsi concentré et précis.

### 🧪 Vérification basée sur un contrat

Vous définissez le comportement de l'API dans le dossier `tests/contracts/` : une source de vérité centrale et déclarative.

* **Pour vous :** une documentation claire et évolutive.

* **Pour l'IA :** un "contrat" strict qu'elle doit respecter lors de la génération des endpoints.

* **Pour l'application :** vérification instantanée que l'IA n'a omis aucun scénario.

### 🔍 Simplicité sans magie

* **SQLite synchrone :** accès direct aux données que l'IA peut lire et écrire sans confusion avec `async`/`await`.

* **Schémas comme cource unique de Vvrité :** des schémas Zod centralisés dans `*Schemas.ts` qui valident les entrées HTTP et analysent les sorties de la base de données pour éviter les bugs silencieux.

* **Stack transparente :** Express 5 + React 19. Aucune boîte noire. Vous comprenez chaque ligne.

## 💻 Stack technique

* **Backend** : Node.js, Express 5, Zod (validation)
* **Frontend** : React 19, React Router, Vite, Pico CSS
* **Database** : SQLite (zero-config, API synchrone)
* **Tooling** : TypeScript, Biome, Vitest, Docker

## 📖 Documentation

StartER est un projet pédagogique. Si ce framework vous aide à apprendre ou à prototyper plus vite, **laissez-nous une ⭐ sur GitHub !**

👉 **[Consultez le wiki](https://github.com/rocambille/start-express-react/wiki)**

## 📄 Licence

Distribué sous licence [MIT](./LICENSE.md). Vous êtes libre de l'utiliser, de le modifier et de le redistribuer à des fins éducatives ou professionnelles.
