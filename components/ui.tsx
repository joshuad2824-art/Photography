"use client";

import type { CSSProperties, KeyboardEvent, ReactNode } from "react";

/**
 * The handful of Timber & Ink controls the pages use. The design-system bundle
 * itself was not part of the handoff, so these are rebuilt from the prototype
 * screenshots: square-ish corners, body-serif labels, no bounce.
 */

export function Button({
  children,
  onClick,
  variant = "primary",
  fullWidth = false,
  type = "button",
  disabled = false,
  style,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary";
  fullWidth?: boolean;
  type?: "button" | "submit";
  disabled?: boolean;
  style?: CSSProperties;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`ti-button ti-button-lg ti-button-${variant}`}
      style={{ width: fullWidth ? "100%" : undefined, ...style }}
    >
      {children}
    </button>
  );
}

export function Input({
  value,
  onChange,
  onEnter,
  placeholder,
  id,
  type = "text",
  autoComplete = "off",
  ariaInvalid,
  ariaDescribedBy,
}: {
  value: string;
  onChange: (value: string) => void;
  onEnter?: () => void;
  placeholder?: string;
  id?: string;
  type?: string;
  autoComplete?: string;
  ariaInvalid?: boolean;
  ariaDescribedBy?: string;
}) {
  return (
    <input
      id={id}
      type={type}
      className="ti-input"
      value={value}
      placeholder={placeholder}
      autoComplete={autoComplete}
      aria-invalid={ariaInvalid || undefined}
      aria-describedby={ariaDescribedBy}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter" && onEnter) {
          event.preventDefault();
          onEnter();
        }
      }}
    />
  );
}

export function Field({
  label,
  htmlFor,
  error,
  errorId,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  errorId?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="ti-field-label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      <div className="ti-field-error" id={errorId} role="status">
        {error}
      </div>
    </div>
  );
}
