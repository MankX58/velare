const cop = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
const percent = new Intl.NumberFormat("es-CO", { style: "percent", maximumFractionDigits: 1 });
const date = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export const formatCOP = (value: number) => cop.format(value);
export const formatPercent = (value: number) => percent.format(value);

// "2026-10-02" → "2 oct 2026"
export const formatDate = (isoDate: string) => date.format(new Date(`${isoDate}T00:00:00Z`));

// Fecha de hoy en Colombia como aaaa-mm-dd (el servidor corre en otra zona horaria).
export const todayInBogota = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());
