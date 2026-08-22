export const MAX_EXHIBIT_TITLE_LENGTH = 40;

export function countExhibitTitleCharacters(value: string) {
  return [...value].length;
}
