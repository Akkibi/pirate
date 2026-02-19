export const mapGenerator = (width: number, height: number, isOnPairTile = false): number[][] => {
  // Initialize all cells as walls (0 = dark)
  const maze: number[][] = Array.from({ length: height }, () => Array(width).fill(0));

  // We work on a grid where maze cells are at odd coordinates
  // and walls separate them
  const cellW = Math.floor((width - 1) / 2);
  const cellH = Math.floor((height - 1) / 2);

  if (cellW <= 0 || cellH <= 0) return maze;

  const visited: boolean[][] = Array.from({ length: cellH }, () => Array(cellW).fill(false));

  const directions = [
    [0, -1], // up
    [0, 1], // down
    [-1, 0], // left
    [1, 0], // right
  ];

  // Convert cell coords to maze coords
  const toMaze = (cx: number, cy: number): [number, number] => [cx * 2 + 1, cy * 2 + 1];

  // Starting cell
  const startCX = isOnPairTile ? 0 : Math.floor(Math.random() * cellW);
  const startCY = isOnPairTile ? 0 : Math.floor(Math.random() * cellH);

  visited[startCY][startCX] = true;
  const [sx, sy] = toMaze(startCX, startCY);
  maze[sy][sx] = 1;

  const activeList: [number, number][] = [[startCX, startCY]];

  while (activeList.length > 0) {
    // Pick from active list — mix of newest (recursive backtracker) and random (Prim's)
    const useNewest = Math.random() < 0.7;
    const index = useNewest ? activeList.length - 1 : Math.floor(Math.random() * activeList.length);
    const [cx, cy] = activeList[index];

    // Shuffle directions
    const shuffled = directions.slice().sort(() => Math.random() - 0.5);

    let carved = false;
    for (const [dx, dy] of shuffled) {
      const nx = cx + dx;
      const ny = cy + dy;

      if (nx >= 0 && nx < cellW && ny >= 0 && ny < cellH && !visited[ny][nx]) {
        visited[ny][nx] = true;

        // Carve the neighbor cell
        const [mx, my] = toMaze(nx, ny);
        maze[my][mx] = 1;

        // Carve the wall between current and neighbor
        const [curMx, curMy] = toMaze(cx, cy);
        maze[curMy + dy][curMx + dx] = 1;

        activeList.push([nx, ny]);
        carved = true;
        break;
      }
    }

    if (!carved) {
      activeList.splice(index, 1);
    }
  }

  return maze;
};
