"use client";

import { useState, useTransition } from "react";
import { sileo } from "sileo";
import { buttonStyles, linkStyles } from "@/components/button";
import { Field, fieldProps, inputStyles } from "@/components/field";
import { statusLabels, type OrderStatus } from "@/lib/orders";
import { useServerForm } from "@/lib/use-server-form";
import { confirmPayment, updateOrder } from "./actions";

// Confirmar el pago pide un segundo clic: es la decisión que mueve plata e inventario.
export function ConfirmPayment({ orderId }: { orderId: number }) {
  const [asking, setAsking] = useState(false);
  const [pending, startTransition] = useTransition();

  function confirm() {
    startTransition(async () => {
      const result = await confirmPayment(orderId);
      if (result.ok) sileo.success({ title: "Pago confirmado" });
      else sileo.error({ title: "No se pudo confirmar", description: result.message });
      setAsking(false);
    });
  }

  if (!asking) {
    return (
      <button type="button" onClick={() => setAsking(true)} className={`w-full ${buttonStyles.primary}`}>
        Confirmar pago recibido
      </button>
    );
  }
  return (
    <div className="flex flex-col gap-3 text-sm">
      <p className="font-medium">¿Ya viste la transferencia en tu banco?</p>
      <div className="flex items-center gap-4">
        <button type="button" onClick={confirm} disabled={pending} className={buttonStyles.primary}>
          {pending ? "Confirmando…" : "Sí, confirmar"}
        </button>
        <button type="button" onClick={() => setAsking(false)} disabled={pending} className={linkStyles.default}>
          Todavía no
        </button>
      </div>
    </div>
  );
}

// Estado, guía de envío y notas internas del pedido.
export function OrderForm({
  orderId,
  status,
  options,
  tracking,
  notes,
}: {
  orderId: number;
  status: OrderStatus;
  options: OrderStatus[]; // estados a los que puede pasar
  tracking: string | null;
  notes: string | null;
}) {
  const { state, pending, busy, handleSubmit } = useServerForm(updateOrder.bind(null, orderId), () => {
    sileo.success({ title: "Pedido actualizado" });
  });
  const errors = state.errors ?? {};

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {state.message && (
        <p role="alert" className="text-sm text-danger">
          {state.message}
        </p>
      )}
      {/* key: tras guardar, el selector vuelve a montarse con el estado nuevo. */}
      <Field label="Estado" name="status" error={errors.status}>
        <select key={status} {...fieldProps("status", errors.status)} defaultValue={status} className={`${inputStyles} h-11`}>
          <option value={status}>{statusLabels[status]}</option>
          {options.map((option) => (
            <option key={option} value={option}>
              Pasar a: {statusLabels[option]}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Guía de envío" name="tracking" error={errors.tracking} hint="Transportadora y número. El cliente la ve en su pedido.">
        <input {...fieldProps("tracking", errors.tracking)} defaultValue={tracking ?? ""} className={`${inputStyles} h-11`} />
      </Field>
      <Field label="Notas internas" name="admin_notes" error={errors.admin_notes} hint="Solo las ve el equipo.">
        <textarea
          {...fieldProps("admin_notes", errors.admin_notes)}
          rows={3}
          defaultValue={notes ?? ""}
          className={`${inputStyles} py-2.5 leading-relaxed`}
        />
      </Field>
      <button type="submit" disabled={busy} className={`self-start ${buttonStyles.secondary}`}>
        {pending ? "Guardando…" : "Guardar"}
      </button>
    </form>
  );
}
