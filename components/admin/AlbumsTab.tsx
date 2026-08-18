"use client";

import { useState } from "react";
import { UploadZone } from "./UploadZone";
import { Button, Field, Input } from "../ui";
import {
  HOME_MAX,
  coverPhoto,
  countHomePicks,
  type Album,
  type AlbumPhoto,
} from "@/lib/album-types";
import type { StoredUpload } from "@/lib/uploads";
import {
  adminCard,
  badgeDark,
  badgeIvory,
  fieldLabel,
  inkNote,
  noteMarginRule,
  printMat,
  worksheet,
} from "@/lib/tokens";

const stepButton = {
  minWidth: 30,
  minHeight: 34,
  border: "1px solid rgba(20,42,43,0.22)",
  borderRadius: 3,
  background: "transparent",
  cursor: "pointer",
  fontFamily: "var(--font-mono)",
  fontSize: 12,
  color: "var(--text-ink-mid)",
} as const;

const quietAction = {
  minHeight: 40,
  padding: "0 8px",
  border: 0,
  background: "transparent",
  cursor: "pointer",
  whiteSpace: "nowrap" as const,
  fontFamily: "var(--font-ui)",
  fontSize: 13,
  color: "var(--text-ink-muted)",
};

type Draft = {
  id: string | null;
  name: string;
  sub: string;
  live: boolean;
  cover: number;
  photos: AlbumPhoto[];
};

const blank = (): Draft => ({
  id: null,
  name: "",
  sub: "",
  live: false,
  cover: 0,
  photos: [],
});

