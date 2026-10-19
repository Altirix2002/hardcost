const MS_PER_DAY = 86_400_000;

/** Parst `YYYY-MM-DD` als lokales Datum (ohne Zeitzonen-Verschiebung). */
export function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
}

/** Formatiert ein Datum als `YYYY-MM-DD` (lokale Zeit). */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** Addiert Monate und klemmt auf das Monatsende (31. Jan + 1 Mt. = 28./29. Feb). */
export function addMonthsClamped(date: Date, months: number): Date {
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(date.getDate(), lastDay));
  return target;
}

/** Ganze Kalendertage von `reference` bis `date` (negativ = Vergangenheit). */
export function daysBetween(reference: Date, date: Date): number {
  return Math.round((startOfDay(date).getTime() - startOfDay(reference).getTime()) / MS_PER_DAY);
}
