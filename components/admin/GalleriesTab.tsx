"use client";

import { useState } from "react";
import { UploadZone } from "./UploadZone";
import { Button, Field, Input } from "../ui";
import type { AdminGallery } from "@/lib/gallery-input";
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

/** Files come down sixty days out unless Joshua says otherwise. */
const DEFAULT_EXPIRY_DAYS = 60;

const stepButton = {
  minWidth: 26,
  minHeight: 26,
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

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function plusDays(days: number): string {
  const when = new Date();
  when.setDate(when.getDate() + days);
  return when.toISOString().slice(0, 10);
}

type DraftPhoto = {
  id: string;
  src: string;
  file: string;
  plate: string;
  ratio: string;
  pos: string;
  bytes?: number;
};

type Draft = {
  id: string | null;
  name: string;
  word: string;
  shotOn: string;
  expiresOn: string;
  photos: DraftPhoto[];
};

const blank = (): Draft => ({
  id: null,
  name: "",
  word: "",
  shotOn: today(),
  expiresOn: plusDays(DEFAULT_EXPIRY_DAYS),
  photos: [],
});

/** "Client galleries" — one private drawer per shoot. */
export function GalleriesTab({
  galleries,
  onGalleries,
  say,
}: {
  galleries: AdminGallery[];
  onGalleries: (galleries: AdminGallery[]) => void;
  say: (message: string) => void;
}) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [errors, setErrors] = useState({ name: "", word: "" });
  const [busy, setBusy] = useState(false);

  async function apply(response: Response): Promise<string | null> {
    const body = (await response.json().catch(() => null)) as {
      galleries?: AdminGallery[];
      message?: string;
    } | null;
    if (!response.ok) return body?.message ?? "That didn't save.";
    if (body?.galleries) onGalleries(body.galleries);
    return null;
  }

  async function save() {
    if (!draft || busy) return;
    const next = {
      name: draft.name.trim() ? "" : "A name helps me find it again.",
      word: draft.word.trim() ? "" : "They'll need a word to get in.",
    };
    // An existing gallery keeps its word unless Joshua types a new one.
    if (draft.id && !draft.word.trim()) next.word = "";
    if (next.name || next.word) {
      setErrors(next);
      return;
    }

    setBusy(true);
    const payload = {
      name: draft.name,
      shotOn: draft.shotOn,
      expiresOn: draft.expiresOn || null,
      photos: draft.photos.map((photo) => ({
        id: photo.id,
        file: photo.file,
        plate: photo.plate,
        ratio: photo.ratio,
        pos: photo.pos,
        bytes: photo.bytes,
      })),
      ...(draft.word.trim() ? { word: draft.word } : {}),
    };

    const failed = await apply(
      await fetch(
        draft.id ? `/api/admin/galleries/${draft.id}` : "/api/admin/galleries",
        {
          method: draft.id ? "PUT" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        },
      ),
    );
    setBusy(false);
    if (failed) {
      setErrors({ name: failed, word: "" });
      return;
    }
    setDraft(null);
    setErrors({ name: "", word: "" });
    say(draft.id ? "Saved." : "Saved. Send them the word when you're ready.");
  }

  async function copyLink(gallery: AdminGallery) {
    try {
      const response = await fetch(`/api/admin/galleries/${gallery.id}/link`);
      if (!response.ok) throw new Error("no link");
      const { url } = (await response.json()) as { url: string };
      await navigator.clipboard.writeText(url);
      say("Link copied. It opens the gallery without the word.");
    } catch {
      say("Couldn't copy that link just now.");
    }
  }

  async function takeDown(gallery: AdminGallery) {
    const failed = await apply(
      await fetch(`/api/admin/galleries/${gallery.id}`, { method: "DELETE" }),
    );
    setConfirmId(null);
    say(
      failed ?? `${gallery.name} is down. The word no longer opens anything.`,
    );
  }

  function addUploads(uploads: StoredUpload[]) {
    setDraft((current) =>
      current
        ? {
            ...current,
            photos: [
              ...current.photos,
              ...uploads.map((upload, index) => ({
                id: upload.id.replace(/\.jpg$/, ""),
                src: `/api/admin/uploads/${upload.id}`,
                file: upload.id,
                plate: `IMG ${String(current.photos.length + index + 1).padStart(4, "0")}`,
                ratio: upload.ratio,
                pos: "50% 50%",
                bytes: upload.bytes,
              })),
            ],
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
      return { ...current, photos };
    });
  }

  if (draft) {
    return (
      <div
        className="on-paper"
        style={{ ...worksheet, marginTop: "clamp(26px,4vw,38px)" }}
      >
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
              {draft.id ? `Editing ${draft.name || "a gallery"}` : "A new gallery"}
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
              {draft.id
                ? "Saved changes go live at once"
                : "Nobody sees this until you save"}
            </div>
          </div>

          <div
            style={{
              marginTop: 26,
              display: "grid",
              gap: "22px clamp(20px,3vw,32px)",
              gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,240px),1fr))",
            }}
          >
            <Field label="Client name" htmlFor="gallery-name" error={errors.name}>
              <Input
                id="gallery-name"
                value={draft.name}
                placeholder="The Hartleys"
                onChange={(value) => {
                  setDraft({ ...draft, name: value });
                  setErrors({ ...errors, name: "" });
                }}
              />
            </Field>
            <Field
              label="The word that opens it"
              htmlFor="gallery-word"
              error={errors.word}
            >
              <Input
                id="gallery-word"
                value={draft.word}
                placeholder={draft.id ? "leave blank to keep it" : "cottonwood"}
                onChange={(value) => {
                  setDraft({ ...draft, word: value });
                  setErrors({ ...errors, word: "" });
                }}
              />
            </Field>
            <Field label="Shoot date" htmlFor="gallery-shot">
              <Input
                id="gallery-shot"
                type="date"
                value={draft.shotOn}
                onChange={(value) => setDraft({ ...draft, shotOn: value })}
              />
            </Field>
            <Field label="Files here until" htmlFor="gallery-until">
              <Input
                id="gallery-until"
                type="date"
                value={draft.expiresOn}
                onChange={(value) => setDraft({ ...draft, expiresOn: value })}
              />
            </Field>
          </div>
          <div style={{ ...inkNote, marginTop: -12 }}>
            {DEFAULT_EXPIRY_DAYS} days out, unless you&rsquo;d rather something
            else.
          </div>

          <div style={{ marginTop: 30 }}>
            <div style={fieldLabel}>Photographs</div>

            <UploadZone
              hasPhotos={draft.photos.length > 0}
              hint="Full-size JPEGs off the card are fine — the web sizes get made for you."
              onAdded={addUploads}
              onMessage={say}
            />

            {draft.photos.length === 0 ? (
              <div style={{ ...inkNote, marginTop: 14 }}>
                Nothing in this gallery yet. Plenty of time.
              </div>
            ) : (
              <div
                style={{
                  marginTop: 16,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 14,
                }}
              >
                {draft.photos.map((photo, index) => (
                  <div key={photo.id} style={{ width: 104 }}>
                    <div style={printMat("5px", "0 3px 10px rgba(20,42,43,0.22)")}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.src}
                        alt=""
                        style={{
                          display: "block",
                          width: "100%",
                          aspectRatio: "1 / 1",
                          objectFit: "cover",
                          objectPosition: photo.pos,
                        }}
                      />
                    </div>
                    <div
                      style={{
                        marginTop: 6,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 2,
                      }}
                    >
                      <button
                        type="button"
                        className="ink-button"
                        onClick={() => movePhoto(index, -1)}
                        title="Move earlier"
                        style={stepButton}
                      >
                        ‹
                      </button>
                      <div style={{ ...inkNote, fontSize: 10 }}>{index + 1}</div>
                      <button
                        type="button"
                        className="ink-button"
                        onClick={() => movePhoto(index, 1)}
                        title="Move later"
                        style={stepButton}
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
                          })
                        }
                        title="Take this one out"
                        style={{ ...stepButton, color: "#7c4a2c" }}
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
              Save the gallery
            </Button>
            <button
              type="button"
              onClick={() => {
                setDraft(null);
                setErrors({ name: "", word: "" });
              }}
              style={{ ...quietAction, minHeight: 48 }}
            >
              Never mind
            </button>
          </div>
        </div>
      </div>
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
          {galleries.length === 0
            ? "nothing in the drawer yet"
            : galleries.length === 1
              ? "one in the drawer"
              : `${galleries.length} in the drawer — newest first`}
        </div>
        <Button onClick={() => setDraft(blank())}>New gallery</Button>
      </div>

      <div
        style={{
          marginTop: "clamp(26px,4vw,38px)",
          display: "flex",
          flexDirection: "column",
          gap: "clamp(18px,2.6vw,26px)",
        }}
      >
        {galleries.map((gallery) => {
          const confirming = confirmId === gallery.id;
          return (
            <div
              key={gallery.id}
              className="on-paper"
              style={{
                ...adminCard,
                padding: "clamp(20px,3vw,28px) clamp(20px,3vw,30px)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: "16px 24px",
                }}
              >
                <div style={{ minWidth: 0, flex: "1 1 260px" }}>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "center",
                      gap: "10px 14px",
                    }}
                  >
                    <h2
                      style={{
                        margin: 0,
                        fontFamily: "var(--font-editorial)",
                        fontWeight: 700,
                        fontSize: "clamp(22px,2.6vw,28px)",
                        lineHeight: 1.05,
                        color: "var(--ink)",
                      }}
                    >
                      {gallery.name}
                    </h2>
                    <div
                      style={
                        gallery.expired ? badgeDark("sm") : badgeIvory("sm")
                      }
                    >
                      {gallery.expired
                        ? `Taken down ${gallery.expiryLong}`
                        : `Here until ${gallery.expiryLong}`}
                    </div>
                  </div>
                  <div
                    style={{ ...inkNote, marginTop: 10, letterSpacing: "0.06em" }}
                  >
                    {gallery.photos.length}{" "}
                    {gallery.photos.length === 1 ? "photograph" : "photographs"}{" "}
                    · shot {gallery.shotLabel}
                  </div>
                  <div
                    style={{
                      marginTop: 8,
                      fontFamily: "var(--font-hand)",
                      fontSize: 21,
                      lineHeight: 1.25,
                      color: "var(--text-ink-mid)",
                    }}
                  >
                    {gallery.word
                      ? `the word is ${gallery.word}`
                      : "no word stored — set a new one to replace it"}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  {confirming ? (
                    <>
                      <div style={{ ...inkNote, color: "#7c4a2c" }}>
                        The word stops working straight away.
                      </div>
                      <button
                        type="button"
                        className="danger-solid"
                        onClick={() => void takeDown(gallery)}
                        style={{
                          minHeight: 40,
                          padding: "0 14px",
                          border: "1px solid #7c4a2c",
                          borderRadius: 3,
                          background: "#7c4a2c",
                          cursor: "pointer",
                          fontFamily: "var(--font-ui)",
                          fontSize: 13,
                          color: "var(--paper-card)",
                        }}
                      >
                        Take it down
                      </button>
                      <button
                        type="button"
                        className="ink-quiet-button"
                        onClick={() => setConfirmId(null)}
                        style={quietAction}
                      >
                        Keep it
                      </button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="secondary"
                        style={{ minHeight: 40, padding: "0 16px" }}
                        onClick={() =>
                          setDraft({
                            id: gallery.id,
                            name: gallery.name,
                            word: "",
                            shotOn: gallery.shotOn,
                            expiresOn: gallery.expiresOn ?? "",
                            photos: gallery.photos.map((photo) => ({ ...photo })),
                          })
                        }
                      >
                        Edit
                      </Button>
                      <button
                        type="button"
                        className="ink-quiet-button"
                        onClick={() => void copyLink(gallery)}
                        style={quietAction}
                      >
                        Copy the link
                      </button>
                      <button
                        type="button"
                        className="danger-button"
                        onClick={() => setConfirmId(gallery.id)}
                        style={{ ...quietAction, color: "#7c4a2c" }}
                      >
                        Take it down
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div
                style={{
                  marginTop: 18,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                {gallery.photos.slice(0, 6).map((photo) => (
                  <div
                    key={photo.id}
                    style={printMat("4px", "0 2px 7px rgba(20,42,43,0.2)")}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.src}
                      alt=""
                      style={{
                        display: "block",
                        width: 58,
                        aspectRatio: "1 / 1",
                        objectFit: "cover",
                        objectPosition: photo.pos,
                      }}
                    />
                  </div>
                ))}
                {gallery.photos.length > 6 ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "0 10px",
                      ...inkNote,
                      letterSpacing: "0.06em",
                    }}
                  >
                    + {gallery.photos.length - 6} more
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}

        {galleries.length === 0 ? (
          <div
            style={{
              fontFamily: "var(--font-hand)",
              fontSize: 24,
              lineHeight: 1.3,
              color: "var(--hand-body)",
            }}
          >
            Nothing in the drawer yet. Plenty of time.
          </div>
        ) : null}
      </div>
    </>
  );
}
