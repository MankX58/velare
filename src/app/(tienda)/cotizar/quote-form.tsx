"use client";

import { useState } from "react";
import { sileo } from "sileo";
import { buttonStyles } from "@/components/button";
import { Field, fieldProps, inputStyles } from "@/components/field";
import { useServerForm } from "@/lib/use-server-form";
import { requestQuote } from "./actions";

const input = `${inputStyles} h-11`;

// Formulario para pedir el precio de un perfume que no está en el catálogo.
export function QuoteForm({ defaultPerfume, defaultPhone }: { defaultPerfume: string; defaultPhone: string }) {
  // Cuántas solicitudes se han enviado desde que se abrió la página. Es la `key` de los
  // campos del perfume: tras cada envío vuelven a montarse vacíos. El WhatsApp se conserva.
  const [sent, setSent] = useState(0);
  const { state, pending, busy, handleSubmit } = useServerForm(requestQuote, () => {
    sileo.success({ title: "Cotización enviada", description: "Verás la respuesta en esta página." });
    setSent((count) => count + 1);
  });
  const errors = state.errors ?? {};

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      {state.message && (
        <p role="alert" className="border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
          {state.message}
        </p>
      )}
      <Field label="¿Qué perfume buscas?" name="perfume" error={errors.perfume} hint="Nombre y marca, como aparecen en la caja.">
        <input
          key={sent}
          {...fieldProps("perfume", errors.perfume)}
          maxLength={120}
          defaultValue={sent === 0 ? defaultPerfume : ""}
          className={input}
        />
      </Field>
      <Field label="Detalles" name="details" error={errors.details} hint="Opcional. Tamaño, versión o cualquier pista que nos ayude a encontrarlo.">
        <textarea
          key={sent}
          {...fieldProps("details", errors.details)}
          rows={3}
          maxLength={500}
          className={`${inputStyles} py-2.5 leading-relaxed`}
        />
      </Field>
      <Field label="Tu WhatsApp" name="phone" error={errors.phone} hint="Por si necesitamos escribirte sobre tu cotización.">
        <input {...fieldProps("phone", errors.phone)} type="tel" autoComplete="tel" defaultValue={defaultPhone} className={input} />
      </Field>
      <button type="submit" disabled={busy} className={`self-start ${buttonStyles.primary}`}>
        {pending ? "Enviando…" : "Pedir cotización"}
      </button>
    </form>
  );
}
