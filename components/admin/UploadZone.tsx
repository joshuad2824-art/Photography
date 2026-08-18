"use client";

import { useRef, useState } from "react";
import { Button } from "../ui";
import { inkNote } from "@/lib/tokens";
import type { StoredUpload } from "@/lib/uploads";

/**
 * "Drag photographs here from your Mac." Full-size frames off the card are
 * fine — the server makes the web sizes.
 */
export function UploadZone({
  hasPhotos,
  hint,
  onAdded,
  onMessage,
}: {
  hasPhotos: boolean;
  hint: string;
  onAdded: (photos: StoredUpload[]) => void;
  onMessage: (message: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);

  async function send(list: FileList | null | undefined) {
    const files = Array.from(list ?? []).filter((file) =>
      file.type.startsWith("image/"),
    );
    if (!files.length) return;

    setBusy(true);
    onMessage(
      files.length === 1
        ? "Reading one photograph…"
        : `Reading ${files.length} photographs…`,
    );

    const body = new FormData();
    for (const file of files) body.append("files", file);

    try {
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body,
      });
      const result = (await response.json().catch(() => null)) as {
        photos?: StoredUpload[];
        skipped?: string[];
        message?: string;
      } | null;

      if (!response.ok || !result?.photos?.length) {
        onMessage(result?.message ?? "Those wouldn't upload.");
        return;
      }

      onAdded(result.photos);
      const added = result.photos.length;
      const skipped = result.skipped?.length ?? 0;
      onMessage(
        `${added} ${added === 1 ? "photograph" : "photographs"} added.` +
          (skipped ? ` ${skipped} I couldn't read.` : ""),
      );
    } catch {
      onMessage("The upload didn't get through. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="drop-zone"
      data-over={over}
      onDragOver={(event) => {
        event.preventDefault();
        setOver(true);
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        setOver(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setOver(false);
        void send(event.dataTransfer?.files);
      }}
      style={{
        marginTop: 12,
        padding: "clamp(20px,3vw,28px)",
        border: "1px dashed rgba(20,42,43,0.34)",
        borderRadius: 3,
        background: "rgba(255,253,246,0.6)",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "14px 20px",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontFamily: "var(--font-hand)",
            fontSize: 24,
            lineHeight: 1.24,
            color: "var(--ink)",
          }}
        >
          {busy
            ? "Working through them…"
            : hasPhotos
              ? "Drop more in — they land at the end."
              : "Drag photographs here from your Mac."}
        </div>
        <div style={{ ...inkNote, marginTop: 7 }}>{hint}</div>
      </div>
      <Button
        variant="secondary"
        disabled={busy}
        onClick={() => input.current?.click()}
      >
        Choose files
      </Button>
      <input
        ref={input}
        type="file"
        multiple
        accept="image/*"
        onChange={(event) => {
          void send(event.target.files);
          event.target.value = "";
        }}
        style={{ display: "none" }}
      />
    </div>
  );
}
