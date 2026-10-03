import type { Metadata } from "next";
import { Geist, Jost } from "next/font/google";
import { Toaster } from "sileo";
import "./globals.css";

// Geist: texto e interfaz. Jost: títulos, marca y etiquetas de producto.
const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const jost = Jost({ variable: "--font-jost", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Velare", template: "%s · Velare" },
  description: "Perfumes y lociones internacionales.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${geist.variable} ${jost.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-paper font-sans text-ink">
        {children}
        {/* Avisos (toasts) de toda la app. Se lanzan con sileo.success(...), sileo.error(...).
            Salen arriba al centro y duran 4 segundos. fill es el verde oscuro de la marca
            (--color-on-brand); la librería lo necesita como valor fijo. Los colores de
            cada tipo de aviso se ajustan en globals.css. */}
        <Toaster position="top-center" theme="light" options={{ fill: "#012415", roundness: 6, duration: 4000 }} />
      </body>
    </html>
  );
}
