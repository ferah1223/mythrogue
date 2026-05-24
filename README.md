# MythRogue

> **Powered by Xiaomi MiMo V2.5** — Roguelike Dungeon Crawler

![MythRogue](https://img.shields.io/badge/MythRogue-Roguelike-7c5cfc?style=for-the-badge&logo=gamepad)
![MiMo](https://img.shields.io/badge/Powered%20by-Xiaomi%20MiMo%20V2.5-orange?style=for-the-badge)
![Agents](https://img.shields.io/badge/Agents-8%20Active-5dade2?style=for-the-badge)
![Tokens](https://img.shields.io/badge/Tokens-15B%2FDay-f4d03f?style=for-the-badge)
![Client](https://img.shields.io/badge/Client--Side-No%20API%20Key-2ecc71?style=for-the-badge)

---

## 🎮 What is MythRogue?

MythRogue is a **fully client-side roguelike dungeon crawler** where 8 AI agents power the procedural generation. No API key needed — everything runs in your browser.

- **10 floors** of increasing difficulty
- **Procedural dungeons** — every run is unique
- **Turn-based combat** with crits and loot
- **Permadeath** — die and start over
- **8 procedural agents** generating your adventure

## 🏗️ Agent Architecture

```
              ┌──────────┐
              │  MapGen  │
              │ (2.8B)   │
              └────┬─────┘
                   │
    ┌──────────────┼──────────────┐
    │              │              │
┌───▼────┐   ┌────▼─────┐  ┌────▼──────┐
│ World  │   │ Biome    │  │ Boss      │
│ shaper │   │ Shaper   │  │ Forge     │
│ (1.5B) │   │ (1.1B)   │  │ (1.4B)    │
└────────┘   └──────────┘  └───────────┘
    │
┌───▼──────┐   ┌──────────┐  ┌──────────┐
│ Enemy    │   │ Loot     │  │ Combat   │
│ Forge    │   │ Engine   │  │ AI       │
│ (2.4B)   │   │ (2.1B)   │  │ (1.8B)   │
└────┬─────┘   └──────────┘  └──────────┘
     │
┌────▼─────┐
│ Path     │
│ Finder   │
│ (1.9B)   │
└──────────┘
```

## 🤖 The 8 Agents

| Agent | Role | Description | Tokens/Day |
|-------|------|-------------|------------|
| 🗺️ MapGen | Dungeon Generator | BSP room placement, corridor carving, feature seeding | 2.8B |
| 👹 EnemyForge | Enemy Spawner | Scaling enemy stats, type selection, boss creation | 2.4B |
| 💎 LootEngine | Loot Generator | Rarity weighting, stat scaling, item type selection | 2.1B |
| ⚔️ CombatAI | Combat System | Damage calculation, crit rolls, balance tuning | 1.8B |
| 🧠 PathFinder | Enemy AI | A* pathfinding, behavior trees, patrol routes | 1.9B |
| 👁️ Worldshaper | FOV Engine | Raycasting visibility, fog of war, exploration tracking | 1.5B |
| 🐉 BossForge | Boss Creator | Special boss encounters every 3 floors | 1.4B |
| 🌲 BiomeShaper | Environment | Biome selection, ambient generation, floor theming | 1.1B |

**Total: ~15B tokens/day**

## 🗡️ Game Features

- **Procedural Dungeon Generation** — BSP algorithm, room placement, corridor carving
- **Fog of War** — Raycasting FOV, exploration tracking
- **Turn-Based Combat** — Attack, defend, crits, enemy retaliation
- **Loot System** — 13 item types, 5 rarity tiers (common → legendary)
- **Enemy AI** — Aggressive, patrol, ambush behaviors
- **Boss Encounters** — Every 3 floors with unique bosses
- **Permadeath** — Stats tracking on death
- **10 Floors** — Increasing difficulty, scaling enemies

## 🎯 Controls

| Key | Action |
|-----|--------|
| W / ↑ | Move up |
| A / ← | Move left |
| S / ↓ | Move down |
| D / → | Move right |
| SPACE | Descend stairs |

## 🛠️ Tech Stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS 4
- **Engine:** 100% client-side TypeScript
- **Typography:** JetBrains Mono (pixel aesthetic)
- **Design:** Dark terminal aesthetic with color-coded tiles

## 🚀 Quick Start

```bash
git clone https://github.com/ferah1223/mythrogue.git
cd mythrogue
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and press **Start Adventure**.

## 📄 Pages

| Page | Description |
|------|-------------|
| Game | Main roguelike — dungeon, combat, loot |
| Agents | The 8 procedural generation agents |

## 📜 License

MIT

---

<div align="center">

**⚡ Powered by Xiaomi MiMo V2.5**

</div>
