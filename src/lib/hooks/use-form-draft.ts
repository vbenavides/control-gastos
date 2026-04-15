"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Persists form state to sessionStorage so it survives navigation
 * to sub-flows (e.g. create category/account) and restores on return.
 *
 * Strategy:
 *   - Save: called on every state change via `saveDraft(state)`.
 *   - Restore: called on mount; returns saved state ONLY when
 *     `__returnPicker` is present in sessionStorage, meaning we are
 *     returning from a sub-flow (not opening the form fresh).
 *   - Clear: call `clearDraft()` after a successful submit so the
 *     next fresh open starts from defaults.
 */
export function useFormDraft<T>(key: string): {
  readDraft: () => T | null;
  saveDraft: (state: T) => void;
  clearDraft: () => void;
} {
  const storageKey = `__draft_${key}`;

  // Track whether this mount is a return-from-subflow.
  // We detect it ONCE at mount before __returnPicker gets consumed.
  const isReturnRef = useRef<boolean>(false);

  useEffect(() => {
    // __returnPicker is set by picker-sheets before navigating away.
    // It will still be present when we mount on return.
    isReturnRef.current = !!sessionStorage.getItem("__returnPicker");
  }, []);

  const readDraft = useCallback((): T | null => {
    if (!isReturnRef.current) return null;
    try {
      const raw = sessionStorage.getItem(storageKey);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }, [storageKey]);

  const saveDraft = useCallback(
    (state: T) => {
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(state));
      } catch {
        // sessionStorage full or unavailable — silent fail
      }
    },
    [storageKey],
  );

  const clearDraft = useCallback(() => {
    sessionStorage.removeItem(storageKey);
  }, [storageKey]);

  return { readDraft, saveDraft, clearDraft };
}
