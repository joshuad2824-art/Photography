"use client";

import { useRef, useState } from "react";
import { Button } from "../ui";
import { inkNote } from "@/lib/tokens";
import { BATCH_BYTES, BATCH_FILES, whyNotSendable } from "@/lib/photo-files";
import type { StoredUpload } from "@/lib/uploads";

/**
 * "Drag photographs here from your Mac." Full-size frames off the card are
 * fine — the server makes the web sizes.
 *
 * Two things this zone owes Joshua, both learned the hard way:
 *
 *  - It never goes quiet. Whatever he picked, something comes back about it,
 *    named — even when not one frame could be sent. A picker that closes onto
 *    a page that says nothing is indistinguishable from a broken site.
 *  - Forty frames off a card don't go up as one enormous request. They go in
 *    batches, and each batch's prints appear as it lands, so a long upload
 *    shows its progress instead of looking asleep — and the machine at the
 *    other end never holds more than a handful of originals at once.
 */

/** Groups the chosen frames into requests the server can hold in memory. */
function intoBatches(files: File[]): File[][] {
  const batches: File[][] = [];
  let current: File[] = [];
  let bytes = 0;

  for (const file of files) {
    const full =
      current.length >= BATCH_FILES || bytes + file.size > BATCH_BYTES;
    if (current.length && full) {
      batches.push(current);
      current = [];
      bytes = 0;
    }
    current.push(file);
    bytes += file.size;
  }
  if (current.length) batches.push(current);
  return batches;
}

/**
 * Row ids for a batch of uploads, unique inside the draft they're joining.
 *
 * Uploads are content-addressed, so the same frame chosen twice comes back
 * under one id — and two rows sharing an id is how a photograph disappears on
 * save. Each row gets its own.
 */
export function draftIds(
  uploads: StoredUpload[],
  taken: Iterable<string>,
): string[] {
  const seen = new Set(taken);
  return uploads.map((upload) => {
    const base = upload.id.replace(/\.jpg$/, "");
    let id = base;
    for (let n = 2; seen.has(id); n += 1) id = `${base}-${n}`;
    seen.add(id);
    return id;
  });
}

function counted(n: number): string {
  return `${n} ${n === 1 ? "photograph" : "photographs"}`;
}

type Result = {
  photos?: StoredUpload[];
  skipped?: string[];
  message?: string;
};

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
  /** Guards against a second pick landing in the same tick as the first. */
  const running = useRef(false);
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  /** Where a long upload has got to. Shown in the zone, not as a toast. */
  const [progress, setProgress] = useState("");
  /**
   * What wouldn't go up, by name. This stays on the page until the next pick:
   * a toast that clears itself is no use to someone reading down a list of
   * thirty file names looking for the two that didn't make it.
   */
  const [trouble, setTrouble] = useState<string[]>([]);

  async function send(chosen: File[]) {
    if (running.current) {
      onMessage("Still working through the last lot — one moment.");
      return;
    }
    // An empty pick is the picker being cancelled. Nothing to report.
    if (!chosen.length) return;

    const queue: File[] = [];
    const refused: string[] = [];
    for (const file of chosen) {
      const reason = whyNotSendable(file);
      if (reason) refused.push(reason);
      else queue.push(file);
    }
    setTrouble([...refused]);

    if (!queue.length) {
      setProgress("");
      onMessage(
        refused.length === 1
          ? `${refused[0]}.`
          : `None of those ${chosen.length} would go up — see the notes below.`,
      );
      return;
    }

    running.current = true;
    setBusy(true);
    const batches = intoBatches(queue);
    let added = 0;
    /** Set when the run stops early — a connection lost, the server unwell. */
    let stopped = "";

    for (const group of batches) {
      setProgress(
        batches.length === 1
          ? `Reading ${counted(queue.length)}…`
          : `Reading ${added + group.length} of ${queue.length}…`,
      );

      const body = new FormData();
      for (const file of group) body.append("files", file);

      let response: Response;
      try {
        response = await fetch("/api/admin/upload", { method: "POST", body });
      } catch {
        stopped = "The upload didn't get through. Try again in a moment.";
        break;
      }

      const result = (await response.json().catch(() => null)) as Result | null;
      if (result?.skipped?.length) {
        refused.push(...result.skipped);
        setTrouble([...refused]);
      }

      if (result?.photos?.length) {
        onAdded(result.photos);
        added += result.photos.length;
        continue;
      }

      // 415 is this batch's own bad luck — unreadable frames, already named
      // above. Anything else is the server itself, and the rest would fare no
      // better, so the run stops and says so.
      if (response.status !== 415) {
        stopped = result?.message ?? "Those wouldn't upload.";
        break;
      }
    }

    running.current = false;
    setBusy(false);
    setProgress("");

    if (stopped) {
      onMessage(added ? `${counted(added)} in, then: ${stopped}` : stopped);
      return;
    }
    if (!added) {
      onMessage(
        refused.length === 1
          ? `${refused[0]}.`
          : "None of those would open — see the notes below.",
      );
      return;
    }
    onMessage(
      `${counted(added)} added.` +
        (refused.length ? ` ${refused.length} I couldn't read.` : ""),
    );
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
        void send(Array.from(event.dataTransfer?.files ?? []));
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
          aria-live="polite"
        >
          {busy
            ? progress || "Working through them…"
            : hasPhotos
              ? "Drop more in — they land at the end."
              : "Drag photographs here from your Mac."}
        </div>
        <div style={{ ...inkNote, marginTop: 7 }}>{hint}</div>

        {trouble.length ? (
          <ul
            style={{
              margin: "12px 0 0",
              padding: 0,
              listStyle: "none",
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            {trouble.map((note, index) => (
              <li key={`${index}-${note}`} style={{ ...inkNote, color: "#7c4a2c" }}>
                {note}
              </li>
            ))}
          </ul>
        ) : null}
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
          const picked = Array.from(event.target.files ?? []);
          // Cleared before sending, so the same frames can be picked again.
          event.target.value = "";
          void send(picked);
        }}
        style={{ display: "none" }}
      />
    </div>
  );
}
