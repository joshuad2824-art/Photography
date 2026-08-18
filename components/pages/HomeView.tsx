"use client";

import { useState } from "react";
import { Editable } from "../Editable";
import { Photo } from "../Photo";
import { SiteFrame } from "../SiteFrame";
import { Button, Field, Input } from "../ui";
import { patchCaption } from "../album-actions";
import type { Album, AlbumPhoto } from "@/lib/albums";
import { homeCardScatter } from "@/lib/scatter";
import {
  badgeDark,
  badgeIvory,
  bodyText,
  h1,
  h2,
  handAside,
  noteBodyText,
  noteMarginRule,
  noteRuling,
  paperNote,
  printMat,
  shell,
  signature,
  tape,
} from "@/lib/tokens";

export function HomeView({
  picks,
}: {
  /** Photographs Joshua has flagged for the home page, in album order. */
  picks: Array<{ album: Album; photo: AlbumPhoto }>;
}) {
  const [passphrase, setPassphrase] = useState("");
  const [note, setNote] = useState("");
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
        window.location.href = "/session";
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
    <SiteFrame active="home">
      {/* Hero: one taped print, the invitation beside it. */}
      <section
        style={shell({
          padding: "clamp(34px,6vw,46px) var(--shell-pad) 0",
          display: "flex",
          flexWrap: "wrap",
          gap: "clamp(30px,4vw,44px)",
          alignItems: "flex-start",
        })}
      >
        <div
          style={{
            flex: "1.5 1 420px",
            minWidth: 0,
            position: "relative",
            transform: "rotate(-1.3deg)",
          }}
        >
          <div
            style={printMat(
              "15px 15px 20px",
              "0 26px 52px rgba(0,0,0,0.5),0 3px 0 rgba(0,0,0,0.3)",
            )}
          >
            <Photo
              src="/photos/high-country.jpg"
              alt="Grass and ridgeline above the treeline"
              ratio="3 / 2"
              sizes="(max-width: 720px) 92vw, 620px"
              priority
            />
            <div
              style={{
                marginTop: 13,
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              <Editable
                id="home.heroCaption"
                style={{
                  fontFamily: "var(--font-hand)",
                  fontSize: 26,
                  lineHeight: 1.16,
                  color: "var(--ink)",
                }}
              />
              <div style={badgeDark("sm", { whiteSpace: "nowrap" })}>
                Aug 2026
              </div>
            </div>
          </div>
          <div
            aria-hidden
            style={tape("olive", {
              top: -13,
              left: -16,
              width: 126,
              height: 32,
              transform: "rotate(-21deg)",
            })}
          />
          <div
            aria-hidden
            style={tape("cream", {
              bottom: -11,
              right: -14,
              width: 112,
              height: 29,
              transform: "rotate(-9deg)",
            })}
          />
        </div>

        <div style={{ flex: "1 1 340px", minWidth: 0, paddingTop: 6 }}>
          <Editable id="home.badge" style={badgeIvory("lg")} />
          <Editable
            id="home.heroTitle"
            as="h1"
            style={{
              ...h1,
              margin: "14px 0 0",
              fontSize: "clamp(34px,4.6vw,54px)",
            }}
          />
          <Editable
            id="home.heroHand"
            style={{
              margin: "20px 0 0",
              fontFamily: "var(--font-hand)",
              fontSize: "clamp(23px,2.3vw,29px)",
              lineHeight: 1.36,
              color: "var(--hand-body)",
              textWrap: "pretty",
            }}
          />
          <Editable
            id="home.heroBody"
            as="p"
            style={{ ...bodyText, margin: "22px 0 0", maxWidth: "40ch" }}
          />
          <div
            style={{
              marginTop: 26,
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <Button onClick={() => (window.location.href = "/galleries")}>
              Look through the galleries
            </Button>
            <Button
              variant="secondary"
              onClick={() => (window.location.href = "/session")}
            >
              I have a passphrase
            </Button>
          </div>
          <div style={{ marginTop: 30 }}>
            <Editable
              id="home.noPrints"
              style={badgeIvory("sm", { transform: "rotate(-1.6deg)" })}
            />
          </div>
        </div>
      </section>

      {/* Pasted in lately */}
      <section
        style={shell({ padding: "clamp(46px,7vw,64px) var(--shell-pad) 0" })}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 18,
            flexWrap: "wrap",
          }}
        >
          <Editable id="home.recentTitle" as="h2" style={h2} />
          <Editable
            id="home.recentHand"
            as="span"
            style={{ ...handAside, paddingBottom: 2 }}
          />
        </div>
        <div style={{ marginTop: 16, height: 1, background: "var(--rule)" }} />

        <div
          style={{
            marginTop: "clamp(32px,5vw,44px)",
            display: "grid",
            gap: "clamp(30px,4vw,38px)",
            gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,240px),1fr))",
            alignItems: "start",
          }}
        >
          {picks.map(({ album, photo }, index) => {
            const scatter = homeCardScatter(index);
            return (
              <div
                key={photo.id}
                style={{
                  position: "relative",
                  transform: `rotate(${scatter.rotate})`,
                  marginTop: scatter.marginTop,
                }}
              >
                <div
                  className={`print ${scatter.liftClass}`}
                  style={printMat("12px 12px 16px")}
                >
                  <Photo
                    src={photo.src}
                    alt={photo.cap || `${album.name} — ${photo.plate}`}
                    ratio="2 / 3"
                    position={photo.pos}
                    sizes="(max-width: 720px) 92vw, 340px"
                  />
                  <Editable
                    value={photo.cap}
                    placeholder="a line in your hand, if it wants one"
                    onSave={(next) => void patchCaption(album, photo.id, next)}
                    style={{
                      marginTop: 11,
                      fontFamily: "var(--font-hand)",
                      fontSize: 23,
                      lineHeight: 1.2,
                      color: "var(--ink)",
                    }}
                  />
                  <div style={{ marginTop: 10 }}>
                    <div style={badgeDark("sm", { transform: scatter.plateRotate })}>
                      {photo.plate}
                    </div>
                  </div>
                </div>
                <div aria-hidden style={scatter.tape} />
              </div>
            );
          })}
        </div>

        <div
          style={{
            marginTop: 52,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <Editable
            id="home.moreLink"
            as="a"
            href="/galleries"
            className="hand-link"
            style={{
              fontFamily: "var(--font-hand)",
              fontSize: 26,
              lineHeight: 1,
              color: "var(--amber-hand)",
              cursor: "pointer",
              borderBottom: "2px solid rgba(198,134,47,0.5)",
              padding: "9px 0 7px",
            }}
          />
        </div>
      </section>

      {/* A note before you look */}
      <section style={shell({ margin: "70px auto 0" })}>
        <div style={{ ...paperNote, transform: "rotate(-0.5deg)" }}>
          <div aria-hidden style={noteMarginRule} />
          <div aria-hidden style={noteRuling} />
          <div
            style={{
              position: "relative",
              paddingLeft: "clamp(38px,10vw,66px)",
              maxWidth: "60ch",
            }}
          >
            <div style={{ marginBottom: 20 }}>
              <Editable
                id="home.noteBadge"
                style={badgeDark("lg", { transform: "rotate(-1.1deg)" })}
              />
            </div>
            <Editable id="home.noteBody" style={noteBodyText} />
            <div style={signature}>Joshua</div>
          </div>
        </div>
      </section>

      {/* Your gallery is waiting */}
      <section style={shell({ margin: "66px auto 0" })}>
        <div
          className="on-paper"
          style={{
            display: "grid",
            gap: 38,
            gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,280px),1fr))",
            alignItems: "center",
            background: "var(--paper-stock)",
            color: "var(--ink)",
            padding: "clamp(26px,4.6vw,44px) clamp(20px,4.4vw,42px)",
            boxShadow: "0 26px 54px rgba(0,0,0,0.5)",
          }}
        >
          <div>
            <div style={{ marginBottom: 18 }}>
              <Editable
                id="home.ctaEyebrow"
                style={badgeDark("lg", { transform: "rotate(-1.3deg)" })}
              />
            </div>
            <Editable
              id="home.ctaTitle"
              as="h2"
              style={{
                margin: "0 0 12px",
                fontFamily: "var(--font-editorial)",
                fontWeight: 700,
                fontSize: "clamp(24px,2.8vw,32px)",
                lineHeight: 1.1,
                color: "var(--ink)",
              }}
            />
            <Editable
              id="home.ctaBody"
              style={{
                fontFamily: "var(--font-hand)",
                fontSize: 25,
                lineHeight: 1.34,
                color: "var(--text-ink-mid)",
                maxWidth: "34ch",
              }}
            />
          </div>
          <div
            style={{
              background: "var(--cream)",
              padding: "clamp(18px,3vw,24px)",
              boxShadow:
                "4px 4px 0 rgba(20,42,43,0.2),inset 0 0 0 1px rgba(20,42,43,0.1)",
            }}
          >
            <Field
              label="Passphrase"
              htmlFor="home-passphrase"
              error={note}
              errorId="home-passphrase-error"
            >
              <Input
                id="home-passphrase"
                value={passphrase}
                placeholder="the word I sent you"
                onChange={(value) => {
                  setPassphrase(value);
                  setNote("");
                }}
                onEnter={() => void attempt()}
                ariaInvalid={Boolean(note)}
                ariaDescribedBy="home-passphrase-error"
              />
            </Field>
            <Editable
              id="home.ctaHint"
              style={{
                marginTop: 9,
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "var(--text-ink-muted)",
              }}
            />
            <div style={{ marginTop: 16 }}>
              <Button fullWidth disabled={busy} onClick={() => void attempt()}>
                Open my gallery
              </Button>
            </div>
          </div>
        </div>
      </section>
    </SiteFrame>
  );
}
