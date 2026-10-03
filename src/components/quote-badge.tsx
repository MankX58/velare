// Estado de una cotización, igual en la tienda y en el panel. No se guarda aparte:
// sale de si ya hay respuesta y de si esa respuesta trae precio.
export function QuoteBadge({ answered, price }: { answered: boolean; price: number | null }) {
  const [label, colors] = !answered
    ? ["Pendiente", "bg-warn-soft text-warn"]
    : price !== null
      ? ["Cotizado", "bg-ok-soft text-ok"]
      : ["No disponible", "bg-mist text-ink-soft"];

  return (
    <span className={`shrink-0 px-2 py-1 text-[11px] leading-none font-medium tracking-[0.08em] whitespace-nowrap uppercase ${colors}`}>
      {label}
    </span>
  );
}
