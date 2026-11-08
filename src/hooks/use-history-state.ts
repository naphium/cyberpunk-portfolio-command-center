import { useCallback, useRef, useState } from "react";

export const HISTORY_LIMIT = 50;
const MERGE_WINDOW_MS = 700;

export interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

// Pure reducer helpers (exported for tests).
export function pushHistory<T>(s: HistoryState<T>, value: T, merge: boolean): HistoryState<T> {
  if (Object.is(value, s.present)) return s;
  if (merge && s.past.length) return { past: s.past, present: value, future: [] };
  return { past: [...s.past, s.present].slice(-HISTORY_LIMIT), present: value, future: [] };
}
export function undoHistory<T>(s: HistoryState<T>): HistoryState<T> {
  if (!s.past.length) return s;
  const prev = s.past[s.past.length - 1] as T;
  return { past: s.past.slice(0, -1), present: prev, future: [s.present, ...s.future].slice(0, HISTORY_LIMIT) };
}
export function redoHistory<T>(s: HistoryState<T>): HistoryState<T> {
  if (!s.future.length) return s;
  const [next, ...rest] = s.future;
  return { past: [...s.past, s.present].slice(-HISTORY_LIMIT), present: next as T, future: rest };
}

export function useHistoryState<T>(initial: T) {
  const [state, setState] = useState<HistoryState<T>>({ past: [], present: initial, future: [] });
  const lastEdit = useRef(0);

  const set = useCallback((fn: (prev: T) => T) => {
    const now = Date.now();
    const merge = now - lastEdit.current < MERGE_WINDOW_MS;
    lastEdit.current = now;
    setState((s) => pushHistory(s, fn(s.present), merge));
  }, []);

  const undo = useCallback(() => {
    lastEdit.current = 0;
    setState(undoHistory);
  }, []);
  const redo = useCallback(() => {
    lastEdit.current = 0;
    setState(redoHistory);
  }, []);
  const reset = useCallback((value: T) => {
    lastEdit.current = 0;
    setState({ past: [], present: value, future: [] });
  }, []);
  // Replace content but keep it undoable as one step (import, discard).
  const replace = useCallback((value: T) => {
    lastEdit.current = 0;
    setState((s) => pushHistory(s, value, false));
  }, []);

  return {
    present: state.present,
    set,
    undo,
    redo,
    reset,
    replace,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    undoCount: state.past.length,
  };
}
