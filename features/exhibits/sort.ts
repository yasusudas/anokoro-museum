import type { ExhibitItem } from "./types";

function parseExhibitYear(year: string): number | null {
  const trimmedYear = year.trim();
  if (!/^\d{4}$/.test(trimmedYear)) return null;

  const parsedYear = Number(trimmedYear);
  return Number.isFinite(parsedYear) ? parsedYear : null;
}

export function sortExhibitsByYear(exhibits: readonly ExhibitItem[]): ExhibitItem[] {
  return [...exhibits].sort((left, right) => {
    const leftYear = parseExhibitYear(left.year);
    const rightYear = parseExhibitYear(right.year);

    if (leftYear === null && rightYear === null) return 0;
    if (leftYear === null) return 1;
    if (rightYear === null) return -1;
    return leftYear - rightYear;
  });
}
