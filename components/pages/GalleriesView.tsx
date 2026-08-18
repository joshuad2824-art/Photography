"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { Editable } from "../Editable";
import { Photo } from "../Photo";
import { SiteFrame } from "../SiteFrame";
import type { Album } from "@/lib/galleries";
import {
  badgeDark,
  badgeIvory,
  bodyText,
  h1,
  photoFilter,
  plateLine,
  printMat,
  shell,
  tape,
} from "@/lib/tokens";

/**
 * The drawer and what's in it. Index and album detail are two states of one
 * page — the handoff is explicit that opening a pile does not change the URL.
 */
export function GalleriesView({ albums }: { albums: Album[] }) {
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [lightIndex, setLightIndex] = useState(-1);
  const [viewport, setViewport] = useState({ w: 1200, h: 900 });

  const album = albums.find((a) => a.slug === openSlug) ?? null;
  const photos = album?.photos ?? [];

  useEffect(() => {
    const onResize = () =>
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const closeLight = useCallback(() => setLightIndex(-1), []);

  const step = useCallback(
    (delta: number) => {
      setLightIndex((current) => {
        if (current < 0 || photos.length === 0) return current;
        return (current + delta + photos.length) % photos.length;
      });
    },
    [photos.length],
  );

  // Arrow keys and Escape drive the lightbox; the page behind it stops scrolling.
  useEffect(() => {
    if (lightIndex < 0) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeLight();
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightIndex, closeLight, step]);

  function openAlbum(slug: string) {
    setOpenSlug(slug);
    setLightIndex(-1);
    window.scrollTo(0, 0);
  }

  function backToIndex() {
    setOpenSlug(null);
    setLightIndex(-1);
    window.scrollTo(0, 0);
  }

  const light = lightIndex >= 0 ? photos[lightIndex] : null;

  /** Fit the lightbox print to whatever room the viewport leaves. */
  const box = (() => {
    const pad = viewport.w < 560 ? 10 : 16;
    const availW =
      Math.min(880, viewport.w - (viewport.w < 560 ? 20 : 44)) - pad * 2;
    const availH = viewport.h - 44 - 54 - pad * 2 - 104;
    const [num, den] = light ? light.ratio.split("/") : ["1", "1"];
    const ratio = Number(num.trim()) / Number(den.trim());
    const height = Math.max(160, Math.min(availH, availW / ratio));
    return { w: Math.round(height * ratio), h: Math.round(height), pad };
  })();

  return (
    <SiteFrame active="galleries">
      {!album ? (
        <section
          style={shell({ padding: "clamp(34px,6vw,48px) var(--shell-pad) 0" })}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "flex-end",
              gap: "16px 22px",
            }}
          >
            <Editable
              id="galleries.title"
              as="h1"
              style={{ ...h1, fontSize: "clamp(32px,4.4vw,50px)" }}
            />
            <Editable
              id="galleries.hand"
              style={{
                fontFamily: "var(--font-hand)",
                fontSize: "clamp(22px,2.2vw,27px)",
                lineHeight: 1.2,
                color: "var(--amber-hand)",
                paddingBottom: 6,
              }}
            />
          </div>
          <Editable
            id="galleries.intro"
            as="p"
            style={{ ...bodyText, margin: "18px 0 0", maxWidth: "52ch" }}
          />

          <div
            style={{
              marginTop: "clamp(38px,5vw,54px)",
              columns: "300px",
              columnGap: "clamp(28px,4vw,40px)",
            }}
          >
            {albums.map((item) => (
              <div
                key={item.slug}
                role="button"
                tabIndex={0}
                aria-label={`Open ${item.title}`}
                onClick={() => openAlbum(item.slug)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openAlbum(item.slug);
                  }
                }}
                style={{
                  breakInside: "avoid",
                  margin: "0 0 clamp(34px,4.4vw,46px)",
                  marginLeft: item.card.ml === "0" ? undefined : item.card.ml,
                  width: item.card.w,
                  transform: `rotate(${item.card.rot})`,
                  cursor: "pointer",
                }}
              >
                <div
                  className={`print ${item.card.liftClass}`}
                  style={printMat(
                    item.card.matPadding,
                    "0 24px 46px rgba(0,0,0,0.5)",
                  )}
                >
                  <Photo
                    src={item.card.cover}
                    alt={item.card.coverAlt}
                    ratio={item.card.ratio}
                    position={item.card.pos}
                    sizes="(max-width: 720px) 92vw, 320px"
                  />
                  <Editable
                    id={item.card.titleId}
                    fallback={item.title}
                    style={{
                      marginTop: 12,
                      fontFamily: "var(--font-editorial)",
                      fontWeight: 700,
                      fontSize: 24,
                      lineHeight: 1.1,
                      color: "var(--ink)",
                    }}
                  />
                  <Editable
                    id={item.card.handId}
                    fallback={item.card.hand}
                    style={{
                      marginTop: 6,
                      fontFamily: "var(--font-hand)",
                      fontSize: 22,
                      lineHeight: 1.2,
                      color: "var(--text-ink-soft)",
                    }}
                  />
                  <div
                    style={{
                      marginTop: 11,
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 9,
                      alignItems: "center",
                    }}
                  >
                    <div style={badgeDark("sm")}>{item.card.category}</div>
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 11,
                        letterSpacing: "0.06em",
                        color: "var(--text-ink-muted)",
                      }}
                    >
                      {item.card.dates}
                    </div>
                  </div>
                </div>
                <div style={{ position: "relative", height: 0 }}>
                  <div
                    aria-hidden
                    style={tape(item.card.tape.stock, item.card.tape.style)}
                  />
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: "clamp(30px,4vw,44px)",
              paddingTop: 26,
              borderTop: "1px solid var(--rule)",
              display: "flex",
              flexWrap: "wrap",
              gap: "14px 26px",
              alignItems: "baseline",
              justifyContent: "space-between",
            }}
          >
            <Editable
              id="galleries.footerNote"
              style={{
                fontFamily: "var(--font-hand)",
                fontSize: 24,
                lineHeight: 1.3,
                color: "var(--amber-hand)",
                maxWidth: "34ch",
              }}
            />
            <Editable
              id="galleries.footerLinkLabel"
              as="a"
              href="/session"
              className="footer-link"
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--text-wordmark)",
                padding: "11px 0 9px",
                borderBottom: "2px solid var(--rule-strong)",
              }}
            />
          </div>
        </section>
      ) : (
        <section
          style={shell({ padding: "clamp(30px,5vw,44px) var(--shell-pad) 0" })}
        >
          <button
            type="button"
            onClick={backToIndex}
            className="hand-link"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 9,
              minHeight: 44,
              padding: 0,
              border: 0,
              background: "transparent",
              cursor: "pointer",
              fontFamily: "var(--font-hand)",
              fontSize: 24,
              lineHeight: 1,
              color: "var(--amber-hand)",
            }}
          >
            ← back to the drawer
          </button>

          <div
            style={{
              marginTop: 14,
              display: "flex",
              flexWrap: "wrap",
              alignItems: "flex-end",
              gap: "14px 24px",
            }}
          >
            <h1 style={{ ...h1, fontSize: "clamp(30px,4.2vw,48px)", lineHeight: 1.03 }}>
              {album.title}
            </h1>
            <div style={badgeIvory("md", { marginBottom: 8 })}>
              {photos.length} {photos.length === 1 ? "print" : "prints"} ·{" "}
              {album.sub}
            </div>
          </div>
          <div
            style={{
              marginTop: 16,
              fontFamily: "var(--font-hand)",
              fontSize: "clamp(22px,2.2vw,27px)",
              lineHeight: 1.34,
              color: "var(--hand-body)",
              maxWidth: "44ch",
              textWrap: "pretty",
            }}
          >
            {album.note}
          </div>

          <div style={{ marginTop: 22, height: 1, background: "var(--rule)" }} />

          <div
            style={{
              marginTop: "clamp(34px,4.4vw,48px)",
              columns: "280px",
              columnGap: "clamp(28px,4vw,40px)",
            }}
          >
            {photos.map((photo, index) => (
              <div
                key={photo.plate}
                role="button"
                tabIndex={0}
                aria-label={`Open ${photo.plate} full screen`}
                onClick={() => setLightIndex(index)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setLightIndex(index);
                  }
                }}
                style={{
                  breakInside: "avoid",
                  margin: "0 0 clamp(32px,4vw,44px)",
                  marginLeft: photo.ml === "0" ? undefined : photo.ml,
                  cursor: "pointer",
                  width: photo.w,
                  transform: `rotate(${photo.rot})`,
                }}
              >
                <div
                  className="print pile-lift-flat"
                  style={printMat("11px 11px 15px")}
                >
                  <Photo
                    src={photo.src}
                    alt={photo.cap}
                    ratio={photo.ratio}
                    position={photo.pos}
                    sizes="(max-width: 720px) 92vw, 300px"
                  />
                  <div
                    style={{
                      marginTop: 10,
                      fontFamily: "var(--font-hand)",
                      fontSize: 22,
                      lineHeight: 1.2,
                      color: "var(--ink)",
                    }}
                  >
                    {photo.cap}
                  </div>
                  <div style={{ ...plateLine, marginTop: 9 }}>{photo.plate}</div>
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: "clamp(26px,4vw,40px)",
              display: "flex",
              flexWrap: "wrap",
              gap: "16px 26px",
              alignItems: "baseline",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-hand)",
                fontSize: 23,
                lineHeight: 1.25,
                color: "var(--text-muted)",
                maxWidth: "38ch",
              }}
            >
              More from this pile once I&rsquo;ve had a night at the scanner.
            </div>
            <button
              type="button"
              onClick={backToIndex}
              className="hand-link"
              style={{
                minHeight: 44,
                padding: 0,
                border: 0,
                background: "transparent",
                cursor: "pointer",
                fontFamily: "var(--font-hand)",
                fontSize: 26,
                lineHeight: 1,
                color: "var(--amber-hand)",
                borderBottom: "2px solid rgba(198,134,47,0.5)",
              }}
            >
              back to the drawer →
            </button>
          </div>
        </section>
      )}

      {light && album ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={light.cap}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 40,
            background: "rgba(6,14,15,0.92)",
            display: "flex",
            flexDirection: "column",
            gap: 8,
            padding: "clamp(10px,2vw,22px)",
          }}
        >
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background:
                "radial-gradient(680px 520px at 50% 42%, rgba(198,134,47,0.16), rgba(0,0,0,0) 70%)",
            }}
          />
          <button
            type="button"
            onClick={closeLight}
            aria-label="Close"
            autoFocus
            className="lightbox-button"
            style={{
              position: "fixed",
              zIndex: 3,
              top: "clamp(10px,2vw,22px)",
              right: "clamp(10px,2vw,22px)",
              minWidth: 44,
              minHeight: 44,
              border: "1px solid rgba(232,227,215,0.28)",
              borderRadius: 3,
              background: "rgba(9,18,19,0.7)",
              cursor: "pointer",
              color: "var(--text-primary)",
              fontFamily: "var(--font-mono)",
              fontSize: 18,
              lineHeight: 1,
            }}
          >
            ×
          </button>

          <div
            style={{
              position: "relative",
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                flex: "0 1 auto",
                minWidth: 0,
                minHeight: 0,
                maxWidth: "min(880px,100%)",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  background: "var(--cream)",
                  padding: box.pad,
                  boxShadow: "0 34px 70px rgba(0,0,0,0.62)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    position: "relative",
                    width: box.w,
                    height: box.h,
                    overflow: "hidden",
                  }}
                >
                  <Image
                    src={light.src}
                    alt={light.cap}
                    fill
                    sizes="880px"
                    style={{
                      objectFit: "cover",
                      objectPosition: "center",
                      filter: photoFilter,
                    }}
                  />
                </div>
                <div style={{ width: box.w }}>
                  <div
                    style={{
                      fontFamily: "var(--font-hand)",
                      fontSize: "clamp(21px,2.2vw,26px)",
                      lineHeight: 1.26,
                      color: "var(--ink)",
                    }}
                  >
                    {light.cap}
                  </div>
                  <div
                    style={{
                      marginTop: 10,
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "4px 10px",
                      alignItems: "baseline",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={plateLine}>{light.plate}</div>
                    <div style={plateLine}>{light.exif}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "clamp(14px,3vw,26px)",
            }}
          >
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous photo"
              className="lightbox-step"
              style={lightboxStep}
            >
              ←
            </button>
            <div
              style={{
                minWidth: 0,
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--text-faint)",
                textAlign: "center",
              }}
            >
              {album.title} · {lightIndex + 1} of {photos.length}
            </div>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next photo"
              className="lightbox-step"
              style={lightboxStep}
            >
              →
            </button>
          </div>
        </div>
      ) : null}
    </SiteFrame>
  );
}

const lightboxStep = {
  flex: "0 0 auto",
  width: 46,
  height: 46,
  border: "1px solid rgba(232,227,215,0.28)",
  borderRadius: 3,
  background: "transparent",
  cursor: "pointer",
  color: "var(--text-primary)",
  fontFamily: "var(--font-mono)",
  fontSize: 16,
} as const;
