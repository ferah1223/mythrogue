"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  generateDungeon,
  computeFOV,
  spawnEnemies,
  generateLoot,
  calculateDamage,
  moveEnemy,
  xpForLevel,
  type GameState,
  type Player,
  type Entity,
  type Item,
  type Message,
  type Tile,
  type Position,
} from "@/game/engine";

const VIEW_W = 32;
const VIEW_H = 22;
const FOV_RADIUS = 7;

function createPlayer(startPos: Position): Player {
  return {
    name: "Hero",
    icon: "🧙",
    pos: { ...startPos },
    hp: 30,
    maxHp: 30,
    attack: 6,
    defense: 3,
    level: 1,
    xp: 0,
    xpNext: 50,
    gold: 0,
    inventory: [],
    floor: 1,
    kills: 0,
  };
}

export default function GamePage() {
  const [game, setGame] = useState<GameState | null>(null);
  const [started, setStarted] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  const addMessage = useCallback(
    (msgs: Message[], text: string, type: Message["type"], turn: number) => {
      msgs.push({ text, type, turn });
    },
    []
  );

  const initGame = useCallback(() => {
    const { map, rooms, width, height } = generateDungeon(1);
    const startRoom = rooms[0];
    const player = createPlayer({ x: startRoom.cx, y: startRoom.cy });
    const enemies = spawnEnemies(rooms, 1);
    const items: Item[] = [];

    // Spawn initial loot in chests
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (map[y][x] === "chest") {
          items.push(generateLoot(1, { x, y }));
        }
      }
    }

    const visible = computeFOV(map, player.pos, FOV_RADIUS);
    const explored = visible.map((row) => [...row]);

    const messages: Message[] = [
      { text: "You descend into the dungeon...", type: "system", turn: 0 },
      { text: "The air is damp. You hear distant growling.", type: "info", turn: 0 },
    ];

    setGame({
      map,
      width,
      height,
      player,
      enemies,
      items,
      visible,
      explored,
      messages,
      turn: 0,
      gameOver: false,
      gameWon: false,
    });
    setStarted(true);
  }, []);

  const nextFloor = useCallback((state: GameState): GameState => {
    const nextFloorNum = state.player.floor + 1;
    if (nextFloorNum > 10) {
      return {
        ...state,
        gameWon: true,
        messages: [
          ...state.messages,
          { text: "🏆 You conquered the dungeon! Victory!", type: "system", turn: state.turn },
        ],
      };
    }

    const { map, rooms, width, height } = generateDungeon(nextFloorNum);
    const startRoom = rooms[0];
    const player = {
      ...state.player,
      pos: { x: startRoom.cx, y: startRoom.cy },
      floor: nextFloorNum,
    };
    const enemies = spawnEnemies(rooms, nextFloorNum);
    const items: Item[] = [];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (map[y][x] === "chest") {
          items.push(generateLoot(nextFloorNum, { x, y }));
        }
      }
    }

    const visible = computeFOV(map, player.pos, FOV_RADIUS);
    const explored = visible.map((row) => [...row]);

    return {
      ...state,
      map,
      width,
      height,
      player,
      enemies,
      items,
      visible,
      explored,
      messages: [
        ...state.messages,
        { text: `You descend to floor ${nextFloorNum}...`, type: "system", turn: state.turn },
      ],
    };
  }, []);

  const processTurn = useCallback(
    (dx: number, dy: number) => {
      if (!game || game.gameOver || game.gameWon) return;

      setGame((prev) => {
        if (!prev) return prev;
        const state = { ...prev };
        const msgs: Message[] = [...state.messages];
        state.turn += 1;

        const newX = state.player.pos.x + dx;
        const newY = state.player.pos.y + dy;

        // Bounds check
        if (newX < 0 || newX >= state.width || newY < 0 || newY >= state.height) return prev;

        const targetTile = state.map[newY][newX];

        // Wall
        if (targetTile === "wall") return prev;

        // Enemy collision
        const enemyIdx = state.enemies.findIndex(
          (e) => e.pos.x === newX && e.pos.y === newY
        );
        if (enemyIdx >= 0) {
          const enemy = { ...state.enemies[enemyIdx] };
          const dmg = calculateDamage(state.player.attack, enemy.defense);
          enemy.hp -= dmg;
          addMessage(msgs, `You hit ${enemy.name} for ${dmg} damage!`, "combat", state.turn);

          if (enemy.hp <= 0) {
            addMessage(msgs, `${enemy.name} defeated! +${enemy.xp} XP`, "loot", state.turn);
            state.player = {
              ...state.player,
              xp: state.player.xp + enemy.xp,
              kills: state.player.kills + 1,
            };

            // Level up
            if (state.player.xp >= state.player.xpNext) {
              state.player = {
                ...state.player,
                level: state.player.level + 1,
                xp: state.player.xp - state.player.xpNext,
                xpNext: xpForLevel(state.player.level + 1),
                maxHp: state.player.maxHp + 5,
                hp: state.player.hp + 5,
                attack: state.player.attack + 2,
                defense: state.player.defense + 1,
              };
              addMessage(msgs, `⬆ Level up! Now level ${state.player.level}!`, "system", state.turn);
            }

            // Drop loot
            if (Math.random() < 0.4) {
              const loot = generateLoot(state.player.floor, { x: newX, y: newY });
              state.items = [...state.items, loot];
            }

            state.enemies = state.enemies.filter((_, i) => i !== enemyIdx);
          } else {
            state.enemies = state.enemies.map((e, i) =>
              i === enemyIdx ? enemy : e
            );
          }

          // Enemy retaliation
          state.enemies.forEach((e) => {
            if (Math.abs(e.pos.x - state.player.pos.x) + Math.abs(e.pos.y - state.player.pos.y) <= 1) {
              const eDmg = calculateDamage(e.attack, state.player.defense);
              state.player = { ...state.player, hp: state.player.hp - eDmg };
              addMessage(msgs, `${e.name} hits you for ${eDmg}!`, "combat", state.turn);
            }
          });
        } else {
          // Move player
          state.player = { ...state.player, pos: { x: newX, y: newY } };

          // Stairs
          if (targetTile === "stairs") {
            addMessage(msgs, "You found the stairs! Press SPACE to descend.", "system", state.turn);
          }

          // Chest
          const chestIdx = state.items.findIndex(
            (i) => i.pos && i.pos.x === newX && i.pos.y === newY
          );
          if (chestIdx >= 0) {
            const item = state.items[chestIdx];
            if (item.type === "gold") {
              state.player = { ...state.player, gold: state.player.gold + item.value };
              addMessage(msgs, `Found ${item.value} gold!`, "loot", state.turn);
            } else if (item.type === "potion") {
              const heal = item.value;
              state.player = {
                ...state.player,
                hp: Math.min(state.player.maxHp, state.player.hp + heal),
                inventory: [...state.player.inventory, item],
              };
              addMessage(msgs, `Found ${item.name}! Healed ${heal} HP.`, "loot", state.turn);
            } else if (item.type === "weapon") {
              state.player = {
                ...state.player,
                attack: state.player.attack + item.value,
                inventory: [...state.player.inventory, item],
              };
              addMessage(msgs, `Equipped ${item.name}! +${item.value} ATK`, "loot", state.turn);
            } else if (item.type === "armor") {
              state.player = {
                ...state.player,
                defense: state.player.defense + item.value,
                inventory: [...state.player.inventory, item],
              };
              addMessage(msgs, `Equipped ${item.name}! +${item.value} DEF`, "loot", state.turn);
            } else {
              state.player = { ...state.player, inventory: [...state.player.inventory, item] };
              addMessage(msgs, `Found ${item.name}!`, "loot", state.turn);
            }
            state.items = state.items.filter((_, i) => i !== chestIdx);
          }

          // Trap
          if (targetTile === "trap") {
            const trapDmg = 3 + Math.floor(state.player.floor * 1.5);
            state.player = { ...state.player, hp: state.player.hp - trapDmg };
            state.map[newY][newX] = "floor";
            addMessage(msgs, `Trap! Took ${trapDmg} damage!`, "danger", state.turn);
          }

          // Enemy turns
          state.enemies = state.enemies.map((e) => {
            const dist = Math.abs(e.pos.x - state.player.pos.x) + Math.abs(e.pos.y - state.player.pos.y);
            if (dist <= 1) {
              const eDmg = calculateDamage(e.attack, state.player.defense);
              state.player = { ...state.player, hp: state.player.hp - eDmg };
              addMessage(msgs, `${e.name} hits you for ${eDmg}!`, "combat", state.turn);
              return e;
            }
            const newPos = moveEnemy(e, state.player.pos, state.map);
            return { ...e, pos: newPos };
          });
        }

        // FOV
        state.visible = computeFOV(state.map, state.player.pos, FOV_RADIUS);
        state.explored = state.explored.map((row, y) =>
          row.map((cell, x) => cell || state.visible[y][x])
        );

        // Death
        if (state.player.hp <= 0) {
          state.gameOver = true;
          addMessage(msgs, "💀 You have died...", "danger", state.turn);
        }

        // Descend stairs
        if (
          !state.gameOver &&
          state.map[state.player.pos.y][state.player.pos.x] === "stairs" &&
          dx === 0 && dy === 0
        ) {
          return nextFloor({ ...state, messages: msgs });
        }

        state.messages = msgs.slice(-50);
        return { ...state };
      });
    },
    [game, addMessage, nextFloor]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!game || game.gameOver || game.gameWon) return;

      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          e.preventDefault();
          processTurn(0, -1);
          break;
        case "ArrowDown":
        case "s":
        case "S":
          e.preventDefault();
          processTurn(0, 1);
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          e.preventDefault();
          processTurn(-1, 0);
          break;
        case "ArrowRight":
        case "d":
        case "D":
          e.preventDefault();
          processTurn(1, 0);
          break;
        case " ":
          e.preventDefault();
          if (
            game &&
            game.map[game.player.pos.y][game.player.pos.x] === "stairs"
          ) {
            setGame((prev) => (prev ? nextFloor(prev) : prev));
          }
          break;
      }
    },
    [game, processTurn, nextFloor]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [game?.messages]);

  const getTileDisplay = (tile: Tile, x: number, y: number): string => {
    if (game?.player.pos.x === x && game?.player.pos.y === y) return game.player.icon;
    const enemy = game?.enemies.find((e) => e.pos.x === x && e.pos.y === y);
    if (enemy) return enemy.icon;
    const item = game?.items.find((i) => i.pos?.x === x && i.pos?.y === y);
    if (item) return item.icon;
    switch (tile) {
      case "stairs": return "🪜";
      case "chest": return "📦";
      case "trap": return "·";
      default: return "";
    }
  };

  const getTileClass = (tile: Tile): string => {
    switch (tile) {
      case "wall": return "tile-wall";
      case "floor": return "tile-floor";
      case "stairs": return "tile-stairs";
      case "chest": return "tile-chest tile-loot";
      case "trap": return "tile-floor";
      case "door": return "tile-door";
      default: return "tile-floor";
    }
  };

  if (!started) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2 font-[family-name:var(--font-display)] text-[#7c5cfc] tracking-wider">
            MythRogue
          </h1>
          <p className="text-sm text-[#6868a0] mb-1 font-[family-name:var(--font-mono)]">
            Roguelike Dungeon Crawler
          </p>
          <p className="text-[10px] text-[#484870] mb-8 font-[family-name:var(--font-mono)]">
            Powered by Xiaomi MiMo V2.5 — 8 AI Agents
          </p>
          <button onClick={initGame} className="btn-primary text-sm">
            ▶ Start Adventure
          </button>
          <div className="mt-6 text-[10px] text-[#484870] font-[family-name:var(--font-mono)]">
            <p>WASD or Arrow Keys to move</p>
            <p>SPACE to descend stairs</p>
          </div>
        </div>
      </div>
    );
  }

  if (!game) return null;

  // Camera view
  const camX = Math.max(0, Math.min(game.player.pos.x - Math.floor(VIEW_W / 2), game.width - VIEW_W));
  const camY = Math.max(0, Math.min(game.player.pos.y - Math.floor(VIEW_H / 2), game.height - VIEW_H));

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[rgba(60,60,100,0.2)]">
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold text-[#7c5cfc] font-[family-name:var(--font-mono)]">
            MYTHROGUE
          </span>
          <span className="text-[10px] text-[#6868a0] font-[family-name:var(--font-mono)]">
            Floor {game.player.floor}/10
          </span>
        </div>
        <div className="flex items-center gap-4 text-[10px] text-[#6868a0] font-[family-name:var(--font-mono)]">
          <span>Turn {game.turn}</span>
          <span>⚔ {game.player.kills} kills</span>
          <span>⚡ Powered by MiMo V2.5</span>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Game area */}
        <div className="flex-1 flex flex-col">
          {/* Dungeon */}
          <div className="flex-1 flex items-center justify-center p-4">
            <div
              className="inline-grid"
              style={{
                gridTemplateColumns: `repeat(${VIEW_W}, 20px)`,
                gap: 0,
                border: "1px solid rgba(60,60,100,0.2)",
                borderRadius: "4px",
                overflow: "hidden",
              }}
            >
              {Array.from({ length: VIEW_H }).map((_, vy) =>
                Array.from({ length: VIEW_W }).map((_, vx) => {
                  const mx = camX + vx;
                  const my = camY + vy;
                  const isVisible = game.visible[my]?.[mx];
                  const isExplored = game.explored[my]?.[mx];
                  const tile = game.map[my]?.[mx] || "wall";
                  const isPlayer = game.player.pos.x === mx && game.player.pos.y === my;
                  const hasEnemy = game.enemies.some((e) => e.pos.x === mx && e.pos.y === my);

                  return (
                    <div
                      key={`${vy}-${vx}`}
                      className={`tile ${
                        !isVisible && !isExplored
                          ? "tile-fog"
                          : !isVisible
                          ? `tile-explored ${getTileClass(tile)}`
                          : isPlayer
                          ? "tile-floor player-tile"
                          : hasEnemy
                          ? "tile-floor"
                          : getTileClass(tile)
                      }`}
                    >
                      {isVisible || isExplored ? getTileDisplay(tile, mx, my) : ""}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Controls hint */}
          <div className="flex items-center justify-center gap-2 pb-3">
            <div className="flex items-center gap-1">
              <span className="control-key">W</span>
              <span className="control-key">A</span>
              <span className="control-key">S</span>
              <span className="control-key">D</span>
            </div>
            <span className="text-[10px] text-[#484870] mx-2">or Arrow Keys</span>
            <span className="control-key" style={{ width: "auto", padding: "0 8px" }}>SPACE</span>
            <span className="text-[10px] text-[#484870]">descend</span>
          </div>
        </div>

        {/* Right panel */}
        <div className="w-64 flex flex-col border-l border-[rgba(60,60,100,0.2)]">
          {/* Player stats */}
          <div className="panel">
            <div className="panel-header">
              {game.player.icon} {game.player.name} — Lv.{game.player.level}
            </div>
            <div className="p-3 space-y-3">
              {/* HP */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] text-[#6868a0]">HP</span>
                  <span className="text-[10px] font-[family-name:var(--font-mono)] text-[#dc143c]">
                    {game.player.hp}/{game.player.maxHp}
                  </span>
                </div>
                <div className="stat-bar">
                  <div
                    className="stat-bar-fill"
                    style={{
                      width: `${(game.player.hp / game.player.maxHp) * 100}%`,
                      background: "linear-gradient(90deg, #8b0000, #dc143c)",
                    }}
                  />
                </div>
              </div>
              {/* XP */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] text-[#6868a0]">XP</span>
                  <span className="text-[10px] font-[family-name:var(--font-mono)] text-[#f4d03f]">
                    {game.player.xp}/{game.player.xpNext}
                  </span>
                </div>
                <div className="stat-bar">
                  <div
                    className="stat-bar-fill"
                    style={{
                      width: `${(game.player.xp / game.player.xpNext) * 100}%`,
                      background: "linear-gradient(90deg, #6b3a00, #f4d03f)",
                    }}
                  />
                </div>
              </div>
              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-[9px] text-[#6868a0]">ATK</p>
                  <p className="text-sm font-bold font-[family-name:var(--font-mono)] text-[#dc143c]">
                    {game.player.attack}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] text-[#6868a0]">DEF</p>
                  <p className="text-sm font-bold font-[family-name:var(--font-mono)] text-[#5dade2]">
                    {game.player.defense}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] text-[#6868a0]">GOLD</p>
                  <p className="text-sm font-bold font-[family-name:var(--font-mono)] text-[#d4af37]">
                    {game.player.gold}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Enemies visible */}
          <div className="panel mt-1 flex-1 flex flex-col min-h-0">
            <div className="panel-header">Enemies Nearby</div>
            <div className="p-2 space-y-1 overflow-y-auto game-scroll" style={{ maxHeight: "120px" }}>
              {game.enemies
                .filter((e) => game.visible[e.pos.y]?.[e.pos.x])
                .map((e) => (
                  <div key={e.id} className="flex items-center justify-between text-[11px] px-2 py-1 rounded bg-[rgba(60,60,100,0.1)]">
                    <span>
                      {e.icon} {e.name}
                    </span>
                    <span className="font-[family-name:var(--font-mono)] text-[#dc143c]">
                      {e.hp}/{e.maxHp}
                    </span>
                  </div>
                ))}
              {game.enemies.filter((e) => game.visible[e.pos.y]?.[e.pos.x]).length === 0 && (
                <p className="text-[10px] text-[#484870] px-2">No enemies visible</p>
              )}
            </div>
          </div>

          {/* Inventory */}
          <div className="panel mt-1">
            <div className="panel-header">Inventory ({game.player.inventory.length})</div>
            <div className="p-2 space-y-0.5 overflow-y-auto game-scroll" style={{ maxHeight: "100px" }}>
              {game.player.inventory.length === 0 ? (
                <p className="text-[10px] text-[#484870] px-2">Empty</p>
              ) : (
                game.player.inventory.map((item, i) => (
                  <div key={i} className={`inv-item rarity-${item.rarity}`}>
                    <span>{item.icon}</span>
                    <span>{item.name}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Message log */}
          <div className="panel mt-1 flex-1 flex flex-col min-h-0">
            <div className="panel-header">Combat Log</div>
            <div
              ref={logRef}
              className="flex-1 p-2 overflow-y-auto game-scroll msg-log"
              style={{ maxHeight: "180px" }}
            >
              {game.messages.slice(-20).map((msg, i) => (
                <p key={i} className={`msg-${msg.type}`}>
                  {msg.type === "combat" && "⚔ "}
                  {msg.type === "loot" && "✨ "}
                  {msg.type === "danger" && "⚠ "}
                  {msg.type === "system" && "▸ "}
                  {msg.text}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Game Over overlay */}
      {(game.gameOver || game.gameWon) && (
        <div className="fixed inset-0 game-over-overlay flex items-center justify-center z-50">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4 font-[family-name:var(--font-display)]">
              {game.gameWon ? (
                <span className="text-[#f4d03f]">VICTORY!</span>
              ) : (
                <span className="text-[#dc143c]">GAME OVER</span>
              )}
            </h2>
            <div className="panel p-6 mb-6 text-left" style={{ minWidth: "300px" }}>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-[10px] text-[#6868a0]">Floor Reached</span>
                  <p className="font-bold font-[family-name:var(--font-mono)]">{game.player.floor}</p>
                </div>
                <div>
                  <span className="text-[10px] text-[#6868a0]">Level</span>
                  <p className="font-bold font-[family-name:var(--font-mono)]">{game.player.level}</p>
                </div>
                <div>
                  <span className="text-[10px] text-[#6868a0]">Kills</span>
                  <p className="font-bold font-[family-name:var(--font-mono)] text-[#dc143c]">{game.player.kills}</p>
                </div>
                <div>
                  <span className="text-[10px] text-[#6868a0]">Gold</span>
                  <p className="font-bold font-[family-name:var(--font-mono)] text-[#d4af37]">{game.player.gold}</p>
                </div>
                <div>
                  <span className="text-[10px] text-[#6868a0]">Turns</span>
                  <p className="font-bold font-[family-name:var(--font-mono)]">{game.turn}</p>
                </div>
                <div>
                  <span className="text-[10px] text-[#6868a0]">Items</span>
                  <p className="font-bold font-[family-name:var(--font-mono)]">{game.player.inventory.length}</p>
                </div>
              </div>
            </div>
            <button onClick={initGame} className="btn-primary">
              ▶ Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
