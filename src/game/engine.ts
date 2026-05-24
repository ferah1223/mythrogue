// MythRogue Game Engine
// Procedural dungeon generation, combat, loot — 100% client-side

export type Tile = 'wall' | 'floor' | 'door' | 'stairs' | 'chest' | 'trap';
export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Position {
  x: number;
  y: number;
}

export interface Entity {
  id: string;
  name: string;
  icon: string;
  pos: Position;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  xp: number;
  type: 'enemy' | 'boss';
  behavior: 'aggressive' | 'patrol' | 'ambush';
}

export interface Item {
  id: string;
  name: string;
  icon: string;
  type: 'weapon' | 'armor' | 'potion' | 'scroll' | 'gold' | 'key';
  value: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  pos?: Position;
}

export interface Player {
  name: string;
  icon: string;
  pos: Position;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  level: number;
  xp: number;
  xpNext: number;
  gold: number;
  inventory: Item[];
  floor: number;
  kills: number;
}

export interface GameState {
  map: Tile[][];
  width: number;
  height: number;
  player: Player;
  enemies: Entity[];
  items: Item[];
  visible: boolean[][];
  explored: boolean[][];
  messages: Message[];
  turn: number;
  gameOver: boolean;
  gameWon: boolean;
}

export interface Message {
  text: string;
  type: 'info' | 'combat' | 'loot' | 'danger' | 'system';
  turn: number;
}

// ===== MAP GENERATION (MapGen Agent) =====

function createEmptyMap(w: number, h: number): Tile[][] {
  return Array.from({ length: h }, () => Array(w).fill('wall'));
}

interface Room {
  x: number;
  y: number;
  w: number;
  h: number;
  cx: number;
  cy: number;
}

function generateRooms(map: Tile[][], w: number, h: number, count: number): Room[] {
  const rooms: Room[] = [];
  for (let i = 0; i < count * 3; i++) {
    if (rooms.length >= count) break;
    const rw = 4 + Math.floor(Math.random() * 6);
    const rh = 4 + Math.floor(Math.random() * 5);
    const rx = 1 + Math.floor(Math.random() * (w - rw - 2));
    const ry = 1 + Math.floor(Math.random() * (h - rh - 2));

    const overlaps = rooms.some(
      (r) => rx < r.x + r.w + 1 && rx + rw + 1 > r.x && ry < r.y + r.h + 1 && ry + rh + 1 > r.y
    );
    if (overlaps) continue;

    for (let y = ry; y < ry + rh; y++) {
      for (let x = rx; x < rx + rw; x++) {
        map[y][x] = 'floor';
      }
    }
    rooms.push({ x: rx, y: ry, w: rw, h: rh, cx: Math.floor(rx + rw / 2), cy: Math.floor(ry + rh / 2) });
  }
  return rooms;
}

function connectRooms(map: Tile[][], rooms: Room[]) {
  for (let i = 1; i < rooms.length; i++) {
    const a = rooms[i - 1];
    const b = rooms[i];
    let x = a.cx;
    let y = a.cy;

    while (x !== b.cx) {
      if (x >= 0 && x < map[0].length && y >= 0 && y < map.length) {
        map[y][x] = 'floor';
      }
      x += x < b.cx ? 1 : -1;
    }
    while (y !== b.cy) {
      if (x >= 0 && x < map[0].length && y >= 0 && y < map.length) {
        map[y][x] = 'floor';
      }
      y += y < b.cy ? 1 : -1;
    }
  }
}

function addFeatures(map: Tile[][], rooms: Room[], floor: number) {
  // Add stairs in last room
  const lastRoom = rooms[rooms.length - 1];
  map[lastRoom.cy][lastRoom.cx] = 'stairs';

  // Add chests randomly
  const chestCount = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < chestCount; i++) {
    const room = rooms[1 + Math.floor(Math.random() * (rooms.length - 2))];
    if (!room) continue;
    const cx = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
    const cy = room.y + 1 + Math.floor(Math.random() * (room.h - 2));
    if (map[cy][cx] === 'floor') map[cy][cx] = 'chest';
  }

  // Add traps
  const trapCount = 1 + Math.floor(floor / 2);
  for (let i = 0; i < trapCount; i++) {
    const room = rooms[2 + Math.floor(Math.random() * (rooms.length - 2))];
    if (!room) continue;
    const tx = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
    const ty = room.y + 1 + Math.floor(Math.random() * (room.h - 2));
    if (map[ty][tx] === 'floor') map[ty][tx] = 'trap';
  }
}

