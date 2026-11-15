// Geometry for the animated research illustrations (src/_includes/illustrations/).
// Deterministic so the drawings look the same on every build. No need to edit.

// small seeded random generator
function rng(seed) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}
const r1 = (n) => Math.round(n * 10) / 10;

// ---------- Genomics: sequencing reads piling up on a reference ----------
const READS = [
  [0, 24, 120], [0, 160, 110],
  [1, 52, 150], [1, 214, 80],
  [2, 30, 96], [2, 140, 120],
  [3, 90, 130], [3, 236, 60],
  [4, 20, 70], [4, 110, 104], [4, 226, 70],
  [5, 64, 140],
  [6, 150, 126],
  [7, 40, 112], [7, 168, 96],
];
const VARIANT_X = 196;
const VARIANT_ROWS = new Set([0, 2, 3, 5, 7]);
const reads = READS.map(([row, x, w], i) => {
  const covers = x <= VARIANT_X && VARIANT_X <= x + w - 8;
  return { x, w, y: 62 + row * 12, i, variant: covers && VARIANT_ROWS.has(row) };
});
const coverage = [];
for (let bx = 20; bx < 300; bx += 8) {
  const n = READS.filter(([, x, w]) => x <= bx + 4 && bx + 4 <= x + w).length;
  coverage.push({ x: bx + 1, h: n * 5, y: 52 - n * 5, i: coverage.length, hot: bx === VARIANT_X });
}
const refTicks = [];
for (let x = 20; x <= 300; x += 8) refTicks.push(x);

// ---------- Single cell: scattered cells settle into clusters ----------
const rand = rng(7);
const centres = [
  { x: 96, y: 112, c: "a" },
  { x: 204, y: 66, c: "b" },
  { x: 228, y: 146, c: "c" },
];
const cells = [];
for (let i = 0; i < 39; i++) {
  const k = centres[i % 3];
  const ang = rand() * Math.PI * 2;
  const rad = Math.sqrt(rand()) * (k.c === "a" ? 30 : 22);
  const cx = k.x + Math.cos(ang) * rad * 1.25;
  const cy = k.y + Math.sin(ang) * rad;
  const sx = 40 + rand() * 250;
  const sy = 24 + rand() * 150;
  cells.push({ cx: r1(cx), cy: r1(cy), dx: r1(sx - cx), dy: r1(sy - cy), c: k.c, i });
}

// ---------- Functional genomics: 8 × 4 well plate ----------
const rand2 = rng(11);
const wells = [];
for (let col = 0; col < 8; col++)
  for (let row = 0; row < 4; row++)
    wells.push({ col, row, cx: 72 + col * 25, cy: 92 + row * 22, v: r1(0.25 + rand2() * 0.75) });

// ---------- Wet lab: dividing cells in a dish ----------
const rand3 = rng(5);
const divisions = [];
const spots = [[130, 80], [178, 72], [112, 122], [160, 118], [204, 112], [146, 156], [192, 150]];
spots.forEach(([x, y], i) => {
  const ang = rand3() * Math.PI;
  divisions.push({ x, y, dx: r1(Math.cos(ang) * 8), dy: r1(Math.sin(ang) * 8), i });
});

// ---------- Mitochondrion: ATP particles leaving the organelle ----------
const particles = [
  [70, 52, -14, -26], [120, 42, -6, -30], [196, 42, 8, -30], [250, 54, 16, -24],
  [276, 100, 30, 0], [250, 148, 16, 24], [176, 158, 4, 30], [104, 156, -10, 28], [44, 100, -30, 0],
].map(([x, y, dx, dy], i) => ({ x, y, dx, dy, i }));

export default {
  genomics: { reads, coverage, refTicks, variantX: VARIANT_X },
  singlecell: { cells, centres },
  plate: { wells },
  dish: { divisions },
  mito: { particles },
};
