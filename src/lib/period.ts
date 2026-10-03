// Periodo elegido en el panel. Viaja en la dirección de la página:
//   ?periodo=2026      todo el año
//   ?periodo=2026-10   un mes
//   (vacío)            todo el tiempo
export type Period = {
  from: string | null; // primer día, incluido (aaaa-mm-dd). null = sin límite
  to: string | null; // el día siguiente al último: el periodo llega hasta justo antes
};

const monthName = new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric", timeZone: "UTC" });

// "2026-10" → "octubre de 2026"
export const monthLabel = (month: string) => monthName.format(new Date(`${month}-01T00:00:00Z`));

export function parsePeriod(value: string): Period {
  const match = /^(\d{4})(?:-(\d{2}))?$/.exec(value);
  const year = Number(match?.[1]);
  const month = match?.[2] ? Number(match[2]) : null;
  if (!match || (month !== null && (month < 1 || month > 12))) return { from: null, to: null };
  if (month === null) return { from: `${year}-01-01`, to: `${year + 1}-01-01` };

  // Después de diciembre sigue enero del año siguiente.
  const next = month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, "0")}`;
  return { from: `${value}-01`, to: `${next}-01` };
}
