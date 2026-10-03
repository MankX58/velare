// "Rasasi Hawas Ice EDP" → "rasasi-hawas-ice-edp". Es la dirección del producto en la tienda.
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita tildes
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
