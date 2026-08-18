"use client";

import type { ReactNode } from "react";
import { Header, type NavKey } from "./Header";
import { Footer } from "./Footer";
import {
  glowLayer,
  grainLayer,
  pageShell,
  vignetteLayer,
  wearLayer,
} from "@/lib/tokens";

/**
 * The worn-desk surface every page sits on: warm lamp glow, the wear and grain
 * textures, then a vignette — all non-interactive layers beneath the content.
 */
export function SiteFrame({
  active,
  editablePhoto = false,
  footerVariant = "site",
  children,
}: {
  active: NavKey;
  editablePhoto?: boolean;
  footerVariant?: "site" | "admin";
  children: ReactNode;
}) {
  return (
    <div style={pageShell}>
      <div style={glowLayer} />
      <div style={wearLayer} />
      <div style={grainLayer} />
      <div style={vignetteLayer} />

      <Header active={active} />
      {children}
      <Footer editablePhoto={editablePhoto} variant={footerVariant} />
    </div>
  );
}
