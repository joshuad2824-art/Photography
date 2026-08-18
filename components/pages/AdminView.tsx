"use client";

import { useEffect, useRef, useState } from "react";
import { SiteFrame } from "../SiteFrame";
import { useSite } from "../SiteProvider";
import { Tabs } from "../ui";
import { AlbumsTab } from "../admin/AlbumsTab";
import { GalleriesTab } from "../admin/GalleriesTab";
import type { Album } from "@/lib/album-types";
import type { AdminGallery } from "@/lib/gallery-input";
import { embossedLabel, h1, monoMeta, shell } from "@/lib/tokens";

const TABS = [
  { value: "photos", label: "My photographs" },
  { value: "clients", label: "Client galleries" },
];

/**
 * The desk drawer: back of house, not in the nav, reached from the footer's
 * Admin control. Signed out it says so and shows nothing — the server hands
 * this component no albums and no galleries at all.
 */
export function AdminView({
  albums: initialAlbums,
  galleries: initialGalleries,
}: {
  albums: Album[];
  galleries: AdminGallery[];
}) {
  const { admin } = useSite();
  const [tab, setTab] = useState("photos");
  const [albums, setAlbums] = useState(initialAlbums);
  const [galleries, setGalleries] = useState(initialGalleries);
  const [toast, setToast] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  // Signing in re-renders this page from the server with the drawer's contents,
  // which the local copies have to pick up.
  useEffect(() => setAlbums(initialAlbums), [initialAlbums]);
  useEffect(() => setGalleries(initialGalleries), [initialGalleries]);

  function say(message: string) {
    setToast(message);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(""), 3600);
  }

  if (!admin) {
    return (
      <SiteFrame active="none">
        <section
          style={shell({ padding: "clamp(38px,6vw,60px) var(--shell-pad) 0" })}
        >
          <div style={{ maxWidth: "52ch" }}>
            <div style={embossedLabel("rotate(-2.1deg)")}>Back of house</div>
            <h1 style={{ ...h1, margin: "14px 0 0" }}>
              This part of the desk is mine
            </h1>
            <div
              style={{
                margin: "20px 0 0",
                fontFamily: "var(--font-hand)",
                fontSize: "clamp(22px,2.3vw,28px)",
                lineHeight: 1.34,
                color: "var(--hand-body)",
                textWrap: "pretty",
              }}
            >
              If you&rsquo;re me: sign in with the Admin control at the bottom of
              the page and this turns into the drawer index.
            </div>
            <div style={{ ...monoMeta, marginTop: 26, letterSpacing: "0.08em" }}>
              Nothing here is public. No gallery, no word, no client name.
            </div>
          </div>
        </section>
      </SiteFrame>
    );
  }

  return (
    <SiteFrame active="none" footerVariant="admin">
      <section
        style={shell({ padding: "clamp(32px,5vw,46px) var(--shell-pad) 0" })}
      >
        <div>
          <div style={embossedLabel("rotate(-1.4deg)")}>Back of house</div>
          <h1
            style={{
              ...h1,
              margin: "12px 0 0",
              fontSize: "clamp(30px,4.2vw,46px)",
              lineHeight: 1.03,
            }}
          >
            The desk drawer
          </h1>
        </div>

        <div style={{ marginTop: "clamp(22px,3vw,30px)" }}>
          <Tabs items={TABS} value={tab} onChange={setTab} />
        </div>

        {toast ? (
          <div
            role="status"
            style={{
              marginTop: 20,
              display: "inline-block",
              padding: "10px 14px",
              border: "1px solid rgba(198,134,47,0.45)",
              borderRadius: 3,
              background: "rgba(198,134,47,0.1)",
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              letterSpacing: "0.06em",
              color: "#E8C58A",
            }}
          >
            {toast}
          </div>
        ) : null}

        {tab === "photos" ? (
          <AlbumsTab albums={albums} onAlbums={setAlbums} say={say} />
        ) : (
          <GalleriesTab
            galleries={galleries}
            onGalleries={setGalleries}
            say={say}
          />
        )}
      </section>
    </SiteFrame>
  );
}
