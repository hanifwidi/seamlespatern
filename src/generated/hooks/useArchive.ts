import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Ornament } from '@generated/lib/geom';
import type { Settings } from '@generated/lib/pattern';
import { loadJson, saveJson } from '@generated/lib/presets';
import { LIMIT, fingerprint, worstMatch, type HistEntry, type Level } from '@generated/lib/variation';

const KEY = 'ornamen-press.archive.v1';
const CAP = 240;

/**
 * Keeps the local archive of everything already exported and scores the live design
 * against it, so a set never ships two near-identical files.
 */
export function useArchive(ornaments: Ornament[], settings: Settings, palette: string[]) {
  const [entries, setEntries] = useState<HistEntry[]>([]);
  const [level, setLevel] = useState<Level>('normal');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = loadJson<{ items: HistEntry[]; level: Level }>(KEY, { items: [], level: 'normal' });
    setEntries(Array.isArray(saved.items) ? saved.items.slice(0, CAP) : []);
    if (saved.level === 'ketat' || saved.level === 'longgar' || saved.level === 'normal') setLevel(saved.level);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveJson(KEY, { items: entries, level });
  }, [hydrated, entries, level]);

  const print = useMemo(() => fingerprint(ornaments, settings, palette), [ornaments, settings, palette]);
  const match = useMemo(() => worstMatch(print, entries), [print, entries]);

  const record = useCallback(
    (name: string) => {
      setEntries((prev) => [{ name, at: Date.now(), fp: print }, ...prev.filter((e) => e.name !== name)].slice(0, CAP));
    },
    [print],
  );

  const forget = useCallback((at: number) => setEntries((prev) => prev.filter((e) => e.at !== at)), []);
  const clear = useCallback(() => setEntries([]), []);

  return {
    entries,
    level,
    setLevel,
    limit: LIMIT[level],
    score: match?.score ?? 0,
    rival: match?.name ?? null,
    record,
    forget,
    clear,
  };
}

export type Archive = ReturnType<typeof useArchive>;
