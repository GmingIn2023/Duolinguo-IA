/**
 * How far a mascot's eyes move toward the pointer, in SVG user units.
 * The eyes lean in the pointer's direction and never leave `max`; they reach full lean at `reach` px away
 * and ease off closer, so a pointer resting on the mascot does not make it cross-eyed.
 */
export function gazeOffset(dx: number, dy: number, max = 2.2, reach = 160): { x: number; y: number } {
  const distance = Math.hypot(dx, dy);
  if (distance === 0) return { x: 0, y: 0 };
  const lean = Math.min(1, distance / reach) * max;
  return { x: Number(((dx / distance) * lean).toFixed(2)), y: Number(((dy / distance) * lean).toFixed(2)) };
}
