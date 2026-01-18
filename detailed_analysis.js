const mapData = [
  [7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7],
  [7,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,7],
  [7,6,7,7,7,7,7,7,6,7,7,6,7,7,7,7,7,7,6,7],
  [7,6,7,6,6,6,6,6,6,6,7,6,6,6,6,6,6,7,6,7],
  [7,6,7,6,7,7,7,7,7,6,7,7,7,7,7,7,6,7,6,7],
  [7,6,7,6,7,6,6,6,6,6,6,6,6,6,6,7,6,7,6,7],
  [7,6,7,6,7,6,7,7,7,7,7,7,7,7,6,7,6,7,6,7],
  [7,6,6,6,7,6,7,6,6,6,6,6,6,7,6,7,6,6,6,7],
  [7,7,7,6,7,6,7,6,7,7,7,7,6,7,6,7,6,7,7,7],
  [7,6,6,6,7,6,7,6,7,6,6,7,6,7,6,6,6,6,6,7],
  [7,6,7,7,7,6,7,6,7,6,9,7,6,7,7,7,7,7,6,7],
  [7,6,6,6,6,6,7,6,6,6,6,6,6,7,6,6,6,6,6,7],
  [7,7,7,7,7,6,7,7,7,7,7,7,7,7,6,7,7,7,7,7],
  [7,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,7],
  [7,6,7,7,7,7,7,7,7,6,7,7,7,7,7,7,7,7,6,7],
  [7,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,7],
  [7,7,7,7,7,7,7,7,7,6,7,7,7,7,7,7,7,7,7,7],
  [7,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,7],
  [7,6,6,6,6,6,6,6,6,5,6,6,6,6,6,6,6,6,6,7],
  [7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7]
];

const START = { x: 9, y: 18 };
const GOAL = { x: 10, y: 10 };

function isWalkable(x, y) {
  if (x < 0 || x >= 20 || y < 0 || y >= 20) return false;
  const tile = mapData[y][x];
  return tile === 6 || tile === 9 || tile === 5;
}

// BFSで到達可能な領域をマーク
function getReachable() {
  const visited = new Set();
  const queue = [START];
  visited.add(`${START.x},${START.y}`);

  const directions = [
    { dx: 0, dy: -1 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 }
  ];

  while (queue.length > 0) {
    const current = queue.shift();

    for (const dir of directions) {
      const nx = current.x + dir.dx;
      const ny = current.y + dir.dy;
      const nkey = `${nx},${ny}`;

      if (!visited.has(nkey) && isWalkable(nx, ny)) {
        visited.add(nkey);
        queue.push({ x: nx, y: ny });
      }
    }
  }

  return visited;
}

const reachable = getReachable();

console.log("=== 詳細な壁配置分析 ===\n");

// 階段周辺の詳細な分析
console.log("エリアマップ (y行は上から順に表示):\n");
console.log("y\\x  0 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19");
console.log("-".repeat(62));

for (let y = 0; y < 20; y++) {
  let row = `${y.toString().padStart(2)} : `;
  for (let x = 0; x < 20; x++) {
    const tile = mapData[y][x];
    const key = `${x},${y}`;
    let symbol;

    if (x === GOAL.x && y === GOAL.y) {
      symbol = 'S';  // 階段
    } else if (x === START.x && y === START.y) {
      symbol = 'E';  // 入口
    } else if (tile === 7) {
      symbol = '█';  // 壁
    } else if (reachable.has(key)) {
      symbol = '□';  // 到達可能
    } else {
      symbol = '×';  // 孤立
    }

    row += symbol + ' ';
  }
  console.log(row);
}

console.log("\n凡例: S=階段(10,10), E=入口(9,18), █=壁, □=到達可能, ×=孤立");

// 孤立領域を特定
console.log("\n=== 孤立領域の特定 ===\n");

const isolated = [];
for (let y = 0; y < 20; y++) {
  for (let x = 0; x < 20; x++) {
    const tile = mapData[y][x];
    const key = `${x},${y}`;
    if ((tile === 6 || tile === 9) && !reachable.has(key)) {
      isolated.push({ x, y, type: tile === 9 ? '階段' : '床' });
    }
  }
}

console.log(`孤立したセル: ${isolated.length}個`);
if (isolated.length > 0) {
  isolated.slice(0, 20).forEach((cell, idx) => {
    console.log(`  ${idx + 1}. (${cell.x}, ${cell.y}) - ${cell.type}`);
  });
  if (isolated.length > 20) {
    console.log(`  ... 他 ${isolated.length - 20} 個`);
  }
}

// 階段周辺の壁のブロック箇所
console.log("\n=== 階段へのアクセスを遮断している壁 ===\n");

const goalX = GOAL.x;
const goalY = GOAL.y;

console.log(`階段の位置: (${goalX}, ${goalY})`);
console.log("直接隣接している壁:");

const surroundings = [
  { x: goalX, y: goalY - 1, dir: "北" },
  { x: goalX, y: goalY + 1, dir: "南" },
  { x: goalX - 1, y: goalY, dir: "西" },
  { x: goalX + 1, y: goalY, dir: "東" }
];

for (const s of surroundings) {
  const tile = mapData[s.y][s.x];
  const status = tile === 7 ? "壁" : (reachable.has(`${s.x},${s.y}`) ? "到達可能" : "孤立");
  console.log(`  ${s.dir}: (${s.x}, ${s.y}) = ${status}`);
}

// 階段に到達するまでの障壁を分析
console.log("\n=== 推奨される修正箇所 ===\n");

// y=12行目が完全に壁で遮断されているかチェック
console.log("y=12行目（階段と入口区域の間）:");
let wallCount = 0;
for (let x = 0; x < 20; x++) {
  const tile = mapData[12][x];
  if (tile === 7) {
    wallCount++;
    console.log(`  x=${x}: 壁`);
  }
}

console.log(`\nこの行に ${wallCount} 個の壁があります。`);
console.log("階段と下部領域を繋ぐために、y=12行目に開口部を作成することを推奨します。");

// 具体的な修正提案
console.log("\n修正案:");
console.log("  y=12, x=9 の壁(7)を床(6)に変更: mapData[12][9] = 6");
console.log("  または y=12, x=11 の壁(7)を床(6)に変更: mapData[12][11] = 6");