export function generateDungeon(floor: number): { map: Tile[][]; rooms: Room[]; width: number; height: number } {
  const width = 48 + Math.min(floor * 2, 20);
  const height = 32 + Math.min(floor, 10);
  const map = createEmptyMap(width, height);
  const roomCount = 6 + Math.min(floor, 6);

  const rooms = generateRooms(map, width, height, roomCount);
  connectRooms(map, rooms);
  addFeatures(map, rooms, floor);

  return { map, rooms, width, height };
}

// ===== FOV / FOG OF WAR (Worldshaper Agent) =====

export function computeFOV(map: Tile[][], pos: Position, radius: number): boolean[][] {
  const h = map.length;
  const w = map[0].length;
  const visible = Array.from({ length: h }, () => Array(w).fill(false));

  for (let angle = 0; angle < 360; angle += 1) {
    const rad = (angle * Math.PI) / 180;
    const dx = Math.cos(rad);
    const dy = Math.sin(rad);

    for (let d = 0; d <= radius; d++) {
      const x = Math.round(pos.x + dx * d);
      const y = Math.round(pos.y + dy * d);

      if (x < 0 || x >= w || y < 0 || y >= h) break;
      visible[y][x] = true;
      if (map[y][x] === 'wall') break;
    }
  }

  return visible;
}

// ===== ENEMY SPAWNING (EnemyForge Agent) =====

const ENEMY_TYPES = [
  { name: 'Goblin', icon: '👺', baseHp: 8, baseAtk: 3, baseDef: 1, xp: 10, behavior: 'aggressive' as const },
  { name: 'Skeleton', icon: '💀', baseHp: 12, baseAtk: 4, baseDef: 2, xp: 15, behavior: 'patrol' as const },
  { name: 'Slime', icon: '🟢', baseHp: 6, baseAtk: 2, baseDef: 0, xp: 8, behavior: 'patrol' as const },
  { name: 'Orc', icon: '👹', baseHp: 18, baseAtk: 6, baseDef: 3, xp: 25, behavior: 'aggressive' as const },
  { name: 'Spider', icon: '🕷️', baseHp: 10, baseAtk: 5, baseDef: 1, xp: 12, behavior: 'ambush' as const },
  { name: 'Ghost', icon: '👻', baseHp: 14, baseAtk: 7, baseDef: 4, xp: 30, behavior: 'ambush' as const },
  { name: 'Troll', icon: '🧌', baseHp: 25, baseAtk: 8, baseDef: 5, xp: 40, behavior: 'aggressive' as const },
  { name: 'Wraith', icon: '😈', baseHp: 20, baseAtk: 9, baseDef: 6, xp: 50, behavior: 'ambush' as const },
];

const BOSSES = [
  { name: 'Goblin King', icon: '👑', hp: 50, atk: 10, def: 5, xp: 100 },
  { name: 'Bone Lord', icon: '☠️', hp: 70, atk: 12, def: 7, xp: 150 },
  { name: 'Shadow Beast', icon: '🌑', hp: 100, atk: 15, def: 9, xp: 250 },
  { name: 'Void Dragon', icon: '🐉', hp: 150, atk: 20, def: 12, xp: 500 },
];

export function spawnEnemies(rooms: Room[], floor: number): Entity[] {
  const enemies: Entity[] = [];
  const count = 4 + Math.floor(floor * 1.5);
  const typePool = ENEMY_TYPES.slice(0, Math.min(2 + floor, ENEMY_TYPES.length));

  for (let i = 0; i < count; i++) {
    const room = rooms[1 + Math.floor(Math.random() * (rooms.length - 1))];
    if (!room) continue;
    const type = typePool[Math.floor(Math.random() * typePool.length)];
    const scale = 1 + (floor - 1) * 0.2;

    enemies.push({
      id: `enemy-${i}`,
      name: type.name,
      icon: type.icon,
      pos: {
        x: room.x + 1 + Math.floor(Math.random() * (room.w - 2)),
        y: room.y + 1 + Math.floor(Math.random() * (room.h - 2)),
      },
      hp: Math.floor(type.baseHp * scale),
      maxHp: Math.floor(type.baseHp * scale),
      attack: Math.floor(type.baseAtk * scale),
      defense: Math.floor(type.baseDef * scale),
      xp: Math.floor(type.xp * scale),
      type: 'enemy',
      behavior: type.behavior,
    });
  }

  // Boss every 3 floors
  if (floor % 3 === 0) {
    const bossRoom = rooms[rooms.length - 1];
    const boss = BOSSES[Math.min(Math.floor(floor / 3) - 1, BOSSES.length - 1)];
    enemies.push({
      id: 'boss',
      name: boss.name,
      icon: boss.icon,
      pos: { x: bossRoom.cx + 1, y: bossRoom.cy },
      hp: boss.hp,
      maxHp: boss.hp,
      attack: boss.atk,
      defense: boss.def,
      xp: boss.xp,
      type: 'boss',
      behavior: 'aggressive',
    });
  }

  return enemies;
}

