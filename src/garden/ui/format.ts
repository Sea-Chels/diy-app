/** Hands-on time: minutes below two hours, hours above. */
export function fmtTime([a, b]: [number, number]): string {
  if (b < 120) return a === b ? `${a} min` : `${a}–${b} min`;
  const hr = (m: number) => String(Math.round((m / 60) * 2) / 2);
  return a === b ? `${hr(a)} hr` : `${hr(a)}–${hr(b)} hr`;
}
