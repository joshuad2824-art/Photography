"use client";

import type { CSSProperties, FocusEvent } from "react";
import { defaultContent } from "@/lib/content";
import { useSite } from "./SiteProvider";

type Tag = "div" | "span" | "p" | "h1" | "h2" | "h3" | "a";

/**
 * A block of copy Joshua can rewrite in place once he's signed in.
 *
 * Signed out this is an ordinary element — no editing chrome, no client-side
 * copy store. Signed in it becomes contentEditable and saves on blur.
 */
export function Editable({
  id,
  fallback,
  as = "div",
  style,
  className,
  href,
  title,
  ariaCurrent,
  onClick,
}: {
  id: string;
  /** Default text when the id isn't part of the shipped copy (album titles). */
  fallback?: string;
  as?: Tag;
  style?: CSSProperties;
  className?: string;
  href?: string;
  title?: string;
  ariaCurrent?: "page";
  onClick?: () => void;
}) {
  const { content, admin, saveText } = useSite();
  const text =
    content[id] ?? fallback ?? defaultContent[id as keyof typeof defaultContent] ?? "";

  const Tag = as as "div";

  const handleBlur = (event: FocusEvent<HTMLElement>) => {
    const next = event.currentTarget.textContent ?? "";
    if (next.trim() === text.trim()) return;
    saveText(id, next);
  };

  return (
    <Tag
      style={style}
      className={className}
      title={title}
      aria-current={ariaCurrent}
      onClick={onClick}
      {...(href ? { href } : {})}
      {...(admin
        ? {
            contentEditable: true,
            suppressContentEditableWarning: true,
            spellCheck: true,
            onBlur: handleBlur,
            // Keep an editable link from navigating while it is being rewritten.
            ...(href ? { onClick: (e: React.MouseEvent) => e.preventDefault() } : {}),
          }
        : {})}
    >
      {text}
    </Tag>
  );
}
