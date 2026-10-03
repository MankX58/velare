"use client";

import Image from "next/image";
import { useRef, useTransition } from "react";
import { sileo } from "sileo";
import { buttonStyles, linkStyles } from "@/components/button";
import { ConfirmButton } from "@/components/confirm-button";
import { shrinkImage } from "@/lib/shrink-image";
import { addProductImage, removeProductImage, setMainImage } from "./actions";

// Fotos de un producto: se suben, se elige la principal y se quitan. Cada cambio se guarda al instante.
export function ProductImages({ productId, images }: { productId: number; images: string[] }) {
  const [pending, startTransition] = useTransition();
  const picker = useRef<HTMLInputElement>(null);

  function upload(file: File | undefined) {
    if (!file) return;
    startTransition(async () => {
      let photo: Blob;
      try {
        photo = await shrinkImage(file);
      } catch {
        sileo.error({ title: "No se pudo leer la imagen", description: "Usa una foto en JPG, PNG o WebP." });
        return;
      }
      const data = new FormData();
      data.set("image", photo, "foto.jpg");
      const result = await addProductImage(productId, data);
      if (result.ok) sileo.success({ title: "Foto agregada" });
      else sileo.error({ title: "No se pudo subir la foto", description: result.message });
    });
    // Se vacía el selector para poder elegir el mismo archivo otra vez si algo falló.
    if (picker.current) picker.current.value = "";
  }

  function makeMain(url: string) {
    startTransition(async () => {
      const result = await setMainImage(productId, url);
      if (result.ok) sileo.success({ title: "Foto principal cambiada" });
      else sileo.error({ title: "No se pudo cambiar", description: result.message });
    });
  }

  return (
    <section aria-labelledby="fotos" className="flex flex-col gap-6">
      <div>
        <h2 id="fotos" className="font-display text-xl">
          Fotos
        </h2>
        <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-ink-soft">
          La primera es la que se ve en el catálogo. Sin fotos, la tienda muestra la etiqueta con el nombre del perfume.
        </p>
      </div>

      {images.length > 0 && (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((url, index) => (
            <li key={url} className="flex flex-col gap-2">
              <div className="relative aspect-[4/5] overflow-hidden border border-line bg-surface">
                <Image src={url} alt={`Foto ${index + 1} del producto`} fill sizes="(min-width: 1024px) 14rem, 45vw" className="object-cover" />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-x-3 text-sm">
                {index === 0 ? (
                  <span className="py-2 text-ink-soft">Principal</span>
                ) : (
                  <button type="button" onClick={() => makeMain(url)} disabled={pending} className={linkStyles.default}>
                    Hacer principal
                  </button>
                )}
                <ConfirmButton
                  action={removeProductImage.bind(null, productId, url)}
                  label="Quitar"
                  question="¿Quitar?"
                  confirmLabel="Sí"
                  successMessage="Foto quitada"
                  failureTitle="No se pudo quitar"
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <div>
        {/* El selector de archivos real queda oculto; el botón lo abre. */}
        <input
          ref={picker}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => upload(event.target.files?.[0])}
          className="sr-only"
          id="foto"
          tabIndex={-1}
          aria-hidden
        />
        <button type="button" onClick={() => picker.current?.click()} disabled={pending} className={buttonStyles.secondary}>
          {pending ? "Subiendo…" : "Subir una foto"}
        </button>
        <p className="mt-2 text-xs leading-relaxed text-ink-faint">
          JPG, PNG o WebP. Se reduce sola antes de subir, así que puedes usar la foto tal como sale del teléfono.
        </p>
      </div>
    </section>
  );
}
