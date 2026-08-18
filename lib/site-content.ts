import "server-only";
import { readJson, updateJson } from "./store";
import {
  defaultContent,
  withDefaults,
  type ImageId,
  type SiteContent,
} from "./content";

/**
 * Server-side copy store for the inline editor.
 *
 * The prototype kept edits in localStorage, so nothing followed Joshua from
 * his laptop to his phone. These live on the server instead: one write per
 * blur, read on every render.
 */

const FILE = "content.json";

export type StoredImage = {
  /** File name inside the uploads directory. */
  file: string;
  mime: string;
  updatedAt: number;
};

type ContentDoc = {
  text: SiteContent;
  images: Partial<Record<ImageId, StoredImage>>;
};

const EMPTY: ContentDoc = { text: {}, images: {} };

export async function loadDoc(): Promise<ContentDoc> {
  const doc = await readJson<ContentDoc>(FILE, EMPTY);
  return { text: doc.text ?? {}, images: doc.images ?? {} };
}

/** Copy for rendering: shipped defaults with any admin edits laid over the top. */
export async function loadContent(): Promise<SiteContent> {
  const doc = await loadDoc();
  return withDefaults(doc.text);
}

export async function loadImages(): Promise<
  Partial<Record<ImageId, StoredImage>>
> {
  return (await loadDoc()).images;
}

/**
 * Saves one edited block. Reverting a block to its shipped default drops the
 * override rather than storing a duplicate.
 */
export async function saveText(id: string, value: string): Promise<void> {
  if (!(id in defaultContent)) {
    throw new Error(`Unknown content id: ${id}`);
  }
  const cleaned = value.replace(/\s+/g, " ").trim();
  await updateJson<ContentDoc>(FILE, EMPTY, (doc) => {
    const text = { ...(doc.text ?? {}) };
    if (!cleaned || cleaned === defaultContent[id as keyof typeof defaultContent]) {
      delete text[id];
    } else {
      text[id] = cleaned;
    }
    return { text, images: doc.images ?? {} };
  });
}

export async function saveImage(
  id: ImageId,
  image: StoredImage,
): Promise<void> {
  await updateJson<ContentDoc>(FILE, EMPTY, (doc) => ({
    text: doc.text ?? {},
    images: { ...(doc.images ?? {}), [id]: image },
  }));
}
