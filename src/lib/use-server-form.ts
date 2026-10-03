"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import type { FormState } from "./form";

const noop = () => () => {};

// Conecta un <form> con una acción del servidor:
//   const { state, busy, handleSubmit } = useServerForm(guardar, (resultado) => { ... });
//   <form onSubmit={handleSubmit}> ... <button disabled={busy}>
// `state.errors` trae los errores por campo. Los campos conservan lo que el usuario
// escribió aunque el servidor devuelva errores.
export function useServerForm(
  action: (formData: FormData) => Promise<FormState>,
  onSuccess: (result: FormState) => void,
) {
  const [state, setState] = useState<FormState>({});
  const [pending, startTransition] = useTransition();
  // false en el servidor y mientras la página se activa en el navegador; true después.
  // Mientras sea false el botón queda bloqueado, para que el navegador no envíe el
  // formulario por su cuenta antes de que este código pueda atenderlo.
  const ready = useSyncExternalStore(noop, () => true, () => false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await action(formData);
      setState(result);
      if (result.ok) onSuccess(result);
    });
  }

  return { state, pending, busy: pending || !ready, handleSubmit };
}
