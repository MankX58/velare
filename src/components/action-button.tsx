"use client";

import { useTransition } from "react";
import { sileo } from "sileo";
import type { FormState } from "@/lib/form";
import { buttonStyles } from "./button";

// Botón que ejecuta una acción del servidor con un solo clic y avisa el resultado.
// Para pasos que avanzan algo (marcar como entregado). Lo que borra o cancela usa ConfirmButton.
export function ActionButton({
  action,
  label,
  successMessage,
  className = buttonStyles.primary,
}: {
  action: () => Promise<FormState>;
  label: string;
  successMessage: string;
  className?: string;
}) {
  const [pending, startTransition] = useTransition();

  function run() {
    startTransition(async () => {
      const result = await action();
      if (result.ok) sileo.success({ title: successMessage });
      else sileo.error({ title: "No se pudo completar", description: result.message });
    });
  }

  return (
    <button type="button" onClick={run} disabled={pending} className={className}>
      {pending ? "Un momento…" : label}
    </button>
  );
}
