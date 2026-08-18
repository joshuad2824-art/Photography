import type { CSSProperties } from "react";

/**
 * Style primitives lifted verbatim from the design prototypes in
 * design_handoff_photography_site/design/. Values here are final — the handoff
 * calls the pages high-fidelity, so prefer reusing these over re-typing numbers.
 */

export const SHELL_MAX = 1120;

export const pageShell: CSSProperties = {
  minHeight: "100vh",
  background: "var(--desk-content)",
  color: "var(--text-primary)",
  fontFamily: "var(--font-body)",
  position: "relative",
  overflowX: "hidden",
};

/* --- Desk background stack ------------------------------------------------ */

export const glowLayer: CSSProperties = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  background:
    "radial-gradient(980px 1180px at 4% 300px, rgba(198,134,47,0.155), rgba(0,0,0,0) 68%)," +
    "radial-gradient(74% 48% at 16% 86%, rgba(198,134,47,0.15), rgba(0,0,0,0) 72%)," +
    "radial-gradient(46% 30% at 84% 6%, rgba(120,150,140,0.07), rgba(0,0,0,0) 74%)",
};

export const wearLayer: CSSProperties = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  opacity: 0.9,
  backgroundImage: "url('/textures/desk-wear.png')",
  backgroundSize: "100% 100%",
  backgroundRepeat: "no-repeat",
};

export const grainLayer: CSSProperties = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  opacity: 0.34,
  backgroundImage: "url('/textures/desk-grain.png')",
  backgroundSize: "256px 256px",
  backgroundRepeat: "repeat",
};

export const vignetteLayer: CSSProperties = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  background:
    "radial-gradient(120% 80% at 50% 40%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.34) 100%)",
};

/* --- Layout --------------------------------------------------------------- */

export const shell = (extra: CSSProperties = {}): CSSProperties => ({
  position: "relative",
  zIndex: 3,
  maxWidth: SHELL_MAX,
  margin: "0 auto",
  padding: "0 var(--shell-pad)",
  ...extra,
});

/* --- Badges --------------------------------------------------------------- */

const ivorySurface = {
  borderRadius: 3,
  background: "linear-gradient(180deg,#e8e3d2 0%,#d6d0bc 55%,#cbc4ae 100%)",
  color: "#1d2a28",
  fontFamily: "var(--font-ui)",
  fontWeight: 700,
  textTransform: "uppercase" as const,
  boxShadow:
    "inset 0 1px 0 rgba(255,255,255,0.6),inset 0 -1px 0 rgba(0,0,0,0.22),0 3px 9px rgba(0,0,0,0.48)",
  textShadow: "0 1px 0 rgba(255,255,255,0.55)",
};

const darkSurface = {
  borderRadius: 3,
  background: "linear-gradient(180deg,#31403d 0%,#1e2a28 55%,#182220 100%)",
  color: "#eef0e8",
  fontFamily: "var(--font-ui)",
  fontWeight: 700,
  textTransform: "uppercase" as const,
  boxShadow:
    "inset 0 1px 0 rgba(255,255,255,0.16),inset 0 -1px 0 rgba(0,0,0,0.55),0 2px 6px rgba(20,42,43,0.3)",
  textShadow: "0 -1px 0 rgba(0,0,0,0.5),0 1px 0 rgba(255,255,255,0.18)",
};

export type BadgeSize = "sm" | "md" | "lg";

const badgeSize: Record<BadgeSize, CSSProperties> = {
  sm: { padding: "5px 11px", fontSize: 9, letterSpacing: "0.22em" },
  md: { padding: "6px 13px", fontSize: 10, letterSpacing: "0.24em" },
  lg: { padding: "7px 15px", fontSize: 11, letterSpacing: "0.26em" },
};

export const badgeIvory = (
  size: BadgeSize = "lg",
  extra: CSSProperties = {},
): CSSProperties => ({
  display: "inline-block",
  ...ivorySurface,
  ...badgeSize[size],
  ...extra,
});

export const badgeDark = (
  size: BadgeSize = "lg",
  extra: CSSProperties = {},
): CSSProperties => ({
  display: "inline-block",
  ...darkSurface,
  ...badgeSize[size],
  ...extra,
});

/* --- Tape ----------------------------------------------------------------- */

/**
 * Corner tape. Two paper stocks appear in the prototypes: an olive kraft strip
 * and a paler cream one, each a rotated rectangle of crossed hairlines.
 */
export type TapeStock = "olive" | "cream";

