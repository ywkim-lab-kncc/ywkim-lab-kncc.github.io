// Geometry for the mitochondrial genome map on the home page (decorative).
// Gene coordinates: human mtDNA, revised Cambridge Reference Sequence (16,569 bp).
// You don't need to edit this file.
const LEN = 16569;
const genes = [
  { name: "D-loop", start: 16024, end: 576 + LEN, kind: "control" },
  { name: "12S", start: 648, end: 1601, kind: "rrna" },
  { name: "16S", start: 1671, end: 3229, kind: "rrna" },
  { name: "ND1", start: 3307, end: 4262, kind: "c1" },
  { name: "ND2", start: 4470, end: 5511, kind: "c1" },
  { name: "COX1", start: 5904, end: 7445, kind: "c4" },
  { name: "COX2", start: 7586, end: 8269, kind: "c4" },
  { name: "ATP8", start: 8366, end: 8572, kind: "c5", label: false },
  { name: "ATP6", start: 8573, end: 9207, kind: "c5" },
  { name: "COX3", start: 9207, end: 9990, kind: "c4" },
  { name: "ND3", start: 10059, end: 10404, kind: "c1" },
  { name: "ND4L", start: 10470, end: 10766, kind: "c1", label: false },
  { name: "ND4", start: 10760, end: 12137, kind: "c1" },
  { name: "ND5", start: 12337, end: 14148, kind: "c1" },
  { name: "ND6", start: 14149, end: 14673, kind: "c1", inner: true },
  { name: "CYTB", start: 14747, end: 15887, kind: "c3" },
];

const C = 200; // centre of a 400×400 viewBox
const toXY = (pos, r) => {
  const a = (pos / LEN) * 2 * Math.PI - Math.PI / 2;
  return [C + r * Math.cos(a), C + r * Math.sin(a)];
};
const f = (n) => n.toFixed(2);

function arc(start, end, r) {
  const [x1, y1] = toXY(start, r);
  const [x2, y2] = toXY(end, r);
  const large = end - start > LEN / 2 ? 1 : 0;
  return `M${f(x1)} ${f(y1)} A${r} ${r} 0 ${large} 1 ${f(x2)} ${f(y2)}`;
}

export default function () {
  const R_OUT = 150;
  const R_IN = 126;
  const segments = genes.map((g, i) => {
    const r = g.inner ? R_IN : R_OUT;
    const mid = (g.start + g.end) / 2;
    const [lx, ly] = toXY(mid, g.inner ? R_IN - 24 : R_OUT + 26);
    return {
      ...g,
      d: arc(g.start + 18, g.end - 18, r),
      lx: f(lx),
      ly: f(ly),
      showLabel: g.label !== false,
      len: ((g.end - g.start) / LEN) * 2 * Math.PI * r,
      delay: (i * 0.06).toFixed(2),
    };
  });
  // tick marks every 1 kb
  const ticks = [];
  for (let k = 0; k < LEN; k += 1000) {
    const [x1, y1] = toXY(k, 100);
    const [x2, y2] = toXY(k, k % 5000 === 0 ? 92 : 96);
    ticks.push({ x1: f(x1), y1: f(y1), x2: f(x2), y2: f(y2), major: k % 5000 === 0 });
  }
  return { length: LEN, segments, ticks, rOut: R_OUT, rIn: R_IN };
}
