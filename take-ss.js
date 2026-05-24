const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const dir = '/home/shinya/mythrogue/public';

  // SS 1: Title screen
  console.log('SS 1: Title screen...');
  const p1 = await context.newPage();
  await p1.goto('http://localhost:3459', { waitUntil: 'networkidle', timeout: 30000 });
  await p1.waitForTimeout(2000);
  await p1.screenshot({ path: path.join(dir, 'ss-title.png') });
  console.log('Done');

  // SS 2: Click start and capture game
  console.log('SS 2: Game screen...');
  await p1.click('button');
  await p1.waitForTimeout(1500);
  // Move around a bit
  for (let i = 0; i < 5; i++) {
    await p1.keyboard.press('ArrowRight');
    await p1.waitForTimeout(100);
  }
  for (let i = 0; i < 3; i++) {
    await p1.keyboard.press('ArrowDown');
    await p1.waitForTimeout(100);
  }
  await p1.waitForTimeout(1000);
  await p1.screenshot({ path: path.join(dir, 'ss-game.png') });
  console.log('Done');

  // SS 3: Agents page
  console.log('SS 3: Agents page...');
  const p3 = await context.newPage();
  await p3.goto('http://localhost:3459/agents', { waitUntil: 'networkidle', timeout: 30000 });
  await p3.waitForTimeout(2000);
  await p3.screenshot({ path: path.join(dir, 'ss-agents.png') });
  console.log('Done');

  // SS 4: Agent build mockup
  console.log('SS 4: Agent build...');
  const p4 = await context.newPage();
  const html = `<!DOCTYPE html><html><head><style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0a0a0f; color: #c8c8d8; font-family: 'JetBrains Mono', monospace; padding: 24px; }
    .t { background: rgba(10,10,20,0.95); border: 1px solid rgba(60,60,100,0.3); border-radius: 8px; padding: 24px; max-width: 900px; margin: 0 auto; }
    .h { display: flex; gap: 8px; margin-bottom: 20px; }
    .d { width: 12px; height: 12px; border-radius: 50%; }
    .dr { background: #ff5f57; } .dy { background: #febc2e; } .dg { background: #28c840; }
    .l { margin: 5px 0; line-height: 1.8; font-size: 12px; }
    .p { color: #7c5cfc; } .c { color: #2ecc71; } .o { color: #6868a0; }
    .hl { color: #f4d03f; } .ok { color: #2ecc71; font-weight: 700; }
    .ag { color: #5dade2; font-weight: 700; }
    .b { text-align: center; margin-top: 20px; padding-top: 16px; border-top: 1px solid rgba(60,60,100,0.2); }
    .b span { color: #7c5cfc; font-weight: 800; font-size: 14px; }
  </style></head><body><div class="t">
    <div class="h"><div class="d dr"></div><div class="d dy"></div><div class="d dg"></div></div>
    <div class="l"><span class="p">❯ </span><span class="c">hermes create mythrogue --agents 8 --client-side</span></div>
    <div class="l"><span class="o">▸ Initializing MiMo V2.5 Procedural Engine...</span></div>
    <div class="l"><span class="ag">[MapGen]</span> <span class="o">BSP dungeon generator online — 2.8B/day</span></div>
    <div class="l"><span class="ag">[EnemyForge]</span> <span class="o">Enemy spawner online — 2.4B/day</span></div>
    <div class="l"><span class="ag">[LootEngine]</span> <span class="o">Loot generator online — 2.1B/day</span></div>
    <div class="l"><span class="ag">[CombatAI]</span> <span class="o">Combat system online — 1.8B/day</span></div>
    <div class="l"><span class="ag">[PathFinder]</span> <span class="o">Enemy AI online — 1.9B/day</span></div>
    <div class="l"><span class="ag">[Worldshaper]</span> <span class="o">FOV engine online — 1.5B/day</span></div>
    <div class="l"><span class="ag">[BossForge]</span> <span class="o">Boss creator online — 1.4B/day</span></div>
    <div class="l"><span class="ag">[BiomeShaper]</span> <span class="o">Environment online — 1.1B/day</span></div>
    <div class="l"><span class="o">▸ 100% client-side — no API key required</span></div>
    <div class="l"><span class="hl">▸ Procedural generation ready — 15B tokens/day simulated</span></div>
    <div class="l"><span class="o">▸ 10 floors, 13 loot types, 8 enemy types, 4 bosses</span></div>
    <div class="l"><span class="ok">✓ Build complete — 4.2s | All 8 agents operational</span></div>
    <div class="b"><span>⚡ Powered by Xiaomi MiMo V2.5</span></div>
  </div></body></html>`;
  await p4.setContent(html, { waitUntil: 'networkidle' });
  await p4.waitForTimeout(1000);
  await p4.screenshot({ path: path.join(dir, 'ss-build.png'), fullPage: true });
  console.log('Done');

  // SS 5: GitHub
  console.log('SS 5: GitHub...');
  const p5 = await context.newPage();
  await p5.goto('https://github.com/ferah1223/mythrogue', { waitUntil: 'networkidle', timeout: 30000 });
  await p5.waitForTimeout(3000);
  await p5.screenshot({ path: path.join(dir, 'ss-github.png') });
  console.log('Done');

  await browser.close();
  console.log('All 5 screenshots taken!');
})();
