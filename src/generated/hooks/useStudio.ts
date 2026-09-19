import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { readTextFile, svgUrl } from '@generated/lib/exportFiles';
import type { Ornament } from '@generated/lib/geom';
import { randomSet, starterSet } from '@generated/lib/library';
import { extractColors } from '@generated/lib/palette';
import { DEFAULT_SETTINGS, generatePlacements, type Settings } from '@generated/lib/pattern';
import { CANVAS_PRESETS, loadJson, saveJson } from '@generated/lib/presets';
import { importSvgText } from '@generated/lib/svgImport';
import { buildTileSvg } from '@generated/lib/svgOut';
import { bumpName, proposeVariation, type Proposal } from '@generated/lib/variation';
import { useArchive } from '@generated/hooks/useArchive';

const KEY = 'ornamen-press.v1';
const MAX_ORN = 80;
const DEFAULT_PALETTE = ['#1f1b16', '#b4552d', '#dfa04a', '#7d8b63', '#3f5d62'];
const DEFAULT_NAME = 'seamless-ornamen-01';

type Persisted = { settings: Settings; palette: string[]; fileName: string };

export function useStudio() {
  const [ornaments, setOrnaments] = useState<Ornament[]>(() => starterSet());
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [palette, setPalette] = useState<string[]>(DEFAULT_PALETTE);
  const [fileName, setFileName] = useState(DEFAULT_NAME);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = loadJson<Persisted>(KEY, {
      settings: DEFAULT_SETTINGS,
      palette: DEFAULT_PALETTE,
      fileName: DEFAULT_NAME,
    });
    setSettings({ ...DEFAULT_SETTINGS, ...saved.settings });
    setPalette(Array.isArray(saved.palette) ? saved.palette : DEFAULT_PALETTE);
    setFileName(saved.fileName || DEFAULT_NAME);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveJson(KEY, { settings, palette, fileName });
  }, [hydrated, settings, palette, fileName]);

  const archive = useArchive(ornaments, settings, palette);

  const activeIds = useMemo(() => ornaments.map((o, i) => (o.on ? i : -1)).filter((i) => i >= 0), [ornaments]);

  const spec = useMemo(() => ({ ornaments, settings, palette }), [ornaments, settings, palette]);
  const deferred = useDeferredValue(spec);
  const rendering = deferred !== spec;

  const placements = useMemo(() => {
    const ids = deferred.ornaments.map((o, i) => (o.on ? i : -1)).filter((i) => i >= 0);
    return generatePlacements(ids, deferred.settings, deferred.palette);
  }, [deferred]);

  /** How many motifs actually straddle an edge — the seamless repeat is only exercised by these. */
  const edgeCount = useMemo(() => {
    const { wMm, hMm } = deferred.settings;
    return placements.filter((p) => {
      const r = (p.size * Math.SQRT2) / 2;
      return p.x - r < 0 || p.x + r > wMm || p.y - r < 0 || p.y + r > hMm;
    }).length;
  }, [placements, deferred.settings]);

  const tileSvg = useMemo(
    () =>
      buildTileSvg({
        ornaments: deferred.ornaments,
        placements,
        wMm: deferred.settings.wMm,
        hMm: deferred.settings.hMm,
        bg: deferred.settings.bg,
        recolor: deferred.settings.recolor === 'palette' && deferred.palette.length > 0,
      }),
    [deferred, placements],
  );

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  useEffect(() => {
    const url = svgUrl(tileSvg);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [tileSvg]);

  const patch = useCallback((next: Partial<Settings>) => setSettings((s) => ({ ...s, ...next })), []);

  const setCanvas = useCallback((id: string) => {
    const p = CANVAS_PRESETS.find((c) => c.id === id);
    setSettings((s) => (p ? { ...s, canvas: p.id, wMm: p.w, hMm: p.h } : { ...s, canvas: 'custom' }));
  }, []);

  const flipOrientation = useCallback(
    () => setSettings((s) => ({ ...s, wMm: s.hMm, hMm: s.wMm, canvas: s.wMm === s.hMm ? s.canvas : 'custom' })),
    [],
  );

  const reseed = useCallback(() => setSettings((s) => ({ ...s, seed: Math.floor(Math.random() * 99999) + 1 })), []);

  const addOrnaments = useCallback((list: Ornament[]) => {
    if (list.length) setOrnaments((prev) => [...prev, ...list].slice(0, MAX_ORN));
  }, []);

  const addSvgFiles = useCallback(async (files: File[]): Promise<{ added: number; failed: string[] }> => {
    const failed: string[] = [];
    const next: Ornament[] = [];
    for (const file of files) {
      try {
        next.push(importSvgText(await readTextFile(file), file.name));
      } catch (err) {
        console.error('Import SVG gagal', file.name, err);
        failed.push(file.name);
      }
    }
    if (next.length) setOrnaments((prev) => [...prev, ...next].slice(0, MAX_ORN));
    return { added: next.length, failed };
  }, []);

  const addStarters = useCallback(() => addOrnaments(starterSet()), [addOrnaments]);
  const addRandom = useCallback((n: number) => addOrnaments(randomSet(n)), [addOrnaments]);
  const toggleOrnament = useCallback(
    (id: string) => setOrnaments((prev) => prev.map((o) => (o.id === id ? { ...o, on: !o.on } : o))),
    [],
  );
  const removeOrnament = useCallback((id: string) => setOrnaments((prev) => prev.filter((o) => o.id !== id)), []);
  const clearOrnaments = useCallback(() => setOrnaments([]), []);

  const loadPaletteFile = useCallback(async (file: File): Promise<number> => {
    const colors = extractColors(await readTextFile(file));
    if (!colors.length) throw new Error('Tidak ada kode warna di berkas itu');
    setPalette(colors);
    setSettings((s) => ({ ...s, recolor: 'palette' }));
    return colors.length;
  }, []);

  const removeColor = useCallback((hex: string) => setPalette((p) => p.filter((c) => c !== hex)), []);
  const resetPalette = useCallback(() => setPalette(DEFAULT_PALETTE), []);

  /** Rolls a fresh design across motif mix, colourway, density and rotation at once. */
  const newVariation = useCallback((): Proposal | null => {
    if (!ornaments.length) return null;
    const p = proposeVariation(ornaments, settings, palette, archive.entries, archive.level);
    const on = new Set(p.onIds);
    setOrnaments((prev) => prev.map((o) => ({ ...o, on: on.has(o.id) })));
    setSettings(p.settings);
    setPalette(p.palette);
    return p;
  }, [ornaments, settings, palette, archive.entries, archive.level]);

  const afterExport = useCallback(
    (name: string) => {
      archive.record(name);
      setFileName((n) => bumpName(n));
    },
    [archive],
  );

  /** Deterministic rebuild of exactly what the preview shows, from the live (non-deferred) state. */
  const currentTile = useCallback(
    () => ({
      ornaments,
      settings,
      palette,
      placements: generatePlacements(activeIds, settings, palette),
      recolor: settings.recolor === 'palette' && palette.length > 0,
    }),
    [ornaments, settings, palette, activeIds],
  );

  return {
    ornaments,
    settings,
    palette,
    fileName,
    setFileName,
    activeCount: activeIds.length,
    placedCount: placements.length,
    edgeCount,
    rendering,
    previewUrl,
    archive,
    patch,
    setCanvas,
    flipOrientation,
    reseed,
    addSvgFiles,
    addStarters,
    addRandom,
    addOrnaments,
    toggleOrnament,
    removeOrnament,
    clearOrnaments,
    loadPaletteFile,
    removeColor,
    resetPalette,
    newVariation,
    afterExport,
    currentTile,
  };
}

export type Studio = ReturnType<typeof useStudio>;
