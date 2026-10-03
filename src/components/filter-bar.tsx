"use client";

import { usePathname, useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { linkStyles } from "./button";
import { controlStyles } from "./field";

export type Filter = {
  name: string; // nombre del parámetro en la dirección, por ejemplo "stock"
  label: string; // texto de la opción vacía, por ejemplo "Todo el stock"
  options: { value: string; label: string }[];
};

// Búsqueda y filtros de una lista. Lo elegido se guarda en la dirección de la página
// (?q=hawas&stock=AGOTADO) y la página, en el servidor, lee esos parámetros para
// consultar la base de datos. Así el filtro se conserva al recargar o compartir el enlace.
export function FilterBar({
  placeholder,
  filters = [],
  values,
}: {
  placeholder: string;
  filters?: Filter[];
  values: Record<string, string>; // lo que está aplicado ahora mismo
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [current, setCurrent] = useState(values);
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // `delay` espera a que la persona deje de escribir antes de consultar.
  function apply(next: Record<string, string>, delay = 0) {
    setCurrent(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const query = new URLSearchParams(Object.entries(next).filter(([, value]) => value));
      startTransition(() => router.replace(`${pathname}?${query}`, { scroll: false }));
    }, delay);
  }

  const active = Object.values(current).some(Boolean);

  return (
    <div role="search" className="mb-6 flex flex-wrap items-center gap-3">
      <input
        type="search"
        aria-label={placeholder}
        placeholder={placeholder}
        value={current.q ?? ""}
        onChange={(event) => apply({ ...current, q: event.target.value }, 250)}
        className={`${controlStyles} h-11 min-w-56 flex-1`}
      />
      {filters.map((filter) => (
        <select
          key={filter.name}
          aria-label={filter.label}
          value={current[filter.name] ?? ""}
          onChange={(event) => apply({ ...current, [filter.name]: event.target.value })}
          className={`${controlStyles} h-11 max-w-full`}
        >
          <option value="">{filter.label}</option>
          {filter.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ))}
      {active && (
        <button type="button" onClick={() => apply({})} className={`text-sm ${linkStyles.default}`}>
          Limpiar
        </button>
      )}
      <span aria-live="polite" className="text-xs text-ink-faint">
        {pending && <span className="motion-safe:animate-skeleton">Buscando…</span>}
      </span>
    </div>
  );
}
