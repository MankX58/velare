// Lectura y validación de formularios en el servidor.
// Nunca se confía en lo que manda el navegador: cada acción vuelve a leer y validar aquí.

// Lo que una acción del servidor le responde al formulario.
export type FormState = {
  ok?: boolean;
  id?: number; // id del registro creado o actualizado
  message?: string; // error general, no ligado a un campo
  errors?: Record<string, string>; // error por campo
};

// Un parámetro de la dirección (?q=...) como texto limpio. Si falta o viene repetido, "".
export const queryText = (value: string | string[] | undefined) => (typeof value === "string" ? value.trim() : "");

const MAX_MONEY = 2_000_000_000; // tope de una columna integer en la base de datos

// "215.000", "$ 215.000" o "215000" → 215000. Devuelve null si no es un valor en pesos enteros.
export function parseMoney(raw: string): number | null {
  const text = raw.replace(/[$\s]/g, "");
  if (!/^(\d{1,3}(\.\d{3})+|\d+)$/.test(text)) return null;
  const value = Number(text.replace(/\./g, ""));
  return value <= MAX_MONEY ? value : null;
}

// Lector de un FormData. Cada método devuelve el valor limpio (o null si el campo
// viene vacío y no es obligatorio) y anota en `errors` lo que esté mal.
export function readForm(form: FormData) {
  const errors: Record<string, string> = {};
  const raw = (name: string) => String(form.get(name) ?? "").trim();

  function empty(name: string, required: boolean) {
    if (required) errors[name] = "Este campo es obligatorio.";
    return null;
  }

  return {
    errors,
    hasErrors: () => Object.keys(errors).length > 0,

    text(name: string, { required = false, max = 200 } = {}) {
      const value = raw(name);
      if (!value) return empty(name, required);
      if (value.length > max) errors[name] = `Máximo ${max} caracteres.`;
      return value;
    },

    integer(name: string, { required = false, min = 0, max = 1_000_000 } = {}) {
      const value = raw(name);
      if (!value) return empty(name, required);
      const number = Number(value);
      if (!Number.isInteger(number) || number < min || number > max) {
        errors[name] = `Escribe un número entero entre ${min} y ${max}.`;
        return null;
      }
      return number;
    },

    money(name: string, { required = false } = {}) {
      const value = raw(name);
      if (!value) return empty(name, required);
      const amount = parseMoney(value);
      if (amount === null) errors[name] = "Escribe un valor en pesos, sin decimales. Ejemplo: 215.000";
      return amount;
    },

    oneOf(name: string, options: string[], { required = false } = {}) {
      const value = raw(name);
      if (!value) return empty(name, required);
      if (!options.includes(value)) {
        errors[name] = "Elige una de las opciones de la lista.";
        return null;
      }
      return value;
    },

    // Fecha del campo <input type="date">: llega como aaaa-mm-dd.
    date(name: string, { required = false } = {}) {
      const value = raw(name);
      if (!value) return empty(name, required);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value))) {
        errors[name] = "La fecha no es válida.";
        return null;
      }
      return value;
    },

    checkbox: (name: string) => form.get(name) !== null,
  };
}
