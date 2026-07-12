"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ToastProvider";

export default function LogoUpload({
  bucket,
  path,
  currentUrl,
  canEdit,
  onUploaded,
  label = "Change logo",
  fallbackInitial
}: {
  bucket: "org-logos" | "venture-logos";
  path: string;
  currentUrl: string | null;
  canEdit: boolean;
  onUploaded: (url: string) => void;
  label?: string;
  fallbackInitial: string;
}) {
  const toast = useToast();
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop() ?? "png";
    const filePath = `${path}/logo.${ext}`;
    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, { upsert: true, cacheControl: "3600" });
    setUploading(false);
    if (error) {
      toast.error(`Could not upload logo: ${error.message}`);
      return;
    }
    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    onUploaded(`${data.publicUrl}?t=${Date.now()}`);
  }

  return (
    <div className="flex items-center gap-3">
      {currentUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={currentUrl} alt="" className="h-12 w-12 rounded-lg object-cover" />
      ) : (
        <div className="grid h-12 w-12 place-items-center rounded-lg bg-ink-600 font-mono text-sm text-fg-muted">
          {fallbackInitial}
        </div>
      )}
      {canEdit && (
        <>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? "Uploading…" : label}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
          />
        </>
      )}
    </div>
  );
}
