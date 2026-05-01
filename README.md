# OpenNote

A local, privacy-first AI-powered video transcription and knowledge management tool. Upload videos, get timestamped transcripts, generate structured notes, and chat with your content through a RAG-powered interface.

[![Watch the demo](https://img.youtube.com/vi/ca1qwWn9vFE/maxresdefault.jpg)](https://youtu.be/ca1qwWn9vFE)

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.8+
- FFmpeg installed and on your `PATH`
- An OpenAI API key (for chat and note generation — transcription runs locally for free)

### Install & Run

```bash
# Install server dependencies
cd server && npm install

# Install Python dependencies
pip install openai-whisper

# Install and build the frontend
cd ../client && npm install && npm run build

# Start the server
cd ../server && node index.js
```

Open [http://localhost:5001](http://localhost:5001) in your browser.

> On first use, Whisper will download the base model (~140MB) automatically. This only happens once.

## Features

### Video Processing Pipeline

Upload one or many videos and TranscriptGen handles the rest automatically:

1. **Upload** — Files are received and staged in `/uploads`
2. **Compression** — FFmpeg re-encodes to H.265 with AAC audio at 128kbps, reducing file size without significant quality loss
3. **Transcription** — OpenAI Whisper runs locally via Python to produce timestamped transcript segments
4. **Indexing** — Vector embeddings are generated automatically once transcription completes, making the video instantly queryable via chat

Each video moves through `uploading → compressing → transcribing → done` states, visible in real-time via the sidebar's live progress indicators.

### Transcript Viewer

- Clickable timestamps — clicking any segment seeks the video player to that exact moment
- Local search (`Cmd/Ctrl+F`) highlights matching segments within the active video
- Export transcript as a `.txt` file
- Collapsible sidebars for a distraction-free reading experience

### Global Search

Press `Cmd/Ctrl+Shift+F` to search across all videos and notes simultaneously. Fuse.js powers fuzzy matching, so partial or approximate queries still surface relevant results. Clicking a result navigates to the video and seeks to the matching timestamp.

### Note Generation

Select one or more videos and generate structured notes from their combined transcripts using OpenAI. Customize the output with:

- **Model selection**: GPT-4o, GPT-4o-mini (default), o3-mini, or o1-mini
- **Custom prompt**: Provide specific instructions — e.g., "extract only action items", "summarize in bullet points by speaker", or any format you need
- Notes are saved as Markdown files, renameable directly from the UI, and downloadable as `.md`

### Bulk Export

Select multiple videos and export their transcripts merged into a single file with a custom filename — useful for creating consolidated reference documents from a lecture series or interview collection.

### Chat with Your Transcripts (RAG)

Ask questions in plain language and get answers grounded in your actual video content, with clickable citations that link directly to the relevant video timestamp.

## RAG System — How It Works

The chat feature uses Retrieval-Augmented Generation (RAG) to connect your questions to specific moments in your transcripts.

### Indexing

After transcription completes, each video's transcript is chunked into groups of 5 consecutive segments. Each chunk is sent to OpenAI's `text-embedding-3-small` model, which converts the text into a high-dimensional vector representing its semantic meaning. These vectors are stored locally in `embeddings.json` alongside the chunk text, start timestamp, and source video ID.

```
Transcript segments → Group by 5 → text-embedding-3-small → Stored vector chunks
```

Indexing happens automatically in the background and persists across server restarts, so videos only need to be indexed once.

### Querying

When you send a chat message:

1. Your question is converted to a vector using the same `text-embedding-3-small` model
2. Cosine similarity is computed between your query vector and every stored chunk
3. The top 5 most semantically similar chunks are selected as context
4. Those chunks — along with their source video names and timestamps — are passed to the selected LLM
5. The model generates an answer grounded exclusively in the retrieved content
6. The response includes **clickable citations**: each citation shows the video name, timestamp, and a preview of the relevant text — clicking navigates directly to that moment in the video

```
User question → Embed query → Cosine similarity against all chunks → Top 5 retrieved
→ LLM generates grounded answer → Clickable citations with timestamps
```

## Parallel Processing & Optimizations

### Concurrent Video Processing

When multiple videos are uploaded at once, each one enters the pipeline independently. Compression and transcription jobs run as separate background processes — the server does not block on any single video, and the frontend polls for status updates every 3 seconds. You can continue browsing existing transcripts while new ones process in the background.

### Hardware Acceleration

**macOS video compression**: FFmpeg uses `hevc_videotoolbox`, Apple's hardware-accelerated H.265 encoder, offloading compression to the GPU/media engine and dramatically reducing CPU usage and encoding time compared to software encoding.

**Whisper GPU support**: `transcribe.py` auto-detects CUDA at startup. If a compatible NVIDIA GPU is present, Whisper runs on the GPU for significantly faster transcription. Systems without a GPU fall back to CPU automatically — no configuration needed.

### Efficient Embedding Strategy

Rather than embedding every individual transcript segment (which would create thousands of tiny, low-context vectors), TranscriptGen groups segments into chunks of 5 before embedding. This reduces the total number of vectors, lowers API cost, provides richer semantic context per chunk, and keeps `embeddings.json` a manageable size as your library grows.

### Crash Recovery

On server restart, TranscriptGen scans `db.json` for any videos stuck in intermediate states (`uploading`, `compressing`, `transcribing`). If the source file still exists on disk, processing resumes automatically. If the file is missing (e.g., the upload was incomplete), the video is marked as errored. Videos that completed transcription but are missing embeddings are re-indexed automatically.

## Keyboard Shortcuts

| Shortcut               | Action                                       |
| ---------------------- | -------------------------------------------- |
| `Cmd/Ctrl + Shift + F` | Open global search (all videos and notes)    |
| `Cmd/Ctrl + F`         | Open local search (current video transcript) |
| `Escape`               | Close search overlay or dismiss modal        |
| `Enter`                | Send chat message                            |
| `Shift + Enter`        | Add newline in chat input                    |
| `Enter`                | Confirm video or note rename                 |
| `Escape`               | Cancel rename without saving                 |

## Configuration

Open the Settings modal from the sidebar to configure:

| Setting            | Description                                           | Default                          |
| ------------------ | ----------------------------------------------------- | -------------------------------- |
| **OpenAI API Key** | Required for chat and note generation                 | —                                |
| **Model**          | LLM used for notes and chat responses                 | `gpt-4o-mini`                    |
| **Custom Prompt**  | Instructions applied to every note generation request | Built-in structured notes prompt |

Settings are stored in `server/settings.json`. The API key is never sent to the client.
