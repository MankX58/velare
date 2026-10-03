const cop = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
const percent = new Intl.NumberFormat("es-CO", { style: "percent", maximumFractionDigits: 1 });
const date = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

// `|| 0` convierte el cero negativo en cero, para que nunca aparezca "-$ 0".
export const formatCOP = (value: number) => cop.format(value || 0);
export const formatPercent = (value: number) => percent.format(value);

// "2026-10-02" → "2 oct 2026"
export const formatDate = (isoDate: string) => date.format(new Date(`${isoDate}T00:00:00Z`));

// Enlace para abrir un chat de WhatsApp con un mensaje ya escrito.
// wa.me pide el número solo con dígitos y con el indicativo del país.
// ponytail: a un número de 10 dígitos se le antepone 57 (Colombia). Si algún día
// se vende a otros países, pedir el indicativo en el formulario.
export function whatsappLink(phone: string, text: string) {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits.length === 10 ? `57${digits}` : digits}?text=${encodeURIComponent(text)}`;
}

// Fecha de hoy en Colombia como aaaa-mm-dd (el servidor corre en otra zona horaria).
export const todayInBogota = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());
