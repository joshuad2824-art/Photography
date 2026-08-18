import type { CSSProperties } from "react";
import { tape, type TapeStock } from "./tokens";

/**
 * The scattered-pile geometry.
 *
 * In the prototypes every card carried its own rotation, width, offset and
 * tape strip. Now that albums are data, that can't be authored per card — the
 * admin has no controls for it and shouldn't. So the same values cycle
 * deterministically by position, which reproduces the handoff's piles for the
 * seeded albums and gives any new one the same feel.
 */

export type Scatter = {
  width: string;
  marginLeft?: string;
  rotate: string;
};

function pick<T>(cycle: readonly T[], index: number): T {
  return cycle[((index % cycle.length) + cycle.length) % cycle.length]!;
}

/* --- Galleries index: the drawer ------------------------------------------ */

const INDEX_WIDTH = ["100%", "92%", "94%", "88%", "96%"] as const;
const INDEX_MARGIN = ["0", "0", "6%", "0", "4%"] as const;
const INDEX_ROTATE = ["-1.4deg", "1.5deg", "-0.8deg", "2deg", "-1.9deg"] as const;
const INDEX_PADDING = [
  "13px 13px 17px",
  "12px 12px 16px",
  "12px 12px 16px",
  "12px 12px 16px",
  "12px 12px 16px",
] as const;
const INDEX_LIFT = [
  "pile-lift-a",
  "pile-lift-b",
  "pile-lift-c",
  "pile-lift-d",
  "pile-lift-e",
] as const;
const INDEX_TAPE: ReadonlyArray<{ stock: TapeStock; geometry: CSSProperties }> = [
  { stock: "cream", geometry: { bottom: -6, right: 16, width: 104, height: 28, transform: "rotate(-9deg)" } },
  { stock: "olive", geometry: { bottom: -7, left: -12, width: 92, height: 26, transform: "rotate(-11deg)" } },
  { stock: "cream", geometry: { bottom: -8, left: 22, width: 88, height: 25, transform: "rotate(7deg)" } },
  { stock: "olive", geometry: { bottom: -7, right: -12, width: 92, height: 26, transform: "rotate(-14deg)" } },
  { stock: "cream", geometry: { bottom: -6, left: -14, width: 98, height: 27, transform: "rotate(11deg)" } },
];

export function indexCardScatter(index: number) {
  const marginLeft = pick(INDEX_MARGIN, index);
  const strip = pick(INDEX_TAPE, index);
  return {
    width: pick(INDEX_WIDTH, index),
    marginLeft: marginLeft === "0" ? undefined : marginLeft,
    rotate: pick(INDEX_ROTATE, index),
    matPadding: pick(INDEX_PADDING, index),
    liftClass: pick(INDEX_LIFT, index),
    tape: tape(strip.stock, strip.geometry),
  };
}

/* --- A pile's own photographs --------------------------------------------- */

const PILE_WIDTH = ["100%", "94%", "100%", "92%", "96%", "100%"] as const;
const PILE_MARGIN = ["0", "6%", "0", "6%", "4%", "0"] as const;
const PILE_ROTATE = [
  "-1.2deg",
  "1.4deg",
  "0.9deg",
  "-1.5deg",
  "1.1deg",
  "-0.7deg",
] as const;

export function pileScatter(index: number): Scatter {
  const marginLeft = pick(PILE_MARGIN, index);
  return {
    width: pick(PILE_WIDTH, index),
    marginLeft: marginLeft === "0" ? undefined : marginLeft,
    rotate: pick(PILE_ROTATE, index),
  };
}

/* --- A client's gallery ---------------------------------------------------- */

const SESSION_WIDTH = ["100%", "94%", "100%", "92%", "100%", "96%", "100%", "90%"] as const;
const SESSION_MARGIN = ["0", "6%", "0", "4%", "0", "2%", "0", "6%"] as const;
const SESSION_ROTATE = [
  "1.1deg",
  "-1.4deg",
  "0.8deg",
  "-1deg",
  "1.5deg",
  "-0.7deg",
  "0.9deg",
  "-1.6deg",
] as const;

export function sessionScatter(index: number): Scatter {
  const marginLeft = pick(SESSION_MARGIN, index);
  return {
    width: pick(SESSION_WIDTH, index),
    marginLeft: marginLeft === "0" ? undefined : marginLeft,
    rotate: pick(SESSION_ROTATE, index),
  };
}

/* --- Home: "Pasted in lately" --------------------------------------------- */

const HOME_ROTATE = ["1.1deg", "-1.4deg", "0.7deg"] as const;
const HOME_MARGIN_TOP = [undefined, "clamp(0px,3vw,26px)", "clamp(0px,1vw,8px)"] as const;
const HOME_PLATE_ROTATE = ["rotate(-1.4deg)", "rotate(1.2deg)", "rotate(-0.9deg)"] as const;
const HOME_LIFT = ["print-lift-1", "print-lift-2", "print-lift-3"] as const;
const HOME_TAPE: ReadonlyArray<{ stock: TapeStock; geometry: CSSProperties }> = [
  { stock: "cream", geometry: { top: -11, right: -12, width: 92, height: 27, transform: "rotate(16deg)" } },
  { stock: "olive", geometry: { top: -12, left: -13, width: 100, height: 28, transform: "rotate(-19deg)" } },
  { stock: "olive", geometry: { bottom: -10, right: -11, width: 86, height: 25, transform: "rotate(-12deg)" } },
];

export function homeCardScatter(index: number) {
  const strip = pick(HOME_TAPE, index);
  return {
    rotate: pick(HOME_ROTATE, index),
    marginTop: pick(HOME_MARGIN_TOP, index),
    plateRotate: pick(HOME_PLATE_ROTATE, index),
    liftClass: pick(HOME_LIFT, index),
    tape: tape(strip.stock, strip.geometry),
  };
}
