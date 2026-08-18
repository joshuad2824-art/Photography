"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Editable } from "./Editable";
import { tape } from "@/lib/tokens";

/** "none" is the back-of-house page: reachable, but not in the nav. */
export type NavKey = "home" | "galleries" | "session" | "about" | "none";

const NAV: Array<{ key: NavKey; href: string; id: string }> = [
  { key: "home", href: "/", id: "nav.home" },
  { key: "galleries", href: "/galleries", id: "nav.galleries" },
  { key: "session", href: "/session", id: "nav.session" },
  { key: "about", href: "/about", id: "nav.about" },
];

const navLink = (active: boolean): CSSProperties => ({
  fontFamily: "var(--font-ui)",
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: active ? "var(--text-wordmark)" : "var(--text-muted)",
  cursor: "pointer",
  padding: "11px 0 9px",
  borderBottom: `2px solid ${active ? "var(--amber)" : "transparent"}`,
});

const menuLink = (active: boolean, first: boolean): CSSProperties => ({
  display: "flex",
  alignItems: "center",
  minHeight: 46,
  padding: "0 20px",
  fontFamily: "var(--font-ui)",
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: active ? "var(--ink)" : "var(--text-ink-mid)",
  borderTop: first ? undefined : "1px solid rgba(20,42,43,0.1)",
  boxShadow: active ? "inset 3px 0 0 var(--amber)" : undefined,
});

const menuButton: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  minHeight: 44,
  padding: "0 16px",
  border: 0,
  borderRadius: 3,
  cursor: "pointer",
  background: "linear-gradient(180deg,#e8e3d2 0%,#d6d0bc 55%,#cbc4ae 100%)",
  color: "#1d2a28",
  fontFamily: "var(--font-ui)",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.26em",
  textTransform: "uppercase",
  boxShadow:
    "inset 0 1px 0 rgba(255,255,255,0.6),inset 0 -1px 0 rgba(0,0,0,0.22),0 3px 9px rgba(0,0,0,0.48)",
  textShadow: "0 1px 0 rgba(255,255,255,0.55)",
};

export function Header({ active }: { active: NavKey }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const away = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("click", away);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("click", away);
      document.removeEventListener("keydown", escape);
    };
  }, [menuOpen]);

  return (
    <>
      <header
        style={{
          position: "relative",
          // Above the page sections so the narrow-width dropdown isn't painted over.
          zIndex: 5,
          maxWidth: "var(--shell-max)",
          margin: "0 auto",
          padding: "clamp(22px,5vw,30px) var(--shell-pad) 0",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 20,
        }}
      >
        <div>
          <a
            href="/"
            style={{
              display: "block",
              fontFamily: "var(--font-display)",
              fontSize: "clamp(26px,3.4vw,36px)",
              lineHeight: 0.92,
              letterSpacing: "-0.01em",
              textTransform: "uppercase",
              color: "var(--text-wordmark)",
            }}
          >
            Joshua Davis
          </a>
          <Editable
            id="site.tagline"
            style={{
              marginTop: 9,
              fontFamily: "var(--font-hand)",
              fontSize: 23,
              lineHeight: 1,
              color: "var(--amber-hand)",
            }}
          />
        </div>

        <div
          className="narrow-only"
          ref={menuRef}
          style={{ position: "relative", paddingBottom: 4, marginLeft: "auto" }}
        >
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            style={menuButton}
          >
            Menu
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 13,
                letterSpacing: 0,
              }}
            >
              ▾
            </span>
          </button>

          {menuOpen ? (
            <div
              style={{
                position: "absolute",
                zIndex: 9,
                top: "calc(100% + 12px)",
                right: 0,
                minWidth: 220,
                transform: "rotate(-0.8deg)",
                background: "var(--paper-card)",
                padding: "8px 0",
                boxShadow:
                  "0 22px 44px rgba(0,0,0,0.55),inset 0 0 0 1px rgba(20,42,43,0.12)",
              }}
            >
              <div
                aria-hidden
                style={tape("cream", {
                  top: -13,
                  right: 26,
                  width: 76,
                  height: 26,
                  transform: "rotate(-8deg)",
                })}
              />
              {NAV.map((item, index) => (
                <Editable
                  key={item.key}
                  id={item.id}
                  as="a"
                  href={item.href}
                  className="menu-link"
                  ariaCurrent={item.key === active ? "page" : undefined}
                  style={menuLink(item.key === active, index === 0)}
                />
              ))}
            </div>
          ) : null}
        </div>

        <nav
          className="wide-only"
          style={{
            flexWrap: "wrap",
            alignItems: "center",
            gap: "2px clamp(16px,2.4vw,22px)",
          }}
        >
          {NAV.map((item) => (
            <Editable
              key={item.key}
              id={item.id}
              as="a"
              href={item.href}
              className="nav-link"
              ariaCurrent={item.key === active ? "page" : undefined}
              style={navLink(item.key === active)}
            />
          ))}
        </nav>
      </header>

      <div
        style={{
          position: "relative",
          zIndex: 3,
          maxWidth: "var(--shell-max)",
          margin: "22px auto 0",
          padding: "0 var(--shell-pad)",
        }}
      >
        <div style={{ height: 2, background: "var(--text-primary)" }} />
        <div
          style={{ height: 1, marginTop: 3, background: "var(--rule-strong)" }}
        />
      </div>
    </>
  );
}
