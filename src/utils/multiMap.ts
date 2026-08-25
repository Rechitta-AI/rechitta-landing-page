/** v1's multiMap: piecewise-linear interpolation over breakpoints. */
export function multiMap(value: number, stops: number[], outputs: number[]): number {
  if (value <= stops[0]) return outputs[0];
  for (let i = 1; i < stops.length; i++) {
    if (value <= stops[i]) {
      const span = stops[i] - stops[i - 1];
      const p = span === 0 ? 0 : (value - stops[i - 1]) / span;
      return outputs[i - 1] + p * (outputs[i] - outputs[i - 1]);
    }
  }
  return outputs[outputs.length - 1];
}
