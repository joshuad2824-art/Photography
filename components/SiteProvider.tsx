"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { SiteContent } from "@/lib/content";

type SiteState = {
  content: SiteContent;
  admin: boolean;
  portrait: string | null;
  setAdmin: (value: boolean) => void;
  setPortrait: (src: string | null) => void;
  saveText: (id: string, value: string) => void;
};

const SiteContext = createContext<SiteState | null>(null);

export function SiteProvider({
  content,
  admin: initialAdmin,
  portrait: initialPortrait,
  children,
}: {
  content: SiteContent;
  admin: boolean;
  portrait: string | null;
  children: ReactNode;
}) {
  const [admin, setAdmin] = useState(initialAdmin);
  const [portrait, setPortrait] = useState(initialPortrait);
  const [edits, setEdits] = useState<SiteContent>({});

  const saveText = useCallback((id: string, value: string) => {
    const cleaned = value.replace(/\s+/g, " ").trim();
    setEdits((current) => ({ ...current, [id]: cleaned }));
    void fetch("/api/content", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, value: cleaned }),
    });
  }, []);

  const value = useMemo<SiteState>(
    () => ({
      content: { ...content, ...edits },
      admin,
      portrait,
      setAdmin,
      setPortrait,
      saveText,
    }),
    [content, edits, admin, portrait, saveText],
  );

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export function useSite(): SiteState {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error("useSite must be used inside <SiteProvider>");
  return ctx;
}
