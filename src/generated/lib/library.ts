import type { Ornament, Prim } from '@generated/lib/geom';
import { ornamentFromPrims } from '@generated/lib/svgImport';
import * as A from '@generated/lib/motifs-a';
import * as B from '@generated/lib/motifs-b';

export type LibCat = 'botani' | 'organik' | 'geometris' | 'etnik' | 'langit' | 'deko';

export const LIB_CATS: { id: LibCat; label: string }[] = [
  { id: 'botani', label: 'Botani' },
  { id: 'organik', label: 'Organik' },
  { id: 'geometris', label: 'Geometris' },
  { id: 'etnik', label: 'Etnik' },
  { id: 'langit', label: 'Langit' },
  { id: 'deko', label: 'Deko' },
];

export type LibItem = Ornament & { cat: LibCat };

type Recipe = { name: string; cat: LibCat; make: () => Prim[] };
const rec = (name: string, cat: LibCat, make: () => Prim[]): Recipe => ({ name, cat, make });

const RECIPES: Recipe[] = [
  // botani
  ...[5, 6, 8, 12].map((n) => rec(`rosette ${n}`, 'botani', () => A.rosette(n))),
  ...([[18, 4], [27, 6], [13, 3]] as const).map(([w, v], i) =>
    rec(`daun urat 0${i + 1}`, 'botani', () => A.leafVein(w, v)),
  ),
  ...[2, 3, 4].map((n) => rec(`tangkai ${n}`, 'botani', () => A.sprig(n, true))),
  ...[5, 7].map((n) => rec(`pakis ${n}`, 'botani', () => A.fern(n))),
  rec('tulip', 'botani', () => A.tulip()),
  ...[4, 6].map((n) => rec(`polong ${n}`, 'botani', () => A.seedPod(n))),
  ...[3, 5].map((n) => rec(`buni ${n}`, 'botani', () => A.berryBranch(n))),
  ...[6, 8].map((n) => rec(`gandum ${n}`, 'botani', () => A.wheat(n))),
  ...[5, 7].map((n) => rec(`palma ${n}`, 'botani', () => A.palmFan(n))),
  // organik
  ...([[7, 7], [19, 9], [33, 6]] as const).map(([s, l], i) =>
    rec(`bulir 0${i + 1}`, 'organik', () => A.blobShape(s, l)),
  ),
  ...([[5, 3], [11, 5]] as const).map(([s, n]) => rec(`kerikil ${n}`, 'organik', () => A.pebbles(s, n))),
  ...[2, 3].map((n) => rec(`ombak ${n}`, 'organik', () => A.squiggle(n))),
  ...[2.5, 3.5].map((n, i) => rec(`spiral 0${i + 1}`, 'organik', () => A.spiralCoil(n))),
  ...([[3, 3], [9, 5]] as const).map(([s, n]) => rec(`terazo ${n}`, 'organik', () => A.terrazzo(s, n))),
  ...[10, -6].map((n, i) => rec(`sapuan 0${i + 1}`, 'organik', () => A.brushStroke(n))),
  // geometris
  ...[2, 3, 4].map((n) => rec(`wajik lapis ${n}`, 'geometris', () => B.nestedDiamond(n))),
  ...[3, 4].map((n) => rec(`chevron ${n}`, 'geometris', () => B.chevron(n))),
  ...[true, false].map((v, i) => rec(`heksagon 0${i + 1}`, 'geometris', () => B.hexWeb(v))),
  ...[3, 4].map((n) => rec(`busur ${n}`, 'geometris', () => B.arcStack(n))),
  ...[3, 4].map((n) => rec(`kisi ${n}`, 'geometris', () => B.lattice(n))),
  ...[3, 5].map((n) => rec(`tangga ${n}`, 'geometris', () => B.stepPyramid(n))),
  // etnik
  rec('kawung', 'etnik', () => B.kawung()),
  ...[2, 3].map((n) => rec(`parang ${n}`, 'etnik', () => B.parang(n))),
  ...[6, 8].map((n) => rec(`ceplok ${n}`, 'etnik', () => B.ceplok(n))),
  ...[3, 5].map((n) => rec(`tumpal ${n}`, 'etnik', () => B.tumpal(n))),
  ...[2, 3].map((n) => rec(`mega mendung ${n}`, 'etnik', () => B.megaMendung(n))),
  ...[2, 3].map((n) => rec(`songket ${n}`, 'etnik', () => B.songket(n))),
  // langit
  rec('bulan bintang', 'langit', () => B.crescentStar()),
  ...[8, 12].map((n) => rec(`matahari ${n}`, 'langit', () => B.sunRays(n))),
  ...([[5, 5], [13, 7]] as const).map(([s, n]) => rec(`rasi ${n}`, 'langit', () => B.constellation(s, n))),
  ...[5, 6, 8].map((n) => rec(`bintang ${n}`, 'langit', () => B.starBurst(n))),
  // deko
  ...[4, 6].map((n) => rec(`kipas ${n}`, 'deko', () => B.decoFan(n))),
  ...[2, 3].map((n) => rec(`gapura ${n}`, 'deko', () => B.steppedArch(n))),
  ...[3, 4].map((n) => rec(`untaian ${n}`, 'deko', () => B.dangle(n))),
  rec('fleur', 'deko', () => B.deltaFleur()),
];

export const LIB_COUNT = RECIPES.length;

/** Builds every catalogue motif as a real vector ornament (inactive until added). */
export function libraryItems(): LibItem[] {
  const out: LibItem[] = [];
  for (const r of RECIPES) {
    try {
      out.push({ ...ornamentFromPrims(r.name, r.make()), cat: r.cat, on: false });
    } catch (err) {
      console.error('Motif bawaan gagal dibangun', r.name, err);
    }
  }
  return out;
}

function build(r: Recipe, on: boolean): Ornament {
  return { ...ornamentFromPrims(r.name, r.make()), on };
}

/** A spread of motifs from different categories — the studio's opening set. */
export function starterSet(): Ornament[] {
  const wanted = ['rosette 8', 'daun urat 02', 'tangkai 3', 'kawung', 'bintang 6', 'bulir 01', 'chevron 3', 'kipas 6'];
  return RECIPES.filter((r) => wanted.includes(r.name)).map((r) => build(r, true));
}

/** Random motif mix, spread across categories so a set never leans on one look. */
export function randomSet(count: number): Ornament[] {
  const byCat = new Map<LibCat, Recipe[]>();
  for (const r of RECIPES) byCat.set(r.cat, [...(byCat.get(r.cat) ?? []), r]);
  const cats = [...byCat.keys()].sort(() => Math.random() - 0.5);
  const out: Ornament[] = [];
  let guard = 0;
  while (out.length < count && guard < count * 8) {
    guard += 1;
    const cat = cats[out.length % cats.length];
    const pool = (cat ? byCat.get(cat) : undefined) ?? RECIPES;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    if (!pick || out.some((o) => o.name === pick.name)) continue;
    out.push(build(pick, true));
  }
  return out;
}
