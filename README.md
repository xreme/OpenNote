# OpenNote

A local, privacy-first tool that turns video into a searchable knowledge base. Add videos by upload or
by pasting a link, get timestamped transcripts, generate study artifacts, and ask questions in plain
language — answered from your own content, with citations that jump to the exact moment in the exact
video.

Transcription runs **locally and free**. Only chat and AI generation call out to OpenAI.

**Live demo:** [opennote.oseremeibazebo.dev](https://opennote.oseremeibazebo.dev/) *(read-only preview)*

[![Watch the demo](https://img.youtube.com/vi/ca1qwWn9vFE/maxresdefault.jpg)](https://youtu.be/ca1qwWn9vFE)

---

## What It Does

- **Add videos** — upload files, or paste a YouTube / TikTok / Instagram / Vimeo link. Link sources try
  platform captions first, so most are transcribed in seconds with no download and no stored video file.
- **Transcripts** — timestamped and clickable; click any line to seek the player there.
- **Artifacts** — generate a summary, structured notes, interactive flashcards, a multiple-choice quiz,
  or anything you describe. Or write your own note with autosave.
- **Chat (RAG)** — ask questions about your library and get answers grounded only in your own
  transcripts and notes, with citations that navigate to the source timestamp.
- **Search** — fuzzy search across every transcript and artifact (`Cmd/Ctrl+Shift+F`), or within the
  open transcript (`Cmd/Ctrl+F`).
- **Collections** — scope sources, artifacts, search, and chat to a named workspace.
- **Export** — a single transcript, or many merged into one file.
- **Mobile UI** — touch-first Library / Chat / Search at `/mobile`, plus a quick-capture `/add` page.

---

## Installation

**Prerequisites:** Node.js 18+ · Python 3.8+ · FFmpeg and `yt-dlp` on your `PATH`

```bash
cd server && npm install                  # server deps
pip install -r ../requirements.txt        # whisper + torch + yt-dlp
cd ../client && npm install && npm run build
cd ../server && npm start
```

Open [http://localhost:5001](http://localhost:5001), then add your OpenAI API key in Settings to enable
chat and AI artifacts. Everything else — transcription, search, export — works without it.

> First transcription downloads Whisper's `base` model (~140MB). Once only.

**Docker:**

```bash
docker compose up --build
```

**Development:** `npm run dev` in `server/` (nodemon) and `client/` (Vite).

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19 · Vite · framer-motion · fuse.js · react-markdown |
| Backend | Node.js · Express 5 |
| Transcription | OpenAI Whisper (local, via Python) |
| Media | FFmpeg (HEVC, hardware-accelerated) · yt-dlp |
| AI | OpenAI — `text-embedding-3-small` for retrieval, `gpt-4o-mini` by default for generation |
| Storage | Flat JSON + on-disk media. No database. |

---

## Docs

- [Technical Overview](docs/OpenNote-Technical-Overview.md) — architecture, data model, API surface
- [Functional Specification](docs/OpenNote-Functional-Spec.md) — complete behavior spec
- [Design Brief](design/OpenNote-Design-Brief.md) — design language and component states
