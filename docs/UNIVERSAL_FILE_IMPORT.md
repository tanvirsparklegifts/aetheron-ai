# AETHERON Universal File Import

## Objective
Accept arbitrary user file formats without treating every format as immediately readable or safe to execute. Preserve the original file in private storage and separately track whether content extraction is supported.

## Phase 1 — private intake foundation
- Private Supabase Storage bucket: `aetheron-private-files`.
- Per-user object namespace: `{auth.uid()}/{uuid}/{original-filename}`.
- Metadata table: `public.knowledge_files`, with RLS ownership checks.
- Maximum object size in this initial tier: 50 MiB per file.
- No public URLs; use authenticated access or short-lived signed URLs.
- Signed downloads must set attachment disposition so untrusted HTML/SVG uploads are downloaded rather than rendered inline.
- Files are data only. Never execute, render as active HTML, or launch uploaded programs.

## Format handling model
| Family | Examples | Intake | Processing plan |
|---|---|---|---|
| Documents | PDF, DOCX, DOC, ODT, RTF, TXT, MD | Store original | Extract text; scanned PDFs need OCR |
| Spreadsheets | XLSX, XLS, ODS, CSV, TSV | Store original | Extract sheets/cells with size and formula limits |
| Presentations | PPTX, PPT, ODP | Store original | Extract slide text and safe previews |
| Images | PNG, JPG, JPEG, WEBP, GIF, SVG, TIFF, HEIC | Store original | Metadata; OCR/vision only after explicit product/provider configuration |
| Audio | MP3, WAV, M4A, AAC, OGG, FLAC | Store original | Metadata/transcription in a later worker |
| Video | MP4, MOV, WEBM, MKV, AVI | Store original | Metadata/keyframes/transcription in a later worker |
| Archives | ZIP, TAR, GZ, 7Z | Store original | Never auto-extract; inspect entries with archive-bomb limits |
| Code/data | source files, JSON, XML, YAML, SQL, notebooks | Store original | Text extraction only for allowlisted encodings and bounded size |
| Other/binary | any extension or unknown MIME | Store original | Metadata-only until a safe parser is available |

## Security requirements before enabling extraction
1. Verify MIME by file signature (magic bytes), not filename or browser-supplied MIME alone.
2. Enforce per-file, per-user quota, upload rate limits, and bounded parser CPU/memory/time.
3. Parse in an isolated worker/container with no network access and no credentials.
4. Block path traversal, archive bombs, decompression bombs, macros, scripts, and active content.
5. Treat extracted text as untrusted prompt-injection content; retrieval must label it as reference data.
6. Keep original bytes private; never expose service-role credentials to the browser.
7. Provide delete that removes both metadata and object; handle partial failures and orphan cleanup.
8. Use signed URLs with short expiry for download/preview. Do not create public buckets.
9. Log metadata/status only; never log file bytes or extracted sensitive content.

## Current implementation boundary
This migration adds the private storage and metadata foundation only. It does not claim PDF/DOCX/image/audio/video extraction is implemented. A frontend intake UI and authenticated upload/delete/download flow must be added and tested against a staging Supabase project before this migration is applied to production. Format-specific extraction workers are subsequent milestones.
