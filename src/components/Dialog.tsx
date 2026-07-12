"use client";

export default function Dialog({
  open,
  onClose,
  className,
  children
}: {
  open: boolean;
  onClose: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={onClose}
    >
      <div
        className={`panel-raised w-full max-w-lg p-6 ${className ?? ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
