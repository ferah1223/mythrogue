"use client";

import Link from "next/link";

const agents = [
  { name: "MapGen", icon: "🗺️", role: "Dungeon Generator", desc: "BSP room placement, corridor carving, feature seeding", tokens: "2.8B", color: "#5dade2" },
  { name: "EnemyForge", icon: "👹", role: "Enemy Spawner", desc: "Scaling enemy stats, type selection, boss creation", tokens: "2.4B", color: "#dc143c" },
  { name: "LootEngine", icon: "💎", role: "Loot Generator", desc: "Rarity weighting, stat scaling, item type selection", tokens: "2.1B", color: "#f4d03f" },
  { name: "CombatAI", icon: "⚔️", role: "Combat System", desc: "Damage calculation, crit rolls, balance tuning", tokens: "1.8B", color: "#e67e22" },
  { name: "PathFinder", icon: "🧠", role: "Enemy AI", desc: "A* pathfinding, behavior trees, patrol routes", tokens: "1.9B", color: "#9b59b6" },
  { name: "Worldshaper", icon: "👁️", role: "FOV Engine", desc: "Raycasting visibility, fog of war, exploration tracking", tokens: "1.5B", color: "#2ecc71" },
  { name: "BossForge", icon: "🐉", role: "Boss Creator", desc: "Special boss encounters every 3 floors with unique abilities", tokens: "1.4B", color: "#e74c3c" },
  { name: "BiomeShaper", icon: "🌲", role: "Environment", desc: "Biome selection, ambient generation, floor theming", tokens: "1.1B", color: "#1abc9c" },
];

export default function AgentsPage() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-[#7c5cfc] tracking-wider">
                AI Agents
              </h1>
              <p className="text-sm text-[#6868a0] mt-1 font-[family-name:var(--font-mono)]">
                8 procedural generation agents — 15B tokens/day
              </p>
            </div>
            <Link href="/" className="btn-primary text-xs">
              ← Back to Game
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {agents.map((agent) => (
            <div key={agent.name} className="panel p-5">
              <div className="flex items-start gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded flex items-center justify-center text-lg"
                  style={{ background: `${agent.color}15`, border: `1px solid ${agent.color}30` }}
                >
                  {agent.icon}
                </div>
                <div>
                  <h3 className="font-bold text-sm">{agent.name}</h3>
                  <p className="text-[10px] text-[#6868a0] uppercase tracking-wider">{agent.role}</p>
                </div>
                <span className="ml-auto text-[11px] font-[family-name:var(--font-mono)]" style={{ color: agent.color }}>
                  {agent.tokens}/day
                </span>
              </div>
              <p className="text-xs text-[#8888a8]">{agent.desc}</p>
              <div className="mt-3 h-1 rounded-full bg-[rgba(60,60,100,0.2)] overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(parseFloat(agent.tokens) / 2.8) * 100}%`,
                    background: agent.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Architecture */}
        <div className="panel p-6 mt-8">
          <h3 className="font-bold text-sm mb-4 text-[#7c5cfc]">Agent Orchestration</h3>
          <pre className="font-[family-name:var(--font-mono)] text-[11px] text-[#6868a0] leading-relaxed whitespace-pre overflow-x-auto">
{`              ┌──────────┐
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
└──────────┘`}
          </pre>
        </div>

        <div className="text-center mt-8 text-[10px] text-[#484870] font-[family-name:var(--font-mono)]">
          ⚡ Powered by Xiaomi MiMo V2.5 — All agents run client-side
        </div>
      </div>
    </div>
  );
}
