/**
 * A tiny shared store for "how much of the film has arrived".
 * The film player writes to it; the loader reads from it.
 * Progress only ever moves forward, so the counter can never tick backwards.
 */
type Listener = (value: number) => void;

let totalValue = 0;
const progressMap = new Map<string, number>();
const listeners = new Set<Listener>();

export function registerLoadTask(id: string) {
  if (!progressMap.has(id)) {
    progressMap.set(id, 0);
  }
}

export function setLoadProgress(next: number, id: string = 'default') {
  const clamped = Math.max(0, Math.min(1, next));
  const current = progressMap.get(id) || 0;
  if (clamped <= current) return;

  progressMap.set(id, clamped);

  let sum = 0;
  progressMap.forEach(val => sum += val);
  const newTotal = sum / Math.max(1, progressMap.size);

  if (newTotal > totalValue) {
    totalValue = newTotal;
    listeners.forEach((listener) => listener(totalValue));
  }
}

export function onLoadProgress(listener: Listener) {
  listeners.add(listener);
  listener(totalValue);
  return () => {
    listeners.delete(listener);
  };
}
