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

console.log("=== 孤立領域の詳細分析 ===\n");

// 2つの到達可能領域を分析
function bfsReachable(start) {
  const visited = new Set();
  const queue = [start];
  visited.add(`${start.x},${start.y}`);

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

      if (!visited.has(nkey)) {
        const tile = mapData[ny] && mapData[ny][nx];
        if (nx >= 0 && nx < 20 && ny >= 0 && ny < 20 && (tile === 6 || tile === 9 || tile === 5)) {
          visited.add(nkey);
          queue.push({ x: nx, y: ny });
        }
      }
    }
  }

  return visited;
}

const reachableFromStart = bfsReachable(START);
const reachableFromGoal = bfsReachable(GOAL);

console.log(`入口から到達可能: ${reachableFromStart.size} セル`);
console.log(`階段から到達可能: ${reachableFromGoal.size} セル`);
console.log(`両方から到達可能: ${Array.from(reachableFromStart).filter(k => reachableFromGoal.has(k)).length} セル\n`);

// 障壁となっている壁を特定
console.log("=== 2つの領域を隔てる壁 ===\n");

const boundaries = [];
for (let y = 0; y < 20; y++) {
  for (let x = 0; x < 20; x++) {
    if (mapData[y][x] === 7) {  // 壁の場合
      const neighbors = [
        { x: x, y: y - 1 },
        { x: x, y: y + 1 },
        { x: x - 1, y: y },
        { x: x + 1, y: y }
      ];

      // この壁が2つの領域を隔てているか確認
      let hasReachableFromStart = false;
      let hasReachableFromGoal = false;

      for (const n of neighbors) {
        if (n.x >= 0 && n.x < 20 && n.y >= 0 && n.y < 20) {
          const key = `${n.x},${n.y}`;
          if (reachableFromStart.has(key)) hasReachableFromStart = true;
          if (reachableFromGoal.has(key)) hasReachableFromGoal = true;
        }
      }

      if (hasReachableFromStart && hasReachableFromGoal) {
        boundaries.push({ x, y });
      }
    }
  }
}

console.log(`2つの領域を隔てる壁: ${boundaries.length} 個\n`);

// 最優先の修正箇所
if (boundaries.length > 0) {
  console.log("修正候補（優先順位順）:");
  boundaries.slice(0, 10).forEach((pos, idx) => {
    console.log(`  ${idx + 1}. (${pos.x}, ${pos.y}) をデータ値6に変更`);
  });
}

// 各修正案をテスト
console.log("\n=== 修正案のテスト ===\n");

function testFix(x, y) {
  const testMap = mapData.map(row => [...row]);
  testMap[y][x] = 6;

  const testReachable = bfsReachable(START);

  function isWalkable(px, py) {
    if (px < 0 || px >= 20 || py < 0 || py >= 20) return false;
    const tile = testMap[py][px];
    return tile === 6 || tile === 9 || tile === 5;
  }

  const queue = [START];
  const visited = new Set();
  visited.add(`${START.x},${START.y}`);

  const directions = [
    { dx: 0, dy: -1 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 }
  ];

  while (queue.length > 0) {
    const current = queue.shift();

    if (current.x === GOAL.x && current.y === GOAL.y) {
      return { success: true, distance: visited.size };
    }

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

  return { success: false };
}

// 最初の5つの修正案をテスト
for (let i = 0; i < Math.min(5, boundaries.length); i++) {
  const pos = boundaries[i];
  const result = testFix(pos.x, pos.y);
  const status = result.success ? '✓ 成功' : '✗ 失敗';
  console.log(`修正案${i + 1}: (${pos.x}, ${pos.y}) → ${status}`);
}