/** "My photographs" — the public piles, their order, and what's in them. */
export function AlbumsTab({
  albums,
  onAlbums,
  say,
}: {
  albums: Album[];
  onAlbums: (albums: Album[]) => void;
  say: (message: string) => void;
}) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const live = albums.filter((album) => album.live).length;
  const drafts = albums.length - live;

  async function refresh(response: Response) {
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      return body?.message ?? "That didn't save.";
    }
    const list = await fetch("/api/admin/albums").then((r) => r.json());
    onAlbums(list.albums as Album[]);
    return null;
  }

  async function move(id: string, delta: number) {
    const order = albums.map((album) => album.id);
    const from = order.indexOf(id);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= order.length) return;
    [order[from], order[to]] = [order[to]!, order[from]!];
    const failed = await refresh(
      await fetch("/api/admin/albums", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ order }),
      }),
    );
    if (failed) say(failed);
  }

  async function toggleLive(album: Album) {
    const failed = await refresh(
      await fetch(`/api/admin/albums/${album.id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ live: !album.live }),
      }),
    );
    say(
      failed ??
        (album.live ? `${album.name} is off the site.` : `${album.name} is live.`),
    );
  }

  async function save() {
    if (!draft || busy) return;
    if (!draft.name.trim()) {
      setError("A pile needs a name.");
      return;
    }
    setBusy(true);
    const payload = {
      name: draft.name,
      sub: draft.sub,
      live: draft.live,
      cover: draft.cover,
      photos: draft.photos,
    };
    const failed = await refresh(
      await fetch(
        draft.id ? `/api/admin/albums/${draft.id}` : "/api/admin/albums",
        {
          method: draft.id ? "PUT" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        },
      ),
    );
    setBusy(false);
    if (failed) {
      setError(failed);
      return;
    }
    setDraft(null);
    setError("");
    say(
      draft.id
        ? "Saved."
        : draft.live
          ? "Saved, and it's live."
          : "Saved as a draft — nobody sees it yet.",
    );
  }

  /** Home-page picks outside the album being edited, so the cap counts once. */
  const homeElsewhere = countHomePicks(
    albums.filter((album) => album.id !== draft?.id),
  );
  const homeHere = draft?.photos.filter((photo) => photo.home).length ?? 0;

  function patchPhoto(index: number, patch: Partial<AlbumPhoto>) {
    setDraft((current) =>
      current
        ? {
            ...current,
            photos: current.photos.map((photo, i) =>
              i === index ? { ...photo, ...patch } : photo,
            ),
          }
        : current,
    );
  }

  function movePhoto(index: number, delta: number) {
    setDraft((current) => {
      if (!current) return current;
      const to = index + delta;
      if (to < 0 || to >= current.photos.length) return current;
      const photos = current.photos.slice();
      [photos[index], photos[to]] = [photos[to]!, photos[index]!];
      let cover = current.cover;
      if (cover === index) cover = to;
      else if (cover === to) cover = index;
      return { ...current, photos, cover };
    });
  }

  function toggleHome(index: number) {
    const photo = draft?.photos[index];
    if (!photo) return;
    if (!photo.home && homeElsewhere + homeHere >= HOME_MAX) {
      say("Three is all the home page has room for — take one out first.");
      return;
    }
    patchPhoto(index, { home: !photo.home });
  }

  function addUploads(uploads: StoredUpload[]) {
    setDraft((current) =>
      current
        ? {
            ...current,
            photos: [
              ...current.photos,
              ...uploads.map((upload) => ({
                id: upload.id.replace(/\.jpg$/, ""),
                src: `/api/photos/${upload.id}`,
                plate: "",
                cap: "",
                home: false,
                ratio: upload.ratio,
                pos: "50% 50%",
              })),
            ],
          }
        : current,
    );
  }

  if (draft) {
    return (
      <>
        <div className="on-paper" style={{ ...worksheet, marginTop: "clamp(26px,4vw,38px)" }}>
          <div aria-hidden style={noteMarginRule} />
          <div style={{ position: "relative", paddingLeft: "clamp(38px,10vw,66px)" }}>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: "10px 20px",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontFamily: "var(--font-editorial)",
                  fontWeight: 700,
                  fontSize: "clamp(25px,3vw,34px)",
                  lineHeight: 1.05,
                  color: "var(--ink)",
                }}
              >
                {draft.id ? draft.name || "A pile" : "A new album"}
              </h2>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "var(--text-ink-muted)",
                }}
              >
                {draft.live
                  ? "Changes go live at once"
                  : "A draft — nobody sees it yet"}
              </div>
            </div>

            <div
              style={{
                marginTop: 26,
                display: "grid",
                gap: "22px clamp(20px,3vw,32px)",
                gridTemplateColumns:
                  "repeat(auto-fit,minmax(min(100%,240px),1fr))",
              }}
            >
              <Field label="Album name" htmlFor="album-name" error={error}>
                <Input
                  id="album-name"
                  value={draft.name}
                  placeholder="Above the treeline"
                  onChange={(value) => {
                    setDraft({ ...draft, name: value });
                    setError("");
                  }}
                />
              </Field>
              <Field label="The line under the title" htmlFor="album-sub">
                <Input
                  id="album-sub"
                  value={draft.sub}
                  placeholder="Tulsa · ongoing"
                  onChange={(value) => setDraft({ ...draft, sub: value })}
                />
              </Field>
            </div>
            <div style={{ ...inkNote, marginTop: -12 }}>
              Shown on the Galleries index.
            </div>

            <div style={{ marginTop: 30 }}>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  gap: "8px 18px",
                }}
              >
                <div style={fieldLabel}>Photographs</div>
                <div style={inkNote}>
                  {homeElsewhere + homeHere} of {HOME_MAX} chosen for the home
                  page
                </div>
              </div>

              <UploadZone
                hasPhotos={draft.photos.length > 0}
                hint="Up to forty in a pile reads comfortably — after that, start another."
                onAdded={addUploads}
                onMessage={say}
              />

              {draft.photos.length === 0 ? (
                <div style={{ ...inkNote, marginTop: 14 }}>
                  Nothing in this pile yet.
                </div>
              ) : (
                <div style={{ marginTop: 8 }}>
                  {draft.photos.map((photo, index) => (
                    <div
                      key={photo.id}
                      style={{
                        padding: "16px 0",
                        borderTop: "1px solid rgba(20,42,43,0.12)",
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        gap: "14px 16px",
                      }}
                    >
                      <div style={printMat("4px", "0 2px 7px rgba(20,42,43,0.2)")}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.src}
                          alt=""
                          style={{
                            display: "block",
                            width: 64,
                            aspectRatio: "1 / 1",
                            objectFit: "cover",
                            objectPosition: photo.pos,
                          }}
                        />
                      </div>
                      <div style={{ flex: "1 1 150px", minWidth: 0 }}>
                        <Input
                          value={photo.plate}
                          placeholder="IMG 4412"
                          onChange={(value) => patchPhoto(index, { plate: value })}
                        />
                      </div>
                      <div style={{ flex: "1.6 1 190px", minWidth: 0 }}>
                        <Input
                          value={photo.cap}
                          placeholder="a line in your hand, if it wants one"
                          onChange={(value) => patchPhoto(index, { cap: value })}
                        />
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "nowrap",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setDraft({ ...draft, cover: index })}
                          title="Use this one as the album cover"
                          style={{
                            minHeight: 34,
                            padding: "0 10px",
                            borderRadius: 3,
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            fontFamily: "var(--font-ui)",
                            fontSize: 11,
                            fontWeight: 600,
                            letterSpacing: "0.06em",
                            background:
                              draft.cover === index ? "var(--ink)" : "transparent",
                            color:
                              draft.cover === index
                                ? "var(--paper-card)"
                                : "var(--text-ink-muted)",
                            border: `1px solid ${draft.cover === index ? "var(--ink)" : "rgba(20,42,43,0.22)"}`,
                          }}
                        >
                          Cover
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleHome(index)}
                          title="Show this one in Pasted in lately, on the home page"
                          style={{
                            minHeight: 34,
                            padding: "0 10px",
                            borderRadius: 3,
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            fontFamily: "var(--font-ui)",
                            fontSize: 11,
                            fontWeight: 600,
                            letterSpacing: "0.06em",
                            background: photo.home ? "var(--amber)" : "transparent",
                            color: photo.home ? "#1d2a28" : "var(--text-ink-muted)",
                            border: `1px solid ${photo.home ? "var(--amber)" : "rgba(20,42,43,0.22)"}`,
                          }}
                        >
                          Home
                        </button>
                        <button
                          type="button"
                          className="ink-button"
                          onClick={() => movePhoto(index, -1)}
                          title="Move earlier"
                          style={{ ...stepButton, minWidth: 28 }}
                        >
                          ‹
                        </button>
                        <button
                          type="button"
                          className="ink-button"
                          onClick={() => movePhoto(index, 1)}
                          title="Move later"
                          style={{ ...stepButton, minWidth: 28 }}
                        >
                          ›
                        </button>
                        <button
                          type="button"
                          className="ink-button"
                          onClick={() =>
                            setDraft({
                              ...draft,
                              photos: draft.photos.filter((_, i) => i !== index),
                              cover: Math.min(
                                draft.cover,
                                Math.max(0, draft.photos.length - 2),
                              ),
                            })
                          }
                          title="Take this one out"
                          style={{ ...stepButton, minWidth: 28, color: "#7c4a2c" }}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div
              style={{
                marginTop: 32,
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 12,
              }}
            >
              <Button disabled={busy} onClick={() => void save()}>
                {draft.live ? "Save the album" : "Save the draft"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setDraft({ ...draft, live: !draft.live })}
              >
                {draft.live ? "Take it off the site" : "Publish it"}
              </Button>
              <button
                type="button"
                onClick={() => {
                  setDraft(null);
                  setError("");
                }}
                style={{ ...quietAction, minHeight: 48 }}
              >
                Never mind
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div
        style={{
          marginTop: "clamp(20px,3vw,28px)",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: "18px 24px",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-hand)",
            fontSize: "clamp(21px,2.2vw,26px)",
            lineHeight: 1.3,
            color: "var(--hand-body)",
          }}
        >
          {albums.length === 0
            ? "no piles yet"
            : `${live} ${live === 1 ? "pile" : "piles"} on the site` +
              (drafts ? ` · ${drafts} still a draft` : "") +
              " — top of the list shows first"}
        </div>
        <Button onClick={() => setDraft(blank())}>New album</Button>
      </div>

      <div
        style={{
          marginTop: "clamp(26px,4vw,38px)",
          display: "flex",
          flexDirection: "column",
          gap: "clamp(16px,2.4vw,22px)",
        }}
      >
        {albums.map((album, index) => {
          const cover = coverPhoto(album);
          return (
            <div
              key={album.id}
              className="on-paper"
              style={{
                ...adminCard,
                padding: "clamp(16px,2.4vw,22px) clamp(18px,2.6vw,26px)",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: "16px 22px",
              }}
            >
              <div style={printMat("5px", "0 3px 10px rgba(20,42,43,0.22)")}>
                {cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cover.src}
                    alt=""
                    style={{
                      display: "block",
                      width: 74,
                      aspectRatio: "1 / 1",
                      objectFit: "cover",
                      objectPosition: cover.pos,
                    }}
                  />
                ) : (
                  <div style={{ width: 74, aspectRatio: "1 / 1", background: "#e9e4d5" }} />
                )}
              </div>

              <div style={{ flex: "1 1 220px", minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: "8px 12px",
                  }}
                >
                  <h2
                    style={{
                      margin: 0,
                      fontFamily: "var(--font-editorial)",
                      fontWeight: 700,
                      fontSize: "clamp(20px,2.4vw,26px)",
                      lineHeight: 1.06,
                      color: "var(--ink)",
                    }}
                  >
                    {album.name}
                  </h2>
                  <div style={album.live ? badgeIvory("sm") : badgeDark("sm")}>
                    {album.live ? "Live" : "Draft"}
                  </div>
                </div>
                <div style={{ ...inkNote, marginTop: 8, letterSpacing: "0.06em" }}>
                  {album.photos.length}{" "}
                  {album.photos.length === 1 ? "photograph" : "photographs"} ·{" "}
                  {album.sub || "no line yet"}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexWrap: "nowrap",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <button
                  type="button"
                  className="ink-button"
                  onClick={() => void move(album.id, -1)}
                  title="Show this one earlier on Galleries"
                  style={stepButton}
                >
                  ↑
                </button>
                <div
                  style={{
                    minWidth: 34,
                    textAlign: "center",
                    ...inkNote,
                    fontSize: 10,
                    letterSpacing: "0.06em",
                  }}
                >
                  {index + 1} / {albums.length}
                </div>
                <button
                  type="button"
                  className="ink-button"
                  onClick={() => void move(album.id, 1)}
                  title="Show this one later on Galleries"
                  style={stepButton}
                >
                  ↓
                </button>
              </div>

              <div
                style={{
                  display: "flex",
                  flexWrap: "nowrap",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <Button
                  variant="secondary"
                  style={{ minHeight: 40, padding: "0 16px" }}
                  onClick={() =>
                    setDraft({
                      id: album.id,
                      name: album.name,
                      sub: album.sub,
                      live: album.live,
                      cover: album.cover,
                      photos: album.photos.map((photo) => ({ ...photo })),
                    })
                  }
                >
                  Edit
                </Button>
                <button
                  type="button"
                  className="ink-quiet-button"
                  onClick={() => void toggleLive(album)}
                  style={quietAction}
                >
                  {album.live ? "Take it off the site" : "Publish it"}
                </button>
              </div>
            </div>
          );
        })}

        {albums.length === 0 ? (
          <div
            style={{
              fontFamily: "var(--font-hand)",
              fontSize: 24,
              lineHeight: 1.3,
              color: "var(--hand-body)",
            }}
          >
            No piles yet. Plenty of time.
          </div>
        ) : null}
      </div>
    </>
  );
}
