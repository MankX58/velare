"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { sileo } from "sileo";
import type { FormState } from "@/lib/form";
import { linkStyles } from "./button";

// Botón para acciones que no se pueden deshacer. El primer clic pregunta; el segundo ejecuta.
export function ConfirmButton({
  action,
  label,
  question,
  successMessage,
  redirectTo,
}: {
  action: () => Promise<FormState>;
  label: string;
  question: string;
  successMessage: string;
  redirectTo?: string;
}) {
  const [asking, setAsking] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function confirm() {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        sileo.success({ title: successMessage });
        if (redirectTo) router.push(redirectTo);
      } else {
        sileo.error({ title: "No se pudo eliminar", description: result.message });
        setAsking(false);
      }
    });
  }

  if (!asking) {
    return (
      <button type="button" onClick={() => setAsking(true)} className={`text-sm ${linkStyles.danger}`}>
        {label}
      </button>
    );
  }

  return (
    <span className="inline-flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-sm">
      <span className="text-ink-soft">{question}</span>
      <button type="button" onClick={confirm} disabled={pending} className={linkStyles.danger}>
        {pending ? "Eliminando…" : "Sí, eliminar"}
      </button>
      <button type="button" onClick={() => setAsking(false)} disabled={pending} className={linkStyles.default}>
        No
      </button>
    </span>
  );
}
