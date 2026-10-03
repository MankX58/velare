import type { Metadata, Viewport } from "next";
import { Geist, Jost } from "next/font/google";
import { Toaster } from "sileo";
import { siteUrl } from "@/lib/site";
import "./globals.css";

// Geist: texto e interfaz. Jost: títulos, marca y etiquetas de producto.
const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const jost = Jost({ variable: "--font-jost", subsets: ["latin"] });

// Datos por defecto para buscadores y para la vista previa al compartir un enlace.
// Cada página puede poner su propio título y descripción.
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl), // con esto, las direcciones relativas (fotos, canonical) salen completas
  title: { default: "Velare · Perfumes internacionales en Colombia", template: "%s · Velare" },
  description: "Perfumes y lociones internacionales con envío en Colombia. Elige tu fragancia y paga por transferencia.",
  openGraph: { siteName: "Velare", locale: "es_CO", type: "website" },
};

// Color de la barra del navegador en el teléfono: el verde salvia de la marca (--color-brand).
export const viewport: Viewport = { themeColor: "#596357" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${geist.variable} ${jost.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-paper font-sans text-ink">
        {/* Lo primero que encuentra quien navega con teclado: salta la cabecera y va al contenido. */}
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-brand focus:px-4 focus:py-3 focus:text-sm focus:text-on-brand"
        >
          Saltar al contenido
        </a>
        {children}
        {/* Avisos (toasts) de toda la app. Se lanzan con sileo.success(...), sileo.error(...).
            Salen arriba al centro y duran 4 segundos. fill es el color del texto
            (--color-ink); la librería lo necesita como valor fijo. Los colores de
            cada tipo de aviso se ajustan en globals.css. */}
        <Toaster position="top-center" theme="light" options={{ fill: "#161d14", roundness: 6, duration: 4000 }} />
      </body>
    </html>
  );
}
