const pad2 = (value: number) => String(value).padStart(2, "0");

export const formatBirthday = (date: Date) =>
  `${pad2(date.getDate())}.${pad2(date.getMonth() + 1)}.${date.getFullYear()}`;

export function parseBirthday(value: string): number | null {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  const now = new Date();
  if (date.getTime() > now.getTime()) return null;
  if (year < now.getFullYear() - 6) return null;
  return date.getTime();
}

export const BIRTHDAY_MIN_DATE = new Date(new Date().getFullYear() - 6, 0, 1);
