# AETHERON Web

AETHERON's public web workspace, built with Next.js, React, TypeScript, and Lucide icons.

## Run locally

    npm install
    npm run dev

Open http://localhost:3000.

## Current implemented areas

- Responsive dark workspace with cyan/violet visual system and workspace navigation.
- Supabase authentication integration and account-scoped data access.
- AI chat through the cloud API, with conversation and message persistence paths.
- Knowledge workspace for text documents, plus a feature-branch universal private-file intake UI.
- Basic memory, project/task, and web-research interfaces.
- Browser speech input where supported.

## Important implementation boundaries

- A visible interface does not mean every workflow has passed end-to-end testing.
- Universal private-file intake is on the `feat/universal-file-import` branch and has its schema migration applied to the existing Supabase project, but the feature branch is not yet merged/deployed. Upload/download and two-account isolation still require end-to-end verification.
- Universal file intake stores originals; PDF/DOCX extraction, OCR, image understanding, audio/video transcription, archive inspection, and indexing are not implemented.
- Multi-agent tool execution, approval-gated automation, image/video generation, and broad third-party integrations remain roadmap work.
- Check the root project documentation and feature-specific docs for current status. Never describe roadmap items as shipped functionality.
