export function fmtMinutes([a, b]: [number, number]): string {
  return a === b ? `${a} min` : `${a}–${b} min`;
}

/** Like fmtMinutes, but in hours from two hours up. */
export function fmtTime([a, b]: [number, number]): string {
  if (b < 120) return fmtMinutes([a, b]);
  const hr = (m: number) => String(Math.round((m / 60) * 2) / 2);
  return a === b ? `${hr(a)} hr` : `${hr(a)}–${hr(b)} hr`;
}
