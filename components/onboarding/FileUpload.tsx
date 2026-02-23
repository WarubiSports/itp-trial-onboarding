"use client";

import { useState, useRef } from "react";
import { Upload, Check, X, Loader2, Camera } from "lucide-react";

type Props = {
  label: string;
  prospectId: string;
  documentType: string;
  currentPath: string;
  onUploaded: (path: string) => void;
};

export const FileUpload = ({
  label,
  prospectId,
  documentType,
  currentPath,
  onUploaded,
}: Props) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setError("File must be under 10 MB");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("prospectId", prospectId);
      formData.append("documentType", documentType);

      const res = await fetch("/api/onboarding/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Upload failed");
      }

      const { path } = await res.json();
      onUploaded(path);
      setFileName(file.name);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
      // Reset capture attribute so "Choose File" still works normally
      if (fileRef.current) fileRef.current.removeAttribute("capture");
    }
  };

  const isUploaded = !!currentPath;

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </p>
      <div
        className={`relative rounded-xl border-2 border-dashed p-4 text-center transition-colors ${
          isUploaded
            ? "border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-950/20"
            : "border-zinc-200 bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800/50"
        }`}
      >
        {uploading ? (
          <div className="flex items-center justify-center gap-2 py-2 text-sm text-zinc-500">
            <Loader2 size={16} className="animate-spin" /> Uploading...
          </div>
        ) : isUploaded ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
              <Check size={16} />
              <span>{fileName || "Uploaded"}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                onUploaded("");
                setFileName("");
                if (fileRef.current) fileRef.current.value = "";
              }}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm ring-1 ring-zinc-200 hover:bg-zinc-50 dark:bg-zinc-700 dark:text-zinc-200 dark:ring-zinc-600"
              >
                <Upload size={14} /> Choose File
              </button>
              <button
                type="button"
                onClick={() => {
                  if (fileRef.current) {
                    fileRef.current.setAttribute("capture", "environment");
                    fileRef.current.click();
                  }
                }}
                className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm ring-1 ring-zinc-200 hover:bg-zinc-50 dark:bg-zinc-700 dark:text-zinc-200 dark:ring-zinc-600"
              >
                <Camera size={14} /> Take Photo
              </button>
            </div>
            <p className="text-xs text-zinc-400">PDF, JPG, or PNG up to 10 MB</p>
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*,.pdf"
          onChange={handleChange}
          className="hidden"
        />
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};
