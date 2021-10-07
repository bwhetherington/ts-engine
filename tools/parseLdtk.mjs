import fs from 'fs/promises';

async function parseLdtk(path) {
  const contents = await fs.readFile(path, 'utf-8');
  const json = JSON.parse(contents);

  const level = json.levels?.find((el) => el.identifier === 'Level_0');
  if (!level) {
    return;
  }

  // Determine grid size
  const pathingDef = json.defs?.layers?.find?.(
    (def) => def.identifier === 'Pathing'
  );
  if (!pathingDef) {
    return;
  }

  const {gridSize} = pathingDef;

  const pathing = level.layerInstances?.find(
    (layer) => layer.__identifier === 'Pathing'
  );

  if (!pathing) {
    return;
  }

  const {__cWid: cols, __cHei: rows} = pathing;

  const width = cols * gridSize;
  const height = rows * gridSize;
  const xOffset = -width / 2;
  const yOffset = -height / 2;

  const toRect = (index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    return {
      type: 'Rectangle',
      x: col * gridSize + xOffset + gridSize / 2,
      y: row * gridSize + yOffset + gridSize / 2,
      width: gridSize,
      height: gridSize,
    };
  };

  const rects = [];

  for (const {coordId: index, v} of pathing.intGrid) {
    if (v === 0) {
      const rect = toRect(index);
      rects.push(rect);
    }
  }

  return {
    friction: 1,
    boundingBox: {
      x: 0,
      y: 0,
      width: cols * gridSize,
      height: rows * gridSize,
    },
    geometry: rects,
  };
}

async function main() {
  const level = await parseLdtk('ignore/sprite-map.ldtk');
  const text = JSON.stringify(level, null, 2);
  await fs.writeFile('ignore/geometry.json', text);
}

main().catch(console.error);
