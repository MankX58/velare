"use client";

import { sileo } from "sileo";
import { buttonStyles } from "@/components/button";
import { Field, fieldProps, inputStyles } from "@/components/field";
import type { StoreSettings } from "@/lib/orders";
import { useServerForm } from "@/lib/use-server-form";
import { saveStoreSettings } from "./actions";

const input = `${inputStyles} h-11`;

export function SettingsForm({ settings }: { settings: StoreSettings }) {
  const { state, pending, busy, handleSubmit } = useServerForm(saveStoreSettings, () => {
    sileo.success({ title: "Ajustes guardados" });
  });
  const errors = state.errors ?? {};

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-12">
      <section className="flex flex-col gap-6">
        <h2 className="font-display text-xl">Datos para recibir pagos</h2>
        <p className="-mt-3 max-w-[60ch] text-sm leading-relaxed text-ink-soft">
          Es lo que ve el cliente después de hacer un pedido, junto con el valor exacto a pagar.
        </p>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Llave Bre-B o número de Nequi" name="brebKey" error={errors.brebKey}>
            <input {...fieldProps("brebKey", errors.brebKey)} defaultValue={settings.brebKey} className={input} />
          </Field>
          <Field label="Titular de la cuenta" name="holder" error={errors.holder}>
            <input {...fieldProps("holder", errors.holder)} defaultValue={settings.holder} className={input} />
          </Field>
          <Field label="Banco o billetera" name="bank" error={errors.bank} hint="Ejemplo: Nequi, Bancolombia.">
            <input {...fieldProps("bank", errors.bank)} defaultValue={settings.bank} className={input} />
          </Field>
          <Field
            label="Imagen del QR de pago"
            name="qrImage"
            error={errors.qrImage}
            hint="Nombre del archivo guardado en la carpeta public del proyecto. Ejemplo: /pago-qr.jpg. Vacío = no se muestra QR."
          >
            <input {...fieldProps("qrImage", errors.qrImage)} defaultValue={settings.qrImage} className={input} />
          </Field>
        </div>
      </section>

      <section className="flex flex-col gap-6 border-t border-line pt-10">
        <h2 className="font-display text-xl">Contacto y envío</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field
            label="WhatsApp de la tienda"
            name="whatsapp"
            error={errors.whatsapp}
            hint="Con indicativo del país. Ejemplo: 57 300 123 4567."
          >
            <input {...fieldProps("whatsapp", errors.whatsapp)} type="tel" defaultValue={settings.whatsapp} className={input} />
          </Field>
          <Field
            label="Costo de envío"
            name="shippingFee"
            error={errors.shippingFee}
            hint="Valor fijo que se suma a cada pedido. Con 0, el envío se coordina aparte con el cliente."
          >
            <input
              {...fieldProps("shippingFee", errors.shippingFee)}
              inputMode="numeric"
              defaultValue={settings.shippingFee}
              className={input}
            />
          </Field>
        </div>
      </section>

      <div className="border-t border-line pt-8">
        <button type="submit" disabled={busy} className={buttonStyles.primary}>
          {pending ? "Guardando…" : "Guardar ajustes"}
        </button>
      </div>
    </form>
  );
}
