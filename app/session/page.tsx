import type { Metadata } from "next";
import { Shell } from "@/components/Shell";
import { SessionView } from "@/components/pages/SessionView";
import { currentGallery } from "@/lib/auth";
import { toPublic } from "@/lib/client-sessions";

export const metadata: Metadata = {
  title: "Your session",
  description: "A private gallery. The word I sent you opens it.",
  robots: { index: false, follow: false },
};

/** Cookie-driven: the locked and unlocked states are rendered on the server. */
export const dynamic = "force-dynamic";

export default async function SessionPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [session, params] = await Promise.all([
    currentGallery(),
    searchParams,
  ]);
  const publicSession = session ? await toPublic(session) : null;

  return (
    <Shell>
      <SessionView
        session={publicSession}
        linkExpired={params.link === "expired"}
      />
    </Shell>
  );
}
