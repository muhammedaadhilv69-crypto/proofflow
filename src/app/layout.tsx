import type { Metadata } from "next";
import { Archivo, Archivo_Narrow, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

/**
 * One superfamily in two widths, plus a mono.
 *
 * Archivo carries interface and headings because its squarish, slightly
 * newspaper grotesque suits a product about printed approval. Archivo Narrow
 * does the identifier work — table heads, nav, state words — because a narrow
 * cut stays legible small without resorting to capitals. IBM Plex Mono is
 * reserved for the slug line and the things a slug line holds: version
 * numbers, approval numbers, timestamps, file facts.
 *
 * There is deliberately no serif. This is instrument software, not editorial,
 * and a display serif was pulling the whole product toward the generic
 * high-contrast-SaaS look.
 */
const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
});

const archivoNarrow = Archivo_Narrow({
  subsets: ["latin"],
  variable: "--font-archivo-narrow",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ProofFlow — client proofing and approval",
    template: "%s · ProofFlow",
  },
  description:
    "Send clients a review link for a specific version, collect comments, and lock a permanent record of what they approved.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${archivoNarrow.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        {children}
        <Toaster />
      </body>
    </html>
  );
}