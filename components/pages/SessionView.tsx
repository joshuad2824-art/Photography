"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Editable } from "../Editable";
import { Photo } from "../Photo";
import { SiteFrame } from "../SiteFrame";
import { Button, Input } from "../ui";
import type { PublicClientSession } from "@/lib/client-sessions";
import {
  badgeDark,
  badgeIvory,
  bodyText,
  h1,
  monoMeta,
  noteBodyText,
  noteMarginRule,
  paperNote,
  plateLine,
  printMat,
  shell,
  signature,
  tape,
} from "@/lib/tokens";

/**
 * A client's private drawer. Locked until the word checks out on the server —
 * the browser never sees another client's photographs, or the word list.
 */
export function SessionView({
  session,
  linkExpired = false,
}: {
  session: PublicClientSession | null;
  linkExpired?: boolean;
}) {
  return (
    <SiteFrame active="session">
      {session ? <Unlocked session={session} /> : <Locked linkExpired={linkExpired} />}
    </SiteFrame>
  );
}

function Locked({ linkExpired }: { linkExpired: boolean }) {
  const router = useRouter();
  const [passphrase, setPassphrase] = useState("");
  const [note, setNote] = useState(
    linkExpired
      ? "That link has expired — the word still works, or write to me."
      : "",
  );
  const [busy, setBusy] = useState(false);

  async function attempt() {
    if (busy) return;
    const word = passphrase.trim();
    if (!word) {
      setNote("I'll need the word first.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/session/unlock", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ passphrase: word }),
      });
      if (response.ok) {
        setNote("");
        setPassphrase("");
        window.scrollTo(0, 0);
        router.refresh();
        return;
      }
      const body = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      setNote(
        body?.message ??
          "That one doesn't open anything — try the word I sent you.",
      );
    } catch {
      setNote("Something went wrong on my end. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      style={shell({
        padding: "clamp(38px,6vw,60px) var(--shell-pad) 0",
        display: "flex",
        flexWrap: "wrap",
        gap: "clamp(30px,4vw,48px)",
        alignItems: "flex-start",
      })}
    >
      <div style={{ flex: "1.3 1 380px", minWidth: 0 }}>
        <Editable id="session.lockedBadge" style={badgeIvory("lg")} />
        <Editable
          id="session.lockedTitle"
          as="h1"
          style={{ ...h1, margin: "14px 0 0" }}
        />
        <Editable
          id="session.lockedHand"
          style={{
            margin: "20px 0 0",
            fontFamily: "var(--font-hand)",
            fontSize: "clamp(22px,2.3vw,28px)",
            lineHeight: 1.34,
            color: "var(--hand-body)",
            maxWidth: "38ch",
            textWrap: "pretty",
          }}
        />
        <Editable
          id="session.lockedBody"
          as="p"
          style={{ ...bodyText, margin: "22px 0 0", maxWidth: "44ch" }}
        />
        <Editable
          id="session.lockedEmail"
          style={{ ...monoMeta, marginTop: 26, letterSpacing: "0.08em" }}
        />
      </div>

      <div
        style={{
          flex: "1 1 330px",
          minWidth: 0,
          transform: "rotate(-0.8deg)",
        }}
      >
        <div
          className="on-paper"
          style={{
            position: "relative",
            background: "var(--paper-card)",
            padding: "clamp(22px,3vw,30px)",
            boxShadow: "0 26px 54px rgba(0,0,0,0.52)",
          }}
        >
          <div
            aria-hidden
            style={tape("cream", {
              top: -14,
              left: -16,
              width: 112,
              height: 29,
              transform: "rotate(-17deg)",
            })}
          />
          <Editable
            id="session.formHand"
            style={{
              fontFamily: "var(--font-hand)",
              fontSize: 26,
              lineHeight: 1.24,
              color: "var(--ink)",
            }}
          />
          <div style={{ marginTop: 16 }}>
            <Input
              id="session-passphrase"
              value={passphrase}
              placeholder="e.g. cottonwood"
              onChange={(value) => {
                setPassphrase(value);
                setNote("");
              }}
              onEnter={() => void attempt()}
              ariaInvalid={Boolean(note)}
              ariaDescribedBy="session-passphrase-error"
            />
          </div>
          <div
            id="session-passphrase-error"
            role="status"
            style={{
              marginTop: 9,
              minHeight: 20,
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              letterSpacing: "0.04em",
              color: "#7c4a2c",
            }}
          >
            {note}
          </div>
          <div style={{ marginTop: 12 }}>
            <Button fullWidth disabled={busy} onClick={() => void attempt()}>
              Open my gallery
            </Button>
          </div>
          <Editable
            id="session.formHint"
            style={{
              marginTop: 14,
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              letterSpacing: "0.04em",
              color: "var(--text-ink-muted)",
            }}
          />
        </div>
      </div>
    </section>
  );
}

