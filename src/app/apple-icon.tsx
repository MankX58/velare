import { ImageResponse } from "next/og";
import { LogoMark } from "@/components/logo-mark";

// Icono que usa el iPhone al guardar la tienda en la pantalla de inicio.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(<LogoMark size={130} />, size);
}
