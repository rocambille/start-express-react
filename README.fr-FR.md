<div align="right">

[in english?](./README.md)

</div>

<div align="center">

# StartER 🚀

## L'environnement pour le prototypage rapide à l'ère de l'IA

[![GitHub tag](https://img.shields.io/github/tag/rocambille/start-express-react?include_prereleases=&sort=semver&color=white)](https://github.com/rocambille/start-express-react/tags/)
[![License](https://img.shields.io/badge/license-MIT-white)](https://github.com/rocambille/start-express-react/blob/main/LICENSE.md)
[![Issues - start-express-react](https://img.shields.io/github/issues/rocambille/start-express-react)](https://github.com/rocambille/start-express-react/issues)
[![GitHub Stars](https://img.shields.io/github/stars/rocambille/start-express-react.svg?style=social)](https://github.com/rocambille/start-express-react)

[![Use this template](https://img.shields.io/badge/Démarrer-Use_this_template-2ea44f?style=for-the-badge)](https://github.com/rocambille/start-express-react/generate)
[![Read the manual](https://img.shields.io/badge/Apprendre-Read_the_manual-blue?style=for-the-badge)](https://github.com/rocambille/start-express-react/wiki/home-fr-FR)

**Apprenez le développement fullstack. Créez des prototypes avec l'IA. Gardez le contrôle.**

</div>

## 🧠 Starter, le framework idéal pour l'IA

La plupart des frameworks sont trop complexes pour l'IA. Ils dissimulent la logique derrière des abstractions complexes et opaques, ce qui peut entraîner des dysfonctionnements et des erreurs de conception chez les agents.

**Nous avons conçu StartER pour nous démarquer.** Il s'agit d'une plateforme "sans magie" conçue pour la **co-création humain-IA**. En conservant un code lisible et explicite, nous fournissons aux agents IA un modèle mental optimal. StartER devient ainsi le terrain de jeu idéal pour le prototypage et l'apprentissage rapides.

![](https://raw.githubusercontent.com/rocambille/start-express-react/refs/heads/main/src/react/assets/images/architecture.png)

## 📚 Exemple de structure de projet Express + React simple et lisible

Ce projet présente une méthode simple et lisible pour structurer une application fullstack avec :

* Backend Express
* Frontend React
* Contrats partagés pour l'API

Si vous recherchez un "starter Express + React" ou un "boilerplate Node React", ce dépôt est un exemple pratique.

## ⚡ Démarrage Rapide

```bash
# 1. Cloner le projet (ou utiliser le bouton "Use this template")
git clone https://github.com/rocambille/start-express-react.git mon-projet
cd mon-projet

# 2. Installer les dépendances et initialiser la base de données
npm install
cp .env.sample .env
npm run database:sync

# 3. Lancer l'application
npm run dev
```
> L'application est disponible sur `http://localhost:5173`

## ✨ Pourquoi le prototypage avec StartER est plus rapide

### 🧬 Clonage de modèles plutôt qu'hallucination

Ne laissez pas l'IA "deviner" votre architecture. Utilisez `make:clone` pour répliquer la logique fonctionnelle.

```bash
npm run make:clone -- src/express/modules/item src/express/modules/task item task
```
Cela garantit la cohérence en clonant vos modèles de code *réels*. Votre agent IA reste ainsi concentré et précis.

### 🧪 Vérification basée sur un contrat

Vous définissez le comportement de l'API dans `tests/contracts.ts` : une source de vérité centrale et déclarative.

* **Pour vous :** une documentation claire et évolutive.

* **Pour l'IA :** un "contrat" strict qu'elle doit respecter lors de la génération des endpoints.

* **Pour l'application :** vérification instantanée que l'IA n'a omis aucun scénario.

### 🔍 Simplicité sans magie

* **SQLite synchrone :** accès direct aux données que l'IA peut lire et écrire sans confusion avec `async`/`await`.

* **Conversion explicite :** typage des données aux emplacements clés. Ceci évite les bugs silencieux souvent introduits par l'IA.

* **Stack transparente :** Express 5 + React 19. Aucune boîte noire. Vous comprenez chaque ligne.

## 💻 Stack technique

* **Backend** : Node.js, Express 5, Zod (validation)
* **Frontend** : React 19, React Router, Vite, Pico CSS
* **Database** : SQLite (zero-config, API synchrone)
* **Tooling** : TypeScript, Biome, Vitest, Docker

## 📖 Documentation

StartER est un projet pédagogique. Si cette architecture vous aide à prototyper plus rapidement avec l'IA, **laissez-nous une ⭐ sur GitHub !**

👉 **[Consultez le wiki et le modèle mental de l'IA](https://github.com/rocambille/start-express-react/wiki)**

## 📄 Licence

Distribué sous licence [MIT](./LICENSE.md). Vous êtes libre de l'utiliser, de le modifier et de le redistribuer à des fins éducatives ou professionnelles.
