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

// パラメータ
const START = { x: 9, y: 18 };  // 入口
const GOAL = { x: 10, y: 10 };  // 階段

// マップセルのタイプ定義
const TILE_TYPES = {
  WALL: 7,
  FLOOR: 6,
  STAIRS: 9,
  ENTRANCE: 5
};

// 通行可能かどうかを判定
function isWalkable(x, y) {
  if (x < 0 || x >= 20 || y < 0 || y >= 20) return false;
  const tile = mapData[y][x];
  return tile === TILE_TYPES.FLOOR || tile === TILE_TYPES.STAIRS || tile === TILE_TYPES.ENTRANCE;
}

// BFS実装
function bfs(start, goal) {
  const queue = [{ x: start.x, y: start.y, path: [start] }];
  const visited = new Set();
  const key = `${start.x},${start.y}`;
  visited.add(key);

  const directions = [
    { dx: 0, dy: -1 },  // 上
    { dx: 0, dy: 1 },   // 下
    { dx: -1, dy: 0 },  // 左
    { dx: 1, dy: 0 }    // 右
  ];

  while (queue.length > 0) {
    const current = queue.shift();

    // ゴール到達判定
    if (current.x === goal.x && current.y === goal.y) {
      return {
        found: true,
        path: current.path,
        distance: current.path.length - 1
      };
    }

    // 隣接セルを探索
    for (const dir of directions) {
      const nx = current.x + dir.dx;
      const ny = current.y + dir.dy;
      const nkey = `${nx},${ny}`;

      if (!visited.has(nkey) && isWalkable(nx, ny)) {
        visited.add(nkey);
        queue.push({
          x: nx,
          y: ny,
          path: [...current.path, { x: nx, y: ny }]
        });
      }
    }
  }

  return {
    found: false,
    path: null,
    distance: -1,
    visitedCount: visited.size
  };
}

// 詳細な分析
function analyzeWalls() {
  const visited = new Set();

  // BFSで到達可能なセルをマーク
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

  // 階段の周りの壁を調査
  console.log("\n階段(10,10)の周囲分析:");
  const goalX = GOAL.x;
  const goalY = GOAL.y;

  for (let y = Math.max(0, goalY - 3); y <= Math.min(19, goalY + 3); y++) {
    let line = '';
    for (let x = Math.max(0, goalX - 3); x <= Math.min(19, goalX + 3); x++) {
      const tile = mapData[y][x];
      const key = `${x},${y}`;
      let symbol = '';
      if (x === goalX && y === goalY) {
        symbol = 'G'; // Goal
      } else if (tile === 7) {
        symbol = '█'; // 壁
      } else if (visited.has(key)) {
        symbol = '○'; // 到達可能な床
      } else {
        symbol = '×'; // 孤立した床
      }
      line += symbol + ' ';
    }
    console.log(line);
  }

  return visited;
}

// 解析実行
console.log("=== パスファインディング解析 ===\n");
console.log(`入口: (${START.x}, ${START.y})`);
console.log(`階段: (${GOAL.x}, ${GOAL.y})\n`);

const result = bfs(START, GOAL);

if (result.found) {
  console.log("✓ 到達可能です！\n");
  console.log(`パス長: ${result.distance} ステップ\n`);
  console.log("経路 (最初の10ステップ):");
  for (let i = 0; i < Math.min(10, result.path.length); i++) {
    const pos = result.path[i];
    console.log(`  Step ${i}: (${pos.x}, ${pos.y})`);
  }
  if (result.path.length > 10) {
    console.log(`  ... (${result.path.length - 10} ステップ省略)`);
    const last = result.path[result.path.length - 1];
    console.log(`  Step ${result.path.length - 1}: (${last.x}, ${last.y})`);
  }
} else {
  console.log("✗ 到達不可能です！\n");
  console.log(`到達できたセル数: ${result.visitedCount}\n`);

  const visited = analyzeWalls();

  console.log("\n凡例: G=階段, █=壁, ○=到達可能, ×=孤立");
}
