export type Point = { x: number; y: number };

export function arrowHeadPoints(from: Point, to: Point, headLength: number) {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  return {
    left: {
      x: to.x - headLength * Math.cos(angle - Math.PI / 6),
      y: to.y - headLength * Math.sin(angle - Math.PI / 6),
    },
    right: {
      x: to.x - headLength * Math.cos(angle + Math.PI / 6),
      y: to.y - headLength * Math.sin(angle + Math.PI / 6),
    },
  };
}