function Unlocked({ session }: { session: PublicClientSession }) {
  const router = useRouter();
  const [kept, setKept] = useState<string[]>(session.kept);
  const [onlyKept, setOnlyKept] = useState(false);
  const [toast, setToast] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function say(message: string) {
    setToast(message);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(""), 3600);
  }

  async function toggleKeep(photoId: string) {
    const next = kept.includes(photoId)
      ? kept.filter((id) => id !== photoId)
      : [...kept, photoId];
    setKept(next);
    await fetch("/api/session/keep", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ photoId, kept: next.includes(photoId) }),
    }).catch(() => {
      // A failed save shouldn't lose the click; the next toggle retries.
      say("Couldn't save that just now — I'll still see the ones you mark.");
    });
  }

  async function copyShareLink() {
    try {
      const response = await fetch("/api/session/share");
      if (!response.ok) throw new Error("share failed");
      const { url } = (await response.json()) as { url: string };
      await navigator.clipboard.writeText(url);
      say("Link copied. It opens the same drawer, no word needed.");
    } catch {
      say("Couldn't copy the link — write to me and I'll send one.");
    }
  }

  async function closeDrawer() {
    await fetch("/api/session/close", { method: "POST" });
    window.scrollTo(0, 0);
    router.refresh();
  }

  const shown = onlyKept
    ? session.photos.filter((photo) => kept.includes(photo.id))
    : session.photos;

  const keptLabel = onlyKept
    ? `Show all ${session.photos.length}`
    : kept.length
      ? `Show the ${kept.length} kept`
      : "Show only kept";

  return (
    <section
      style={shell({ padding: "clamp(32px,5vw,46px) var(--shell-pad) 0" })}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-end",
          gap: "14px 24px",
        }}
      >
        <h1 style={{ ...h1, fontSize: "clamp(30px,4.2vw,48px)", lineHeight: 1.03 }}>
          {session.name}
        </h1>
        <div
          style={{
            fontFamily: "var(--font-hand)",
            fontSize: "clamp(22px,2.2vw,26px)",
            lineHeight: 1.2,
            color: "var(--amber-hand)",
            paddingBottom: 6,
          }}
        >
          {session.hand}
        </div>
      </div>

      <div
        style={{
          marginTop: 16,
          display: "flex",
          flexWrap: "wrap",
          gap: "10px 12px",
          alignItems: "center",
        }}
      >
        <div style={badgeDark("md")}>{session.shoot}</div>
        <div style={badgeIvory("md", { transform: "rotate(-1.1deg)" })}>
          {session.expiryLabel}
        </div>
        <button
          type="button"
          onClick={() => void closeDrawer()}
          className="quiet-button"
          style={{
            minHeight: 44,
            padding: "0 4px",
            border: 0,
            background: "transparent",
            cursor: "pointer",
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--text-faint)",
          }}
        >
          Close the drawer
        </button>
      </div>

      <div
        style={{
          marginTop: 24,
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "center",
        }}
      >
        <Button
          onClick={() => {
            say(
              `All ${session.frameCount} files on their way — ${session.archiveSize}, so give it a minute.`,
            );
            window.location.href = "/api/session/download-all";
          }}
        >
          Download all full-size
        </Button>
        <Button variant="secondary" onClick={() => void copyShareLink()}>
          Copy a link for family
        </Button>
        <button
          type="button"
          onClick={() => setOnlyKept((value) => !value)}
          aria-pressed={onlyKept}
          className="outline-button"
          style={{
            minHeight: 48,
            padding: "0 18px",
            border: "1px solid rgba(232,227,215,0.28)",
            borderRadius: 3,
            background: "transparent",
            cursor: "pointer",
            fontFamily: "var(--font-ui)",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--text-primary)",
          }}
        >
          {keptLabel}
        </button>
      </div>

      <div
        role="status"
        style={{
          marginTop: 12,
          minHeight: 22,
          fontFamily: "var(--font-hand)",
          fontSize: 22,
          lineHeight: 1.2,
          color: "var(--amber-hand)",
        }}
      >
        {toast}
      </div>

      <div style={{ marginTop: 26, height: 1, background: "var(--rule)" }} />

      <div
        style={{
          marginTop: "clamp(32px,4.4vw,46px)",
          columns: "280px",
          columnGap: "clamp(28px,4vw,40px)",
        }}
      >
        {shown.map((photo) => {
          const isKept = kept.includes(photo.id);
          return (
            <div
              key={photo.id}
              style={{
                breakInside: "avoid",
                margin: "0 0 clamp(32px,4vw,44px)",
                marginLeft: photo.ml === "0" ? undefined : photo.ml,
                width: photo.w,
                transform: `rotate(${photo.rot})`,
              }}
            >
              <div style={printMat("11px 11px 14px")}>
                <Photo
                  src={photo.src}
                  alt={`${session.name} — ${photo.plate}`}
                  ratio={photo.ratio}
                  position={photo.pos}
                  sizes="(max-width: 720px) 92vw, 300px"
                />
                <div style={{ ...plateLine, marginTop: 10 }}>{photo.plate}</div>
                <div
                  style={{
                    marginTop: 11,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => void toggleKeep(photo.id)}
                    aria-pressed={isKept}
                    style={{
                      minHeight: 40,
                      padding: "0 12px",
                      borderRadius: 3,
                      cursor: "pointer",
                      fontFamily: "var(--font-ui)",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      border: "1px solid rgba(20,42,43,0.24)",
                      background: isKept ? "var(--ink)" : "transparent",
                      color: isKept ? "var(--text-wordmark)" : "var(--text-ink-mid)",
                    }}
                  >
                    {isKept ? "Kept" : "Keep this one"}
                  </button>
                  <a
                    href={`/api/session/photo/${photo.id}`}
                    onClick={() =>
                      say(
                        `Downloading ${photo.plate} — full size, straight off the desk.`,
                      )
                    }
                    className="ink-quiet-button"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      minHeight: 40,
                      padding: "0 12px",
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "var(--text-ink-muted)",
                    }}
                  >
                    Download
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {onlyKept && kept.length === 0 ? (
        <div
          style={{
            padding: "44px 0 8px",
            fontFamily: "var(--font-hand)",
            fontSize: 26,
            lineHeight: 1.3,
            color: "var(--hand-body)",
          }}
        >
          Nothing kept yet. Plenty of time.
        </div>
      ) : null}

      <div
        style={{
          ...paperNote,
          marginTop: "clamp(36px,5vw,54px)",
          transform: "rotate(-0.5deg)",
        }}
      >
        <div aria-hidden style={noteMarginRule} />
        <div
          style={{
            position: "relative",
            paddingLeft: "clamp(38px,10vw,66px)",
            maxWidth: "58ch",
          }}
        >
          <Editable id="session.noteBody" style={noteBodyText} />
          <div style={{ ...signature, marginTop: "clamp(24px,4vw,32px)" }}>
            Joshua
          </div>
        </div>
      </div>
    </section>
  );
}
