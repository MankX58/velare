"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { readForm, type FormState } from "@/lib/form";
import type { StoreSettings } from "@/lib/orders";

// Guarda los datos de pago y contacto que la tienda muestra a quien hace un pedido.
export async function saveStoreSettings(formData: FormData): Promise<FormState> {
  await requireAdmin();

  const form = readForm(formData);
  const settings: StoreSettings = {
    brebKey: form.text("brebKey", { max: 80 }) ?? "",
    holder: form.text("holder", { max: 80 }) ?? "",
    bank: form.text("bank", { max: 60 }) ?? "",
    // El número de WhatsApp se guarda solo con dígitos, como lo pide wa.me.
    whatsapp: (form.text("whatsapp", { max: 20 }) ?? "").replace(/\D/g, ""),
    shippingFee: form.money("shippingFee") ?? 0,
    qrImage: form.text("qrImage", { max: 120 }) ?? "",
  };
  // Solo se acepta una imagen de la carpeta public: nunca una dirección de otro sitio.
  if (settings.qrImage && !/^\/[\w./-]+\.(png|jpe?g|webp)$/i.test(settings.qrImage)) {
    form.errors.qrImage = "Escribe el nombre del archivo empezando con /. Ejemplo: /pago-qr.jpg";
  }
  if (form.hasErrors()) return { errors: form.errors };

  await sql`
    insert into settings (key, value) values ('store', ${JSON.stringify(settings)}::jsonb)
    on conflict (key) do update set value = excluded.value`;

  revalidatePath("/", "layout");
  return { ok: true };
}
