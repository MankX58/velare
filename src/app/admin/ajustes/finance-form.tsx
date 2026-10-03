"use client";

import { sileo } from "sileo";
import { buttonStyles } from "@/components/button";
import { Field, fieldProps, inputStyles } from "@/components/field";
import type { FinanceSettings } from "@/lib/finance";
import { percentText } from "@/lib/form";
import { useServerForm } from "@/lib/use-server-form";
import { saveFinanceSettings } from "./actions";

const input = `${inputStyles} h-11`;

// Parámetros que usan el resumen, la caja, los clientes y la calculadora de precios.
export function FinanceForm({ settings }: { settings: FinanceSettings }) {
  const { state, pending, busy, handleSubmit } = useServerForm(saveFinanceSettings, () => {
    sileo.success({ title: "Cuentas guardadas" });
  });
  const errors = state.errors ?? {};

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6 border-t border-line pt-10">
      <h2 className="font-display text-xl">Cuentas del negocio</h2>
      <div className="grid gap-6 sm:grid-cols-2">
        <Field
          label="Saldo inicial de caja"
          name="openingCash"
          error={errors.openingCash}
          hint="El dinero que tenías (efectivo, cuentas, Nequi) el día en que empezaste a registrar aquí."
        >
          <input {...fieldProps("openingCash", errors.openingCash)} inputMode="numeric" defaultValue={settings.openingCash} className={input} />
        </Field>
        <Field
          label="Meta de ventas del mes"
          name="monthlyGoal"
          error={errors.monthlyGoal}
          hint="El resumen la compara con lo vendido en el mes."
        >
          <input {...fieldProps("monthlyGoal", errors.monthlyGoal)} inputMode="numeric" defaultValue={settings.monthlyGoal} className={input} />
        </Field>
        <Field
          label="Margen deseado (%)"
          name="targetMargin"
          error={errors.targetMargin}
          hint="Parte del precio de venta que quieres ganar. Lo usa la calculadora de precios."
        >
          <input {...fieldProps("targetMargin", errors.targetMargin)} inputMode="decimal" defaultValue={percentText(settings.targetMargin)} className={input} />
        </Field>
        <Field
          label="Comisión de pago (%)"
          name="paymentFee"
          error={errors.paymentFee}
          hint="Lo que cobra el datáfono o la app. 0 si recibes por transferencia."
        >
          <input {...fieldProps("paymentFee", errors.paymentFee)} inputMode="decimal" defaultValue={percentText(settings.paymentFee)} className={input} />
        </Field>
        <Field label="IVA a cobrar (%)" name="vat" error={errors.vat} hint="0 si no eres responsable de IVA.">
          <input {...fieldProps("vat", errors.vat)} inputMode="decimal" defaultValue={percentText(settings.vat)} className={input} />
        </Field>
        <Field
          label="Días para reactivar a un cliente"
          name="reactivationDays"
          error={errors.reactivationDays}
          hint="Pasados estos días sin comprar, el cliente aparece como Reactivar."
        >
          <input {...fieldProps("reactivationDays", errors.reactivationDays)} inputMode="numeric" defaultValue={settings.reactivationDays} className={input} />
        </Field>
      </div>
      <div>
        <button type="submit" disabled={busy} className={buttonStyles.primary}>
          {pending ? "Guardando…" : "Guardar cuentas"}
        </button>
      </div>
    </form>
  );
}