const tapeStock: Record<TapeStock, string> = {
  olive:
    "repeating-linear-gradient(90deg,rgba(38,42,30,0.5) 0 1px,rgba(0,0,0,0) 1px 8px)," +
    "repeating-linear-gradient(0deg,rgba(38,42,30,0.5) 0 1px,rgba(0,0,0,0) 1px 8px)," +
    "linear-gradient(178deg,rgba(150,143,104,0.94),rgba(126,120,85,0.9))",
  cream:
    "repeating-linear-gradient(90deg,rgba(42,46,40,0.5) 0 1px,rgba(0,0,0,0) 1px 7px)," +
    "repeating-linear-gradient(0deg,rgba(42,46,40,0.5) 0 1px,rgba(0,0,0,0) 1px 7px)," +
    "linear-gradient(178deg,rgba(226,219,198,0.94),rgba(203,195,170,0.9))",
};

export const tape = (
  stock: TapeStock,
  geometry: CSSProperties,
): CSSProperties => ({
  position: "absolute",
  background: tapeStock[stock],
  boxShadow: "0 3px 8px rgba(0,0,0,0.42)",
  ...geometry,
});

/* --- Prints and paper ----------------------------------------------------- */

export const photoFilter = "saturate(0.84) contrast(1.04)";

export const printMat = (
  padding: string,
  shadow = "0 22px 44px rgba(0,0,0,0.5)",
): CSSProperties => ({
  background: "var(--cream)",
  padding,
  boxShadow: shadow,
});

export const photoImg = (
  ratio: string,
  position = "50% 50%",
): CSSProperties => ({
  width: "100%",
  display: "block",
  aspectRatio: ratio,
  objectFit: "cover",
  objectPosition: position,
  filter: photoFilter,
});

export const paperNote: CSSProperties = {
  position: "relative",
  background: "var(--paper)",
  boxShadow: "0 26px 54px rgba(0,0,0,0.52)",
  padding:
    "clamp(26px,4.4vw,38px) clamp(20px,4.4vw,40px) clamp(28px,4.4vw,40px)",
};

/** The red margin rule down the left of a legal-pad note. */
export const noteMarginRule: CSSProperties = {
  position: "absolute",
  top: 0,
  bottom: 0,
  left: "calc(clamp(20px,4.4vw,40px) + clamp(14px,5.4vw,34px))",
  width: 1,
  background: "rgba(160,66,44,0.34)",
};

/** The faint horizontal ruling behind a note's hand-written body. */
export const noteRuling: CSSProperties = {
  position: "absolute",
  top: "clamp(26px,4.4vw,38px)",
  right: "clamp(20px,4.4vw,40px)",
  bottom: "clamp(28px,4.4vw,40px)",
  left: "calc(clamp(20px,4.4vw,40px) + clamp(38px,10vw,66px))",
  pointerEvents: "none",
  background:
    "repeating-linear-gradient(to bottom, rgba(0,0,0,0) 0 calc(1.28em - 1px), rgba(20,42,43,0.12) calc(1.28em - 1px) 1.28em)",
  fontSize: "clamp(21px,4.4vw,27px)",
};

export const noteBodyText: CSSProperties = {
  fontFamily: "var(--font-hand)",
  fontSize: "clamp(21px,4.4vw,27px)",
  lineHeight: 1.28,
  color: "var(--ink)",
};

export const signature: CSSProperties = {
  marginTop: "clamp(26px,4vw,34px)",
  fontFamily: "var(--font-hand)",
  fontSize: "clamp(26px,5vw,32px)",
  lineHeight: 1,
  color: "var(--ink)",
};

/* --- Type ----------------------------------------------------------------- */

export const h1: CSSProperties = {
  margin: 0,
  fontFamily: "var(--font-editorial)",
  fontWeight: 700,
  fontSize: "clamp(32px,4.4vw,50px)",
  lineHeight: 1.02,
  color: "var(--text-bright)",
  textWrap: "pretty",
};

export const h2: CSSProperties = {
  margin: 0,
  fontFamily: "var(--font-editorial)",
  fontWeight: 700,
  fontSize: "clamp(25px,3vw,34px)",
  lineHeight: 1,
  color: "var(--text-bright)",
};

export const bodyText: CSSProperties = {
  fontSize: 16,
  lineHeight: 1.62,
  color: "var(--text-muted)",
  textWrap: "pretty",
};

export const handAside: CSSProperties = {
  fontFamily: "var(--font-hand)",
  fontSize: 24,
  lineHeight: 1,
  color: "var(--amber-hand)",
};

export const monoMeta: CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 11,
  letterSpacing: "0.06em",
  color: "var(--text-faint)",
};

export const plateLine: CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 10,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "var(--text-ink-muted)",
};

export const hairline: CSSProperties = {
  height: 1,
  background: "var(--rule)",
};
