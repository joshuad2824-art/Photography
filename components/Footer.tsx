"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Editable } from "./Editable";
import { useSite } from "./SiteProvider";
import { monoMeta } from "@/lib/tokens";

const adminText = {
  fontFamily: "var(--font-mono)",
  fontSize: 10,
  letterSpacing: "0.1em",
  textTransform: "uppercase" as const,
};

function AdminBar({
  editablePhoto,
  variant,
}: {
  editablePhoto: boolean;
  variant: "site" | "admin";
}) {
  const { admin, setAdmin } = useSite();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function signIn() {
    if (busy) return;
    setBusy(true);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!response.ok) {
        setError("That isn't it.");
        return;
      }
      setAdmin(true);
      setOpen(false);
      setPassword("");
      setError("");
      router.refresh();
    } catch {
      setError("Couldn't reach the desk.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAdmin(false);
    router.refresh();
  }

  if (admin) {
    return (
      <>
        <div style={{ ...adminText, color: "var(--amber-hand)" }}>
          {variant === "admin"
            ? "Signed in — this page is only yours"
            : editablePhoto
              ? "Editing as admin — click any text or photo to change it"
              : "Editing as admin — click any text to change it"}
        </div>
        {variant === "site" ? (
          <a href="/admin" className="admin-logout" style={{ ...adminText, color: "var(--text-faint)" }}>
            The desk drawer
          </a>
        ) : null}
        <button
          type="button"
          onClick={signOut}
          className="admin-logout"
          style={{
            ...adminText,
            color: "var(--text-faint)",
            background: "transparent",
            border: 0,
            cursor: "pointer",
            padding: 0,
          }}
        >
          Log out
        </button>
      </>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="admin-toggle"
        style={{
          ...adminText,
          letterSpacing: "0.12em",
          color: "#4d5a57",
          background: "transparent",
          border: 0,
          cursor: "pointer",
          padding: 0,
        }}
      >
        Admin
      </button>
    );
  }

  return (
    <div
      style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}
    >
      <input
        type="password"
        autoFocus
        placeholder="admin password"
        value={password}
        onChange={(event) => {
          setPassword(event.target.value);
          setError("");
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") void signIn();
          if (event.key === "Escape") setOpen(false);
        }}
        className="admin-input"
        style={{
          minHeight: 34,
          padding: "0 10px",
          border: "1px solid rgba(232,227,215,0.28)",
          borderRadius: 3,
          background: "rgba(9,18,19,0.5)",
          color: "var(--text-primary)",
          fontFamily: "var(--font-mono)",
          fontSize: 11,
        }}
      />
      <button
        type="button"
        onClick={() => void signIn()}
        disabled={busy}
        style={{
          minHeight: 34,
          padding: "0 12px",
          border: 0,
          borderRadius: 3,
          cursor: "pointer",
          background: "var(--amber)",
          color: "#1d2a28",
          fontFamily: "var(--font-ui)",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
        }}
      >
        Sign in
      </button>
      <span
        role="status"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          color: "#c98a5a",
        }}
      >
        {error}
      </span>
    </div>
  );
}

export function Footer({
  editablePhoto = false,
  variant = "site",
}: {
  editablePhoto?: boolean;
  variant?: "site" | "admin";
}) {
  return (
    <footer
      style={{
        position: "relative",
        zIndex: 3,
        maxWidth: "var(--shell-max)",
        margin: "78px auto 0",
        padding: "0 var(--shell-pad) 0",
      }}
    >
      <div style={{ height: 1, background: "var(--rule)" }} />
      <div
        style={{
          padding: "26px 0 0",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 20,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 17,
              letterSpacing: "-0.01em",
              textTransform: "uppercase",
              color: "var(--text-wordmark)",
            }}
          >
            Joshua Davis
          </div>
          <Editable
            id="site.footerContact"
            style={{ ...monoMeta, marginTop: 7 }}
          />
        </div>
        <Editable
          id="site.footerTagline"
          style={{
            fontFamily: "var(--font-hand)",
            fontSize: 24,
            lineHeight: 1,
            color: "var(--amber-hand)",
          }}
        />
      </div>

      <div
        style={{
          position: "relative",
          overflow: "hidden",
          height: "clamp(92px,24vw,132px)",
          marginTop: 14,
        }}
      >
        <Image
          src="/graphics/engraving-moose-puffin.png"
          alt=""
          aria-hidden
          width={410}
          height={410}
          sizes="(max-width: 512px) 80vw, 410px"
          style={{
            position: "absolute",
            right: 0,
            top: -20,
            width: "min(410px,80vw)",
            height: "auto",
            opacity: 0.4,
            pointerEvents: "none",
          }}
        />
      </div>

      <div
        style={{
          marginTop: 18,
          padding: "14px 0 26px",
          borderTop: "1px solid var(--rule-faint)",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "10px 16px",
        }}
      >
        <AdminBar editablePhoto={editablePhoto} variant={variant} />
      </div>
    </footer>
  );
}
