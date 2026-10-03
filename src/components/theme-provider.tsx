"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Which room the product is in.
 *
 * `attribute="class"` is the whole contract with `globals.css`: the stylesheet
 * keys its second set of tokens off `.dark`, so that is the class next-themes has
 * to be putting on `<html>`. `defaultTheme="system"` means a person who has
 * asked their operating system for dark mode gets dark mode here without ever
 * opening settings — the setting exists for the people who want to disagree with
 * their OS, not for the people who want to know it happened.
 *
 * `disableTransitionOnChange` suppresses every `transition` for the duration of
 * the swap. Without it, switching themes animates the colour of every button,
 * chip and border in the document at once, which on a settings page with a long
 * plate stack reads as a slow smear rather than as a change of light.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="proofflow-theme"
    >
      {children}
    </NextThemesProvider>
  );
}