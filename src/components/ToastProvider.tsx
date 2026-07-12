"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

type ToastType = "success" | "error" | "warning";

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const TYPE_STYLE: Record<ToastType, { border: string; dot: string }> = {
  success: { border: "border-l-signal-green", dot: "bg-signal-green" },
  error: { border: "border-l-signal-red", dot: "bg-signal-red" },
  warning: { border: "border-l-signal-amber", dot: "bg-signal-amber" }
};

const DISMISS_MS = 4500;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (type: ToastType, message: string) => {
      const id = ++counter.current;
      setToasts((t) => [...t, { id, type, message }]);
      setTimeout(() => dismiss(id), DISMISS_MS);
    },
    [dismiss]
  );

  const api: ToastApi = {
    success: (message) => push("success", message),
    error: (message) => push("error", message),
    warning: (message) => push("warning", message)
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-2"
      >
        {toasts.map((t) => {
          const style = TYPE_STYLE[t.type];
          return (
            <div
              key={t.id}
              className={`panel pointer-events-auto flex items-start gap-2.5 border-l-4 p-3 pr-2 shadow-xl ${style.border}`}
            >
              <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${style.dot}`} />
              <p className="flex-1 text-sm text-fg">{t.message}</p>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="rounded px-1.5 text-xs text-fg-faint hover:text-fg"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}
