"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { sileo } from "sileo";
import { buttonStyles } from "@/components/button";
import { Field, fieldProps, inputStyles } from "@/components/field";
import { useServerForm } from "@/lib/use-server-form";
import { createMovement } from "./actions";

const input = `${inputStyles} h-11`;

// Qué significa cada tipo de movimiento, para quien no lleva contabilidad.
const types = {
  Gasto: "Dinero que gasta el negocio para funcionar: publicidad, empaques, envíos. No incluye la mercancía: eso va en Compras.",
  Aporte: "Dinero tuyo que metes al negocio.",
  Retiro: "Dinero que sacas del negocio para ti.",
};

export function MovementForm({
  categories,
  paymentMethods,
  today,
}: {
  categories: string[];
  paymentMethods: string[];
  today: string;
}) {
  const router = useRouter();
  const [type, setType] = useState<keyof typeof types>("Gasto");
  const { state, pending, busy, handleSubmit } = useServerForm(createMovement, () => {
    sileo.success({ title: `${type} registrado` });
    router.push("/admin/caja");
  });
  const errors = state.errors ?? {};

  return (
    <form onSubmit={handleSubmit} noValidate className="flex max-w-3xl flex-col gap-10">
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Tipo" name="type" error={errors.type} hint={types[type]} className="sm:col-span-2">
          <select
            {...fieldProps("type", errors.type)}
            value={type}
            onChange={(event) => setType(event.target.value as keyof typeof types)}
            className={input}
          >
            {Object.keys(types).map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </Field>
        <Field label="Fecha" name="date" error={errors.date}>
          <input {...fieldProps("date", errors.date)} type="date" defaultValue={today} className={input} />
        </Field>
        <Field label="Valor" name="amount" error={errors.amount} hint="En pesos, sin decimales.">
          <input {...fieldProps("amount", errors.amount)} inputMode="numeric" className={input} />
        </Field>

        {/* La categoría y el tipo de gasto solo aplican a los gastos. */}
        {type === "Gasto" && (
          <>
            <Field label="Categoría" name="category" error={errors.category}>
              <select {...fieldProps("category", errors.category)} defaultValue="" className={input}>
                <option value="">Sin categoría</option>
                {categories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </Field>
            <Field
              label="¿Fijo o variable?"
              name="kind"
              error={errors.kind}
              hint="Fijo: lo pagas vendas o no (internet, arriendo). Variable: depende de cuánto vendas (empaques, envíos)."
            >
              <select {...fieldProps("kind", errors.kind)} defaultValue="Variable" className={input}>
                <option>Variable</option>
                <option>Fijo</option>
              </select>
            </Field>
          </>
        )}

        <Field label={type === "Gasto" ? "Descripción" : "Concepto"} name="concept" error={errors.concept}>
          <input {...fieldProps("concept", errors.concept)} maxLength={200} className={input} />
        </Field>
        <Field label="Método de pago" name="method" error={errors.method}>
          <select {...fieldProps("method", errors.method)} defaultValue="" className={input}>
            <option value="">Sin definir</option>
            {paymentMethods.map((method) => (
              <option key={method}>{method}</option>
            ))}
          </select>
        </Field>
      </div>

      <div className="flex flex-wrap items-center gap-4 border-t border-line pt-8">
        <button type="submit" disabled={busy} className={buttonStyles.primary}>
          {pending ? "Registrando…" : `Registrar ${type.toLowerCase()}`}
        </button>
        <Link href="/admin/caja" className={buttonStyles.secondary}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
