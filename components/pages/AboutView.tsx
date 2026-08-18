"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Editable } from "../Editable";
import { SiteFrame } from "../SiteFrame";
import { useSite } from "../SiteProvider";
import {
  badgeDark,
  badgeIvory,
  bodyText,
  h1,
  h2,
  handAside,
  noteMarginRule,
  noteRuling,
  paperNote,
  plateLine,
  printMat,
  shell,
  signature,
  tape,
} from "@/lib/tokens";

const TAGS = [
  { id: "about.tag1", rotation: "rotate(-1deg)" },
  { id: "about.tag2", rotation: "rotate(0.8deg)" },
  { id: "about.tag3", rotation: "rotate(-0.6deg)" },
  { id: "about.tag4", rotation: "rotate(1.1deg)" },
  { id: "about.tag5", rotation: "rotate(-1.3deg)" },
];

const NOTE_PARAGRAPHS = ["about.note1", "about.note2", "about.note3"];

export function AboutView() {
  const { admin, portrait, setPortrait } = useSite();
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState("");

  async function onPortraitFile(file: File | undefined) {
    if (!file) return;
    setUploadError("");
    const body = new FormData();
    body.append("file", file);
    const response = await fetch("/api/images/about.portrait", {
      method: "POST",
      body,
    });
    if (!response.ok) {
      const detail = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      setUploadError(detail?.message ?? "That photo wouldn't upload.");
      return;
    }
    const { url } = (await response.json()) as { url: string };
    setPortrait(url);
  }

  return (
    <SiteFrame active="about" editablePhoto>
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
            flex: "1 1 300px",
            minWidth: 0,
            maxWidth: 380,
            position: "relative",
            transform: "rotate(-1.4deg)",
          }}
        >
          <div
            style={printMat(
              "14px 14px 19px",
              "0 26px 52px rgba(0,0,0,0.5),0 3px 0 rgba(0,0,0,0.3)",
            )}
          >
            <div
              style={{
                position: "relative",
                width: "100%",
                aspectRatio: "4 / 5",
                overflow: "hidden",
                background: "#e9e4d5",
              }}
            >
              {portrait ? (
                <Image
                  src={portrait}
                  alt="Portrait of Joshua Davis"
                  fill
                  sizes="(max-width: 720px) 92vw, 380px"
                  unoptimized
                  style={{ objectFit: "cover", filter: "saturate(0.9)" }}
                />
              ) : (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#8b9490",
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    textAlign: "center",
                    padding: 20,
                  }}
                >
                  Portrait coming soon
                </div>
              )}

              {admin ? (
                <>
                  <button
                    type="button"
                    onClick={() => fileInput.current?.click()}
                    className="portrait-replace"
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "rgba(9,18,19,0.55)",
                      border: 0,
                      cursor: "pointer",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-ui)",
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.16em",
                        textTransform: "uppercase",
                        color: "var(--text-wordmark)",
                        padding: "10px 18px",
                        border: "1px solid rgba(232,227,215,0.5)",
                        borderRadius: 3,
                      }}
                    >
                      Replace photo
                    </span>
                  </button>
                  <input
                    ref={fileInput}
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      void onPortraitFile(event.target.files?.[0])
                    }
                    style={{ display: "none" }}
                  />
                </>
              ) : null}
            </div>
            <Editable
              id="about.portraitCaption"
              style={{ ...plateLine, marginTop: 12 }}
            />
            {uploadError ? (
              <div
                role="status"
                style={{
                  marginTop: 8,
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  color: "#7c4a2c",
                }}
              >
                {uploadError}
              </div>
            ) : null}
          </div>
          <div
            aria-hidden
            style={tape("olive", {
              top: -13,
              left: -15,
              width: 118,
              height: 30,
              transform: "rotate(-19deg)",
            })}
          />
          <div
            aria-hidden
            style={tape("cream", {
              bottom: -10,
              right: -13,
              width: 100,
              height: 27,
              transform: "rotate(-8deg)",
            })}
          />
        </div>

        <div style={{ flex: "1.4 1 360px", minWidth: 0, paddingTop: 6 }}>
          <Editable id="about.badge" style={badgeIvory("lg")} />
          <Editable
            id="about.title"
            as="h1"
            style={{ ...h1, margin: "14px 0 0", lineHeight: 1.04 }}
          />
          <Editable
            id="about.hand"
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
            id="about.body"
            as="p"
            style={{ ...bodyText, margin: "22px 0 0", maxWidth: "46ch" }}
          />
        </div>
      </section>

      <section style={shell({ margin: "70px auto 0" })}>
        <div style={{ ...paperNote, transform: "rotate(0.5deg)" }}>
          <div aria-hidden style={noteMarginRule} />
          <div aria-hidden style={noteRuling} />
          <div
            style={{
              position: "relative",
              paddingLeft: "clamp(38px,10vw,66px)",
              maxWidth: "64ch",
            }}
          >
            <div style={{ marginBottom: 20 }}>
              <Editable
                id="about.noteEyebrow"
                style={badgeDark("lg", { transform: "rotate(-1.1deg)" })}
              />
            </div>
            {NOTE_PARAGRAPHS.map((id, index) => (
              <Editable
                key={id}
                id={id}
                style={{
                  marginTop: index === 0 ? undefined : 22,
                  fontFamily: "var(--font-hand)",
                  fontSize: "clamp(21px,4.4vw,27px)",
                  lineHeight: 1.3,
                  color: "var(--ink)",
                }}
              />
            ))}
            <div style={signature}>Joshua</div>
          </div>
        </div>
      </section>

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
          <Editable id="about.bagTitle" as="h2" style={h2} />
          <Editable
            id="about.bagHand"
            as="span"
            style={{ ...handAside, paddingBottom: 2 }}
          />
        </div>
        <div style={{ marginTop: 16, height: 1, background: "var(--rule)" }} />

        <div
          style={{
            marginTop: "clamp(30px,4vw,40px)",
            transform: "rotate(-0.4deg)",
            background: "var(--cream)",
            boxShadow: "0 22px 44px rgba(0,0,0,0.5)",
            padding: "clamp(24px,4vw,34px) clamp(22px,4vw,32px)",
          }}
        >
          <Editable
            id="about.bagIntro"
            style={{
              fontFamily: "var(--font-hand)",
              fontSize: 24,
              lineHeight: 1.4,
              color: "var(--text-ink-soft)",
              maxWidth: "56ch",
            }}
          />
          <div
            style={{
              marginTop: 22,
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            {TAGS.map((chip) => (
              <Editable
                key={chip.id}
                id={chip.id}
                style={{
                  transform: chip.rotation,
                  display: "inline-block",
                  padding: "7px 14px",
                  borderRadius: 3,
                  background:
                    "linear-gradient(180deg,#31403d 0%,#1e2a28 55%,#182220 100%)",
                  color: "#eef0e8",
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  letterSpacing: "0.04em",
                }}
              />
            ))}
          </div>
        </div>

        <div
          style={{ marginTop: 52, display: "flex", justifyContent: "flex-end" }}
        >
          <Editable
            id="about.backLink"
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
    </SiteFrame>
  );
}
