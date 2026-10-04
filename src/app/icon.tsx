import { ImageResponse } from "next/og";
import { LogoMark } from "@/components/logo-mark";

// Icono de la pestaña del navegador y el que Google muestra junto al resultado
// (Google pide un cuadrado cuyo lado sea múltiplo de 48 px).
export const size = { width: 192, height: 192 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<LogoMark size={176} />, size);
}
