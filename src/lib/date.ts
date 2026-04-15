const MONTHS_SHORT_ES = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
] as const;

type DateParts = {
  year: number;
  month: number;
  day: number;
};

function parseDateParts(value: string): DateParts | null {
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);

  if (isoMatch) {
    return {
      year: Number(isoMatch[1]),
      month: Number(isoMatch[2]),
      day: Number(isoMatch[3]),
    };
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

/**
 * Ordena transacciones: más reciente primero.
 * Mismo día → más recientemente ingresado primero (createdAt desc, luego posición en array invertida).
 */
export function sortTransactionsDesc<T extends { date: string; createdAt?: string }>(
  list: T[],
): T[] {
  return [...list].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    if (dateB !== dateA) return dateB - dateA;
    // Desempate: createdAt desc
    const ca = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const cb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return cb - ca;
  });
}

export function formatShortDateEs(value: string): string {
  const parts = parseDateParts(value);

  if (!parts) {
    return value;
  }

  return `${parts.day} ${MONTHS_SHORT_ES[parts.month - 1]} ${parts.year}`;
}
