import type { Metadata, Viewport } from "next";
import {
  Archivo,
  Bevan,
  Courier_Prime,
  EB_Garamond,
  Grape_Nuts,
  Playfair_Display,
} from "next/font/google";
import "./globals.css";

/**
 * Timber & Ink type stack. The handoff names the faces; the design-system
 * token files themselves were not part of the drop, so the variables are
 * declared here and consumed everywhere as var(--font-*).
 */
const display = Bevan({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

const editorial = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-editorial",
  display: "swap",
});

const hand = Grape_Nuts({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-hand",
  display: "swap",
});

const ui = Archivo({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-ui",
  display: "swap",
});

const mono = Courier_Prime({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
  display: "swap",
});

const body = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Joshua Davis — photographs, mostly close to home",
    template: "%s · Joshua Davis",
  },
  description:
    "Landscape and street photographs from Tulsa, Oklahoma. A drawer full of ordinary hours.",
};

export const viewport: Viewport = {
  themeColor: "#0b1a1b",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${display.variable} ${editorial.variable} ${hand.variable} ${ui.variable} ${mono.variable} ${body.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
