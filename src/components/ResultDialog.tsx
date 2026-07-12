"use client";

import { useEffect } from "react";

export default function ResultDialog({
  open,
  variant,
  message,
  onClose
}: {
  open: boolean;
  variant: "success" | "error";
  message: string;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open || variant !== "success") return;
    const timer = setTimeout(onClose, 1800);
    return () => clearTimeout(timer);
  }, [open, variant, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4"
      onClick={onClose}
    >
      <div
        className={`${
          variant === "success" ? "success-pop" : "error-pop"
        } panel-raised flex flex-col items-center gap-3 px-8 py-8 text-center`}
        onClick={(e) => e.stopPropagation()}
      >
        {variant === "success" ? (
          <svg width="56" height="56" viewBox="0 0 52 52" aria-hidden>
            <circle
              className="success-check-circle"
              cx="26"
              cy="26"
              r="24"
              fill="none"
              stroke="#3FB68B"
              strokeWidth="3"
            />
            <path
              className="success-check-mark"
              fill="none"
              stroke="#3FB68B"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.1 27.2l7.1 7.2 16.7-16.8"
            />
          </svg>
        ) : (
          <svg width="56" height="56" viewBox="0 0 52 52" aria-hidden>
            <circle
              className="error-check-circle"
              cx="26"
              cy="26"
              r="24"
              fill="none"
              stroke="#E5484D"
              strokeWidth="3"
            />
            <path
              className="error-mark-1"
              fill="none"
              stroke="#E5484D"
              strokeWidth="3.5"
              strokeLinecap="round"
              d="M18 18L34 34"
            />
            <path
              className="error-mark-2"
              fill="none"
              stroke="#E5484D"
              strokeWidth="3.5"
              strokeLinecap="round"
              d="M34 18L18 34"
            />
          </svg>
        )}
        <p className="font-display text-base font-semibold">{message}</p>
        {variant === "error" && (
          <button type="button" className="btn-ghost mt-1 px-3 py-1.5 text-xs" onClick={onClose}>
            Close
          </button>
        )}
      </div>
    </div>
  );
}
