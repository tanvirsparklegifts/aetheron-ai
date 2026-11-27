"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, FileArchive, FileUp, RefreshCw, Trash2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import type { Session } from "@supabase/supabase-js";

type StoredFile = {
  id: string;
  title: string;
  source_name: string;
  storage_path: string;
  mime_type: string;
  extension: string;
  file_size: number;
  processing_status: string;
  is_active: boolean;
  created_at: string;
};

const BUCKET = "aetheron-private-files";
const MAX_FILE_BYTES = 50 * 1024 * 1024;
const safeName = (name: string) => name.replace(/[\\/\\\\]/g, "_").replace(/[\\u0000-\\u001f]/g, "_").slice(0, 180) || "unnamed-file";
const extensionOf = (name: string) => name.includes(".") ? name.split(".").pop()!.toLowerCase().slice(0, 20) : "";

function formatBytes(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export default function UniversalFileImport({ session }: { session: Session | null }) {
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    if (!supabase || !session?.user.id) return;
    const { data, error: queryError } = await supabase
      .from("knowledge_files")
      .select("id,title,source_name,storage_path,mime_type,extension,file_size,processing_status,is_active,created_at")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(100);
    if (queryError) {
      setError("Universal file storage is not ready. Apply the reviewed database migration first.");
      return;
    }
    setFiles((data || []) as StoredFile[]);
  }, [session?.user.id]);

  useEffect(() => { void refresh(); }, [refresh]);

  const uploadFiles = async (selected: FileList | null) => {
    if (!supabase || !session || !selected?.length || busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    let uploaded = 0;
    try {
      for (const file of Array.from(selected)) {
        if (file.size <= 0) throw new Error(file.name + " is empty.");
        if (file.size > MAX_FILE_BYTES) throw new Error(file.name + " exceeds the 50 MB per-file limit.");
        const id = crypto.randomUUID();
        const sourceName = safeName(file.name);
        const storagePath = session.user.id + "/" + id + "/" + sourceName;
        const mimeType = file.type || "application/octet-stream";
        const { error: storageError } = await supabase.storage.from(BUCKET).upload(storagePath, file, {
          contentType: mimeType,
          cacheControl: "3600",
          upsert: false,
        });
        if (storageError) throw new Error("Could not upload " + sourceName + ": " + storageError.message);
        const { error: metadataError } = await supabase.from("knowledge_files").insert({
          id,
          user_id: session.user.id,
          title: sourceName.replace(/\\.[^.]+$/, "").slice(0, 180) || "Untitled file",
          source_name: sourceName,
          storage_path: storagePath,
          mime_type: mimeType,
          extension: extensionOf(sourceName),
          file_size: file.size,
          processing_status: "stored",
        });
        if (metadataError) {
          await supabase.storage.from(BUCKET).remove([storagePath]);
          throw new Error("File bytes uploaded but metadata could not be saved for " + sourceName + ". " + metadataError.message);
        }
        uploaded += 1;
      }
      setNotice(uploaded + " file(s) securely stored. Content extraction is a separate processing stage.");
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "File import failed.");
      await refresh();
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const downloadFile = async (file: StoredFile) => {
    if (!supabase) return;
    setError("");
    const { data, error: signedError } = await supabase.storage.from(BUCKET).createSignedUrl(file.storage_path, 60);
    if (signedError || !data?.signedUrl) {
      setError("Could not create a secure download link: " + (signedError?.message || "Unknown error"));
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const deleteFile = async (file: StoredFile) => {
    if (!supabase || busy || !window.confirm("Permanently delete " + file.source_name + "?")) return;
    setBusy(true);
    setError("");
    const { error: storageError } = await supabase.storage.from(BUCKET).remove([file.storage_path]);
    if (storageError) {
      setError("Could not delete stored file: " + storageError.message);
      setBusy(false);
      return;
    }
    const { error: rowError } = await supabase.from("knowledge_files").delete().eq("id", file.id).eq("user_id", session?.user.id);
    if (rowError) setError("File bytes were removed, but metadata cleanup failed: " + rowError.message);
    await refresh();
    setBusy(false);
  };

  if (!supabase) return <div className="workspace-panel"><p>Supabase is not configured.</p></div>;
  if (!session) return <div className="workspace-panel"><p>Sign in to use private file storage.</p></div>;

  return (
    <section className="workspace-panel" aria-label="Universal file import">
      <div className="project-toolbar">
        <div><FileArchive /><h2>Universal file import</h2><p>Store documents, images, audio, video, archives, code and other file types in your private library.</p></div>
        <button className="panel-action" type="button" onClick={() => inputRef.current?.click()} disabled={busy}><FileUp size={15} /> {busy ? "Uploading…" : "Import files"}</button>
        <input ref={inputRef} type="file" multiple accept="*/*" disabled={busy} style={{ display: "none" }} onChange={event => { void uploadFiles(event.target.files); }} />
      </div>
      <small className="panel-muted">Any file extension · up to 50 MB per file · private storage · no public links · no files are executed</small>
      {error && <p className="memory-error" role="alert">{error}</p>}
      {notice && <p className="panel-muted" role="status">{notice}</p>}
      {busy && <p className="panel-muted"><RefreshCw size={14} /> Processing upload…</p>}
      {files.length === 0 ? <div className="panel-empty"><FileArchive size={22}/><b>No universal files stored</b><span>Choose one or more files to add them to your private library.</span></div> :
        <div className="knowledge-list">{files.map(file => <article className="knowledge-item" key={file.id}>
          <div className="knowledge-copy"><b>{file.source_name}</b><small>{file.mime_type} · {formatBytes(file.file_size)} · {file.processing_status}</small><p>Original file is stored privately. Text extraction is not yet available for this file.</p></div>
          <div className="knowledge-actions"><button type="button" onClick={() => void downloadFile(file)} disabled={busy} aria-label={"Download " + file.source_name}><Download size={14}/> Download</button><button className="danger" type="button" onClick={() => void deleteFile(file)} disabled={busy} aria-label={"Delete " + file.source_name}><Trash2 size={14}/> Delete</button></div>
        </article>)}</div>}
    </section>
  );
}
