import type { ReactNode } from "react";
import { isAdmin } from "@/lib/auth";
import { loadContent, loadDoc } from "@/lib/site-content";
import { SiteProvider } from "./SiteProvider";

/**
 * Server half of every page: reads the copy store and the admin cookie once,
 * then hands both to the client tree.
 */
export async function Shell({ children }: { children: ReactNode }) {
  const [content, doc, admin] = await Promise.all([
    loadContent(),
    loadDoc(),
    isAdmin(),
  ]);

  const stored = doc.images["about.portrait"];
  const portrait = stored
    ? `/api/images/about.portrait?v=${stored.updatedAt}`
    : null;

  return (
    <SiteProvider content={content} admin={admin} portrait={portrait}>
      {children}
    </SiteProvider>
  );
}
