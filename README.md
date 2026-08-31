<div align="right">

[en français ?](./README.fr-FR.md)

</div>

<div align="center">

# StartER 🚀

## Learn fullstack development. Ship fast.

[![GitHub tag](https://img.shields.io/github/tag/rocambille/start-express-react?include_prereleases=&sort=semver&color=white)](https://github.com/rocambille/start-express-react/tags/)
[![License](https://img.shields.io/badge/license-MIT-white)](https://github.com/rocambille/start-express-react/blob/main/LICENSE.md)
[![Issues - start-express-react](https://img.shields.io/github/issues/rocambille/start-express-react)](https://github.com/rocambille/start-express-react/issues)
[![GitHub Stars](https://img.shields.io/github/stars/rocambille/start-express-react.svg?style=social)](https://github.com/rocambille/start-express-react)

[![Use this template](https://img.shields.io/badge/Start-Use_this_template-2ea44f?style=for-the-badge)](https://github.com/rocambille/start-express-react/generate)
[![Read the manual](https://img.shields.io/badge/Learn-Read_the_manual-blue?style=for-the-badge)](https://github.com/rocambille/start-express-react/wiki)

**A pedagogical Express + React framework designed for clarity, prototyping, and AI co-creation.**

</div>

## 📚 Why StartER?

StartER is an open-source framework for **learning** and **building** fullstack web applications. It provides:
- Express backend
- React frontend
- Shared types and contracts for API verification
- A "Zero-Magic" architecture where you understand every line

Whether you're a student, a bootcamp graduate, or an experienced developer prototyping a new idea, StartER gives you a solid, readable foundation.

If you are looking for an "Express + React starter" or "Node React boilerplate", this repository is a practical template.

## 🧠 Built for the AI era

StartER's readable, explicit codebase makes it uniquely suited for **Human-AI co-creation**. Most frameworks hide logic behind "magic" and deep abstractions, causing AI agents to hallucinate. StartER's transparency gives AI agents a perfect mental model, making it the ideal playground for rapid prototyping.

![](https://raw.githubusercontent.com/rocambille/start-express-react/refs/heads/main/src/react/assets/images/architecture.png)

## ⚡ Quick start

```bash
# 1. Clone the playground
git clone https://github.com/rocambille/start-express-react.git my-prototype
cd my-prototype

# 2. Install dependencies and initialize the database
npm install
cp .env.sample .env
npm run database:reset

# 3. Start co-creating
npm run dev
```

## ✨ Why prototyping with StartER is faster

### 🧬 Pattern cloning over hallucination

Don't let AI "guess" your architecture. Use `make:clone` to replicate working logic.
```bash
npm run make:clone -- src/express/modules/item src/express/modules/task Item Task
```
This enforces consistency by cloning your *actual* code patterns. This keeps your AI agent focused and accurate.

### 🧪 Contract-driven verification
You define API behavior in the `tests/contracts/` directory: a central, declarative source of truth.
*   **For you:** clear, living documentation.
*   **For AI:** a strict "contract" it must follow when generating endpoints.
*   **For the app:** instant verification that the AI didn't miss a scenario.

### 🔍 Zero-magic simplicity
*   **Sync SQLite:** direct data access that AI can read and write without `async`/`await` confusion.
*   **Single Source of Truth Schemas:** Zod schemas in `*Schemas.ts` validate HTTP inputs at the edge and parse database entity outputs. This prevents silent runtime bugs.
*   **Transparent stack:** Express 5 + React 19. No black boxes. You understand every line.

## 💻 Tech stack
*   **Backend**: Node.js, Express 5, Zod (validation)
*   **Frontend**: React 19, React Router, Vite, Pico CSS
*   **Database**: SQLite (zero-config, sync API)
*   **Tooling**: TypeScript, Biome, Vitest, Docker

## 📖 Learn & support
StartER is a pedagogical project. If this framework helps you learn or prototype faster, **give us a ⭐ on GitHub!**

👉 **[Read the wiki](https://github.com/rocambille/start-express-react/wiki)**

## 📄 License

Distributed under the [MIT](./LICENSE.md) license. You are free to use, modify, and redistribute it for educational or professional purposes.
