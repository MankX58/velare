import Link from "next/link";
import { linkStyles } from "./button";

// Encabezado de una página del panel: enlace para volver (opcional), título, acción principal
// y una frase que dice para qué sirve la página.
export function PageHeader({
  title,
  description,
  back,
  action,
  children,
}: {
  title: string;
  description?: string;
  back?: { href: string; label: string };
  action?: React.ReactNode;
  children?: React.ReactNode; // línea de resumen bajo el título
}) {
  return (
    <div className="mb-8">
      {back && (
        <Link href={back.href} className={`mb-4 inline-block text-sm text-ink-soft ${linkStyles.default}`}>
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl text-balance">{title}</h1>
        {action}
      </div>
      {description && <p className="mt-2 max-w-[70ch] text-sm leading-relaxed text-ink-soft">{description}</p>}
      {children}
    </div>
  );
}

// Lo que se muestra cuando la búsqueda o los filtros no dejan ningún resultado.
export function NoMatches({ what }: { what: string }) {
  return (
    <div className="border border-line bg-surface px-6 py-14">
      <h2 className="font-medium">Ningún {what} coincide</h2>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        Prueba con otra palabra o quita algún filtro con el botón Limpiar.
      </p>
    </div>
  );
}

// Dato pequeño con su nombre, para las líneas de resumen: "Inventario a costo  $ 117.648".
export function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-2">
      <dt className="text-xs text-ink-faint">{label}</dt>
      <dd className="text-sm tabular-nums">{children}</dd>
    </div>
  );
}
