// export type TextColorRange = { start: number; end: number; color: string };

// export function applyTextColor(ranges: TextColorRange[], start: number, end: number, color: string): TextColorRange[] {
//   if (start >= end) return ranges;
//   const next = ranges.flatMap((range) => {
//     if (range.end <= start || range.start >= end) return [range];
//     return [
//       ...(range.start < start ? [{ ...range, end: start }] : []),
//       ...(range.end > end ? [{ ...range, start: end }] : []),
//     ];
//   });
//   if (color) next.push({ start, end, color });
//   return next.sort((a, b) => a.start - b.start);
// }

// export function updateTextColors(ranges: TextColorRange[], before: string, after: string): TextColorRange[] {
//   let start = 0;
//   while (start < before.length && start < after.length && before[start] === after[start]) start++;
//   let oldEnd = before.length;
//   let newEnd = after.length;
//   while (oldEnd > start && newEnd > start && before[oldEnd - 1] === after[newEnd - 1]) { oldEnd--; newEnd--; }
//   const delta = newEnd - oldEnd;
//   return ranges.flatMap((range) => {
//     if (range.end <= start) return [range];
//     if (range.start >= oldEnd) return [{ ...range, start: range.start + delta, end: range.end + delta }];
//     return [
//       ...(range.start < start ? [{ ...range, end: start }] : []),
//       ...(range.end > oldEnd ? [{ ...range, start: newEnd, end: range.end + delta }] : []),
//     ];
//   });
// }

// export function textColorSegments(content: string, ranges: TextColorRange[]) {
//   const segments: { text: string; color?: string }[] = [];
//   let cursor = 0;
//   for (const range of [...ranges].sort((a, b) => a.start - b.start)) {
//     const start = Math.max(cursor, range.start);
//     const end = Math.min(content.length, range.end);
//     if (start >= end) continue;
//     if (start > cursor) segments.push({ text: content.slice(cursor, start) });
//     segments.push({ text: content.slice(start, end), color: range.color });
//     cursor = end;
//   }
//   if (cursor < content.length) segments.push({ text: content.slice(cursor) });
//   return segments;
// }






import type { NoteColor, TextColorRange } from "@/types";

export type { TextColorRange } from "@/types";

export function applyTextColor(
  ranges: TextColorRange[],
  start: number,
  end: number,
  color: NoteColor | "",
): TextColorRange[] {
  if (start >= end) return ranges;

  const next = ranges.flatMap((range) => {
    if (range.end <= start || range.start >= end) {
      return [range];
    }

    return [
      ...(range.start < start ? [{ ...range, end: start }] : []),
      ...(range.end > end ? [{ ...range, start: end }] : []),
    ];
  });

  if (color) {
    next.push({ start, end, color });
  }

  return next.sort((a, b) => a.start - b.start);
}

export function updateTextColors(
  ranges: TextColorRange[],
  before: string,
  after: string,
): TextColorRange[] {
  let start = 0;

  while (
    start < before.length &&
    start < after.length &&
    before[start] === after[start]
  ) {
    start++;
  }

  let oldEnd = before.length;
  let newEnd = after.length;

  while (
    oldEnd > start &&
    newEnd > start &&
    before[oldEnd - 1] === after[newEnd - 1]
  ) {
    oldEnd--;
    newEnd--;
  }

  const delta = newEnd - oldEnd;

  return ranges.flatMap((range) => {
    if (range.end <= start) {
      return [range];
    }

    if (range.start >= oldEnd) {
      return [
        {
          ...range,
          start: range.start + delta,
          end: range.end + delta,
        },
      ];
    }

    return [
      ...(range.start < start ? [{ ...range, end: start }] : []),
      ...(range.end > oldEnd
        ? [{ ...range, start: newEnd, end: range.end + delta }]
        : []),
    ];
  });
}

export function textColorSegments(
  content: string,
  ranges: TextColorRange[],
): { text: string; color?: NoteColor }[] {
  const segments: { text: string; color?: NoteColor }[] = [];

  let cursor = 0;

  for (const range of [...ranges].sort((a, b) => a.start - b.start)) {
    const start = Math.max(cursor, range.start);
    const end = Math.min(content.length, range.end);

    if (start >= end) continue;

    if (start > cursor) {
      segments.push({ text: content.slice(cursor, start) });
    }

    segments.push({
      text: content.slice(start, end),
      color: range.color,
    });

    cursor = end;
  }

  if (cursor < content.length) {
    segments.push({ text: content.slice(cursor) });
  }

  return segments;
}