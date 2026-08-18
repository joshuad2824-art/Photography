"use client";

import Image from "next/image";
import { photoFilter } from "@/lib/tokens";

/**
 * A photograph inside a print's cream mat: cropped to the ratio the layout
 * asks for, warmed slightly, and served through next/image so the 2000px
 * originals are never shipped whole.
 */
export function Photo({
  src,
  alt,
  ratio,
  position = "50% 50%",
  sizes = "(max-width: 720px) 92vw, 360px",
  priority = false,
}: {
  src: string;
  alt: string;
  ratio: string;
  position?: string;
  sizes?: string;
  priority?: boolean;
}) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: ratio,
        display: "block",
        overflow: "hidden",
      }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        style={{
          objectFit: "cover",
          objectPosition: position,
          filter: photoFilter,
        }}
      />
    </div>
  );
}
