import { useEffect } from 'react';

/**
 * Single-key shortcut, ignored while the user types or holds a modifier.
 * `keys` accepts a comma list, e.g. 'e' or '?,/'.
 */
export function useHotkey(keys: string, handler: () => void, enabled = true): void {
  useEffect(() => {
    if (!enabled) return;
    const wanted = keys.toLowerCase().split(',');
    const onKey = (e: KeyboardEvent): void => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(input|textarea|select)$/i.test(t.tagName))) return;
      if (!wanted.includes(e.key.toLowerCase())) return;
      e.preventDefault();
      handler();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [keys, handler, enabled]);
}
