import type { Metadata } from "next";
import { Shell } from "@/components/Shell";
import { AdminView } from "@/components/pages/AdminView";
import { loadAlbums } from "@/lib/albums";
import { isAdmin } from "@/lib/auth";
import { listForAdmin } from "@/lib/gallery-input";

export const metadata: Metadata = {
  title: "The desk drawer",
  robots: { index: false, follow: false },
};

/** Cookie-driven, and never cached: the gate is decided on the server. */
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await isAdmin();

  // Signed out, the page is handed nothing at all — no album names, no client
  // names, no words. The gate isn't a hidden div, it's an empty payload.
  const [albums, galleries] = admin
    ? await Promise.all([loadAlbums(), listForAdmin()])
    : [[], []];

  return (
    <Shell>
      <AdminView albums={albums} galleries={galleries} />
    </Shell>
  );
}
