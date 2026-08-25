/**
 * A tiny shared store for "how much of the film has arrived".
 * The film player writes to it; the loader reads from it.
 * Progress only ever moves forward, so the counter can never tick backwards.
 */
type Listener = (value: number) => void;

let value = 0;
const listeners = new Set<Listener>();

export function setLoadProgress(next: number) {
  const clamped = Math.max(0, Math.min(1, next));
  if (clamped <= value) return;
  value = clamped;
  listeners.forEach((listener) => listener(value));
}

export function onLoadProgress(listener: Listener) {
  listeners.add(listener);
  listener(value);
  return () => {
    listeners.delete(listener);
  };
}
