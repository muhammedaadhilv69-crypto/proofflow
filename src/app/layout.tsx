import type { Metadata } from "next";
import { Outfit, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

/**
 * One geometric sans, plus a mono.
 *
 * Outfit carries everything — interface, headings, marketing — because its
 * circular bowls and open apertures are the whole point of the visual language
 * this product now speaks. It is also unusually wide for a geometric, which is
 * what lets a centred headline at 68px hold together without going tight and
 * editorial.
 *
 * IBM Plex Mono is kept, but demoted to one job: the slug line and the things a
 * slug line holds — version numbers, approval numbers, timestamps, file facts.
 * A record that may be read aloud or transcribed should not be set in a face
 * whose zero and capital O are hard to tell apart at a glance.
 */
const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
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
    /*
     * `suppressHydrationWarning` is required, not defensive. next-themes injects
     * a blocking script that writes the `.dark` class onto this element before
     * React hydrates, so the class list on `<html>` at hydration time is
     * genuinely different from the one this component rendered — React says so
     * rather than silently reverting it, and the room would flip on every load.
     */
    <html
      lang="en"
      suppressHydrationWarning
      className={`${outfit.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}