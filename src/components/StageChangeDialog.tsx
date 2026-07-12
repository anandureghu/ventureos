"use client";

import { useEffect } from "react";

export interface ConfettiPiece {
  id: number;
  dx: string;
  dy: string;
  rot: string;
  delay: string;
  color: string;
}

const FORWARD_MESSAGES = [
  "Huge step forward — keep going!",
  "Look at you go! Onward to the next stage.",
  "Proud of you — that took guts.",
  "Another stage down. You've got this."
];

const BACKWARD_MESSAGES = [
  "Don't be hard on yourself — we'll get there together.",
  "No shame in recalibrating. Keep going.",
  "Every founder adjusts course sometimes.",
  "That's part of the journey — let's keep building."
];

const CONFETTI_COLORS = ["#7C5CFF", "#3FB68B", "#4C8DFF", "#E8A33D"];

// Called from an event handler (not render) so Math.random() here is fine —
// the result is stored in state and passed down as plain props.
export function createStageChangeContent(direction: "forward" | "backward"): {
  message: string;
  confetti: ConfettiPiece[];
} {
  const pool = direction === "forward" ? FORWARD_MESSAGES : BACKWARD_MESSAGES;
  const message = pool[Math.floor(Math.random() * pool.length)];
  const confetti =
    direction === "forward"
      ? Array.from({ length: 24 }, (_, i) => ({
          id: i,
          dx: `${Math.round((Math.random() - 0.5) * 240)}px`,
          dy: `${Math.round(80 + Math.random() * 160)}px`,
          rot: `${Math.round(Math.random() * 720 - 360)}deg`,
          delay: `${Math.round(Math.random() * 150)}ms`,
          color: CONFETTI_COLORS[i % CONFETTI_COLORS.length]
        }))
      : [];
  return { message, confetti };
}

export default function StageChangeDialog({
  open,
  direction,
  message,
  confetti,
  onClose
}: {
  open: boolean;
  direction: "forward" | "backward";
  message: string;
  confetti: ConfettiPiece[];
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(onClose, 2200);
    return () => clearTimeout(timer);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4"
      onClick={onClose}
    >
      <div
        className="success-pop panel-raised relative flex flex-col items-center gap-3 overflow-hidden px-8 py-10 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {direction === "forward" ? (
          <>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-0">
              {confetti.map((c) => (
                <span
                  key={c.id}
                  className="confetti-piece"
                  style={
                    {
                      "--dx": c.dx,
                      "--dy": c.dy,
                      "--rot": c.rot,
                      "--delay": c.delay,
                      background: c.color
                    } as React.CSSProperties
                  }
                />
              ))}
            </div>
            <span className="text-4xl">🎉</span>
          </>
        ) : (
          <span className="applause-emoji text-4xl">👏</span>
        )}
        <p className="font-display text-base font-semibold">{message}</p>
      </div>
    </div>
  );
}
