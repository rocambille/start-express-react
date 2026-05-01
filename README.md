<div align="right">

[en français ?](./README.fr-FR.md)

</div>

<div align="center">

# StartER 🚀

## The AI-native playground for rapid prototyping

[![GitHub tag](https://img.shields.io/github/tag/rocambille/start-express-react?include_prereleases=&sort=semver&color=white)](https://github.com/rocambille/start-express-react/tags/)
[![License](https://img.shields.io/badge/license-MIT-white)](https://github.com/rocambille/start-express-react/blob/main/LICENSE.md)
[![Issues - start-express-react](https://img.shields.io/github/issues/rocambille/start-express-react)](https://github.com/rocambille/start-express-react/issues)
[![GitHub Stars](https://img.shields.io/github/stars/rocambille/start-express-react.svg?style=social)](https://github.com/rocambille/start-express-react)

[![Use this template](https://img.shields.io/badge/Start-Use_this_template-2ea44f?style=for-the-badge)](https://github.com/rocambille/start-express-react/generate)
[![Read the manual](https://img.shields.io/badge/Learn-Read_the_manual-blue?style=for-the-badge)](https://github.com/rocambille/start-express-react/wiki)

**Learn fullstack development. Prototype with AI. Keep total control.**

</div>

## 🧠 The AI-era starter

Most frameworks are too complex for AI. They hide logic behind "magic" and deep abstractions. This causes AI agents to hallucinate and break things.

**We built StartER to stand out.** It is a "Zero-Magic" foundation designed for **Human-AI co-creation**. By keeping the code readable and explicit, we provide AI agents with a perfect mental model. This makes it the ultimate playground for rapid prototyping and learning.

![](https://raw.githubusercontent.com/rocambille/start-express-react/refs/heads/main/src/react/assets/images/architecture.png)

## 📚 Simple and readable Express + React project structure example

This project shows a simple and readable way to structure a fullstack app with:
- Express backend
- React frontend
- shared contracts for API

If you are looking for a "Express + React starter" or "Node React boilerplate", this repository is a practical example.

## ⚡ Quick start

```bash
# 1. Clone the playground
git clone https://github.com/rocambille/start-express-react.git my-prototype
cd my-prototype

# 2. Install dependencies and initialize the database
npm install
cp .env.sample .env
npm run database:sync

# 3. Start co-creating
npm run dev
```

## ✨ Why prototyping with StartER is faster

### 🧬 Pattern cloning over hallucination

Don't let AI "guess" your architecture. Use `make:clone` to replicate working logic.
```bash
npm run make:clone -- src/express/modules/item src/express/modules/task item task
```
This enforces consistency by cloning your *actual* code patterns. This keeps your AI agent focused and accurate.

### 🧪 Contract-driven verification
You define API behavior in `tests/contracts.ts`: a central, declarative source of truth.
*   **For you:** clear, living documentation.
*   **For AI:** a strict "contract" it must follow when generating endpoints.
*   **For the app:** instant verification that the AI didn't miss a scenario.

### 🔍 Zero-magic simplicity
*   **Sync SQLite:** direct data access that AI can read and write without `async`/`await` confusion.
*   **Explicit casting:** we verify data at the edge. This prevents the silent bugs AI often introduces.
*   **Transparent stack:** Express 5 + React 19. No black boxes. You understand every line.

## 💻 Tech stack
*   **Backend**: Node.js, Express 5, Zod (validation)
*   **Frontend**: React 19, React Router, Vite, Pico CSS
*   **Database**: SQLite (zero-config, sync API)
*   **Tooling**: TypeScript, Biome, Vitest, Docker

## 📖 Learn & support
StartER is a pedagogical project. If this architecture helps you prototype faster with AI, **give us a ⭐ on GitHub!**

👉 **[Read the wiki & AI mental model](https://github.com/rocambille/start-express-react/wiki)**

## 📄 License

Distributed under the [MIT](./LICENSE.md) license. You are free to use, modify, and redistribute it for educational or professional purposes.
