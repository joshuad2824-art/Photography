"use client";

import type { CSSProperties, FocusEvent, MouseEvent } from "react";
import { defaultContent } from "@/lib/content";
import { useSite } from "./SiteProvider";

type Tag = "div" | "span" | "p" | "h1" | "h2" | "h3" | "a";

/**
 * A block of copy Joshua can rewrite in place once he's signed in.
 *
 * Signed out this is an ordinary element — no editing chrome, no client-side
 * copy store. Signed in it becomes contentEditable and saves on blur.
 *
 * Most blocks live in the site copy store, keyed by `id`. Album and gallery
 * copy lives in its own record instead: pass `value` and `onSave` and the
 * block writes there, which is how a caption can be edited both in the admin
 * worksheet and by clicking it on the live page.
 */
export function Editable({
  id,
  fallback,
  value,
  onSave,
  as = "div",
  style,
  className,
  href,
  title,
  ariaCurrent,
  placeholder,
  onClick,
}: {
  id?: string;
  /** Default text when the id isn't part of the shipped copy. */
  fallback?: string;
  /** Text owned by another record. Takes precedence over the copy store. */
  value?: string;
  onSave?: (next: string) => void;
  as?: Tag;
  style?: CSSProperties;
  className?: string;
  href?: string;
  title?: string;
  ariaCurrent?: "page";
  /** Shown only to a signed-in admin when the block is empty. */
  placeholder?: string;
  onClick?: () => void;
}) {
  const { content, admin, saveText } = useSite();

  const stored = id
    ? (content[id] ??
      fallback ??
      defaultContent[id as keyof typeof defaultContent] ??
      "")
    : (fallback ?? "");
  const text = value !== undefined ? value : stored;

  const Tag = as as "div";

  const handleBlur = (event: FocusEvent<HTMLElement>) => {
    const next = event.currentTarget.textContent ?? "";
    if (next.trim() === text.trim()) return;
    if (onSave) onSave(next.replace(/\s+/g, " ").trim());
    else if (id) saveText(id, next);
  };

  if (!admin && !text) return null;

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
            ...(href
              ? { onClick: (event: MouseEvent) => event.preventDefault() }
              : {}),
          }
        : {})}
    >
      {text || (admin ? placeholder : "")}
    </Tag>
  );
}
