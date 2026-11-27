# AETHERON Personal Voice — $0-First Implementation Plan

**Decision (2026-11-27)**
- Scope: `both` — AETHERON plus future EliteAxis apps, website, and Android companion.
- Voice style: `professional` — natural, clear, warm, measured delivery; preserve the speaker's recognizable voice rather than changing identity.
- Access: `private` — public users may hear approved generated speech through AETHERON experiences, but may not download the voice model, source recordings, or raw synthesis assets.

## Non-negotiable constraints
1. $0 operating-cost target. No paid API, subscription, GPU rental, or paid fallback without explicit approval.
2. No voice sample is collected or uploaded until the owner gives informed, explicit consent.
3. Store any eventual voice model and source recordings privately; never place them in Git, a public bucket, a browser bundle, or a public Pages artifact.
4. Do not expose a model-download endpoint. Public playback, if enabled later, must be server-mediated, authenticated/authorized, rate-limited, and abuse-monitored.
5. Clearly disclose that speech is AI-generated using the owner's authorized voice. Do not enable deceptive impersonation, arbitrary caller-ID/identity use, or unrestricted voice generation.
6. Provide revocation and deletion: disable synthesis immediately, then remove source samples and model artifacts from controlled storage and document any backups/retention limits.
7. If a free quota ends or local compute is inadequate, disable that capability rather than incur cost.

## Current repository baseline
- The web dashboard has a microphone icon marked “Voice input coming soon”; no speech recognition, text-to-speech, audio streaming, or voice API was found in the inspected frontend/backend files.
- The current web preview is hosted on GitHub Pages; the FastAPI service is separate.
- The existing backend validates Supabase access tokens and uses caller-scoped Supabase requests. Future voice endpoints must preserve that trust boundary.
- This is a code-inspection baseline, not a claim that live deployment behavior has been tested.

## Delivery stages

### Stage 0 — safety and product contract (now)
- Keep this plan as the implementation source of truth.
- Confirm the owner can provide a clean voice recording and has the right to authorize its use.
- Before recording, present purpose, storage location, retention, deletion, and public-playback explanation.
- No recording or biometric processing in this stage.

### Stage 1 — free browser voice I/O (first functional milestone)
- Add opt-in microphone speech input using browser/device speech-recognition capability where supported.
- Add speech output using browser `speechSynthesis` as a clearly labelled temporary system-voice fallback.
- Support Bangla and English language selection where the browser exposes suitable voices; gracefully report unsupported devices/languages.
- Add push-to-talk, stop speaking, mute, and visible microphone permission state.
- Explain that this stage does **not** sound like the owner's voice; device voices vary and browser support is not universal.
- Keep this entirely client-side and avoid uploading audio.

### Stage 2 — private voice-sample intake (only after explicit consent)
- Record or select a short clean sample through a private, authenticated owner-only workflow.
- Show a consent confirmation immediately before upload.
- Upload directly to a private storage location with restrictive access; never route recordings through public static hosting.
- Record consent version, timestamp, intended scope, and deletion status without storing raw biometric data in ordinary chat memory.
- Add owner-only review, replacement, and deletion controls.
- Do not build a clone or start synthesis merely because a sample was uploaded.

### Stage 3 — feasibility gate for a custom voice model
- Compare maintained open-source voice-cloning/TTS options for Bangla + English, commercial-use license, safety controls, model size, CPU/GPU requirements, and reproducibility.
- Benchmark only on a local machine or genuinely free compute already available to the owner.
- Reject any option that requires a paid hosted inference API, paid GPU, unclear licensing, or insecure public model hosting.
- Verify that a voice model trained from the owner's own sample is technically viable and intelligible in both languages before product integration.
- If free compute cannot meet acceptable latency/quality, keep Stage 1 and mark custom voice as blocked rather than promise real-time cloning.

### Stage 4 — private synthesis service and rollout
- Keep model files and source recordings outside the frontend and Git repository.
- Add authenticated owner controls for model activation, pause, regeneration, and deletion.
- For public listeners, expose only narrowly scoped speech-generation/playback; no model or source download.
- Apply per-user and per-IP quotas, input length limits, abuse checks, audit events, and a global kill switch.
- Add disclosure on generated audio and a clear report/disable route.
- Roll out first to the AETHERON web app, then reuse the same authorized service contract in future EliteAxis web/mobile apps.

## Acceptance criteria
- Stage 1: microphone permission is explicit; speech can be started/stopped; text input remains usable without microphone permission; browser voice is labelled as a system voice.
- Stage 2: no sample is uploaded without a fresh explicit consent action; only the owner can access or delete it.
- Stage 3: written license, compute, language-quality, latency, and $0-cost review passes before any clone is created.
- Stage 4: public clients cannot retrieve source recordings/model files; generation is authenticated, rate-limited, disclosed, and revocable.

## Immediate next actions
1. Implement Stage 1 browser-native voice input/output in the web client, feature-gated and with graceful unsupported-browser behavior.
2. Add a private voice settings/consent design, but keep sample recording/upload disabled until the owner reviews the consent text.
3. Run frontend lint/build and backend tests; verify the deployed preview only after CI reports success.

**Status:** Planning approved; no voice sample has been collected; no personal voice model exists; no custom voice-cloning provider is connected.