// ===== LOOT ENGINE (LootEngine Agent) =====

const LOOT_TABLE: Omit<Item, 'id' | 'pos'>[] = [
  { name: 'Health Potion', icon: '🧪', type: 'potion', value: 20, rarity: 'common' },
  { name: 'Iron Sword', icon: '🗡️', type: 'weapon', value: 5, rarity: 'common' },
  { name: 'Leather Armor', icon: '🛡️', type: 'armor', value: 3, rarity: 'common' },
  { name: 'Gold Coins', icon: '💰', type: 'gold', value: 25, rarity: 'common' },
  { name: 'Steel Blade', icon: '⚔️', type: 'weapon', value: 10, rarity: 'uncommon' },
  { name: 'Chain Mail', icon: '🛡️', type: 'armor', value: 7, rarity: 'uncommon' },
  { name: 'Greater Potion', icon: '🧪', type: 'potion', value: 50, rarity: 'uncommon' },
  { name: 'Enchanted Rapier', icon: '✨', type: 'weapon', value: 18, rarity: 'rare' },
  { name: 'Mithril Armor', icon: '💎', type: 'armor', value: 14, rarity: 'rare' },
  { name: 'Scroll of Fireball', icon: '📜', type: 'scroll', value: 30, rarity: 'rare' },
  { name: 'Vorpal Blade', icon: '🌟', type: 'weapon', value: 30, rarity: 'epic' },
  { name: 'Dragon Scale Mail', icon: '🐉', type: 'armor', value: 25, rarity: 'epic' },
  { name: 'Excalibur', icon: '⚡', type: 'weapon', value: 50, rarity: 'legendary' },
];

export function generateLoot(floor: number, pos: Position): Item {
  const rarityWeights: Record<string, number> = {
    common: 50,
    uncommon: 30 - floor * 2,
    rare: 15 + floor,
    epic: 4 + floor,
    legendary: 1 + Math.floor(floor / 3),
  };

  const totalWeight = Object.values(rarityWeights).reduce((a, b) => a + Math.max(1, b), 0);
  let roll = Math.random() * totalWeight;
  let rarity: Item['rarity'] = 'common';

  for (const [r, w] of Object.entries(rarityWeights)) {
    roll -= Math.max(1, w);
    if (roll <= 0) {
      rarity = r as Item['rarity'];
      break;
    }
  }

  const pool = LOOT_TABLE.filter((l) => l.rarity === rarity);
  const item = pool[Math.floor(Math.random() * pool.length)] || LOOT_TABLE[0];

  return {
    ...item,
    id: `loot-${Date.now()}-${Math.random()}`,
    pos,
  };
}

// ===== COMBAT (CombatMaster Agent) =====

export function calculateDamage(attackerAtk: number, defenderDef: number): number {
  const base = Math.max(1, attackerAtk - defenderDef);
  const variance = 0.8 + Math.random() * 0.4;
  const crit = Math.random() < 0.15 ? 2 : 1;
  return Math.floor(base * variance * crit);
}

// ===== ENEMY AI (PathFinder Agent) =====

export function moveEnemy(enemy: Entity, playerPos: Position, map: Tile[][]): Position {
  const dx = playerPos.x - enemy.pos.x;
  const dy = playerPos.y - enemy.pos.y;
  const dist = Math.abs(dx) + Math.abs(dy);

  if (enemy.behavior === 'patrol' && dist > 6) {
    // Random patrol
    const dirs = [
      { x: 0, y: -1 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
      { x: 1, y: 0 },
    ];
    const dir = dirs[Math.floor(Math.random() * dirs.length)];
    const nx = enemy.pos.x + dir.x;
    const ny = enemy.pos.y + dir.y;
    if (map[ny]?.[nx] === 'floor' || map[ny]?.[nx] === 'trap') {
      return { x: nx, y: ny };
    }
    return enemy.pos;
  }

  if (dist > 8) return enemy.pos;

  // Move toward player
  const moves: Position[] = [];
  if (dx > 0) moves.push({ x: enemy.pos.x + 1, y: enemy.pos.y });
  if (dx < 0) moves.push({ x: enemy.pos.x - 1, y: enemy.pos.y });
  if (dy > 0) moves.push({ x: enemy.pos.x, y: enemy.pos.y + 1 });
  if (dy < 0) moves.push({ x: enemy.pos.x, y: enemy.pos.y - 1 });

  for (const move of moves) {
    const tile = map[move.y]?.[move.x];
    if (tile === 'floor' || tile === 'trap') {
      return move;
    }
  }

  return enemy.pos;
}

// ===== XP / LEVELING =====

export function xpForLevel(level: number): number {
  return Math.floor(50 * Math.pow(1.5, level - 1));
}
