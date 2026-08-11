# Chat with your documents

A full-stack RAG (Retrieval-Augmented Generation) app. Upload PDFs, Word docs, or text
files, then ask questions about them and get answers grounded in your documents —
with inline citations pointing back to the exact file and page.

## How it works

```
Upload files → extract text (page-aware) → split into overlapping chunks →
embed chunks (local sentence-transformers model) → store in a lightweight numpy vector store →

Ask a question → embed the question → retrieve the most relevant chunks →
build a prompt with numbered sources → stream an answer from Claude →
render citations as clickable tabs pointing to filename + page
```

## Stack

- **Backend:** FastAPI, a lightweight numpy-based vector store, sentence-transformers (local embeddings,
  `all-MiniLM-L6-v2`), Groq API (`llama-3.3-70b-versatile`, free tier) for answer generation
- **Frontend:** React + Vite + Tailwind CSS

## Running locally

### 1. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# edit .env and add your GROQ_API_KEY (get one free at console.groq.com/keys, no card needed)

uvicorn app.main:app --reload
```

The backend runs at `http://localhost:8000`. The first request that embeds text will
download the embedding model (~90MB, one-time, needs internet access).

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## Project structure

```
rag-project/
├── backend/
│   ├── app/
│   │   ├── main.py         # FastAPI routes: /upload, /search, /chat
│   │   ├── parsing.py      # PDF/DOCX/TXT text extraction
│   │   ├── chunking.py     # splits text into overlapping chunks
│   │   ├── embeddings.py   # sentence-transformers wrapper
│   │   ├── vectorstore.py  # numpy-based embedding store + cosine similarity search
│   │   ├── prompting.py    # builds the grounded system prompt
│   │   └── chat.py         # streams answers from Claude
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── api.js               # upload + SSE chat streaming client
    │   └── components/
    │       ├── UploadZone.jsx       # drag-and-drop file intake
    │       ├── DocumentSidebar.jsx  # uploaded-file "sheet index"
    │       ├── ChatPanel.jsx        # message list + input box
    │       ├── MessageBubble.jsx    # renders a single message, parses [Source N]
    │       └── CitationMarker.jsx   # numbered callout with filename/page popover
    └── package.json
```

## API endpoints

- `POST /upload` — multipart file upload, returns a `session_id`
- `POST /search` — debug endpoint, returns raw retrieved chunks for a query
- `POST /chat` — SSE stream: `citations` event, then `token` events, then `done`

## Notes on design decisions

- **Local embeddings, not an API** — keeps the project free to run and demonstrates
  understanding of the embedding step itself, not just calling an API.
- **Overlapping chunks (800 chars, 150 overlap)** — prevents losing context when a
  sentence gets cut at a chunk boundary.
- **Numpy vector store instead of ChromaDB** — ChromaDB pulls in `chroma-hnswlib`, which has
  no pre-built Windows wheel and requires Visual Studio Build Tools to compile from source.
  At this project's scale (a handful of documents per session), a plain cosine-similarity
  scan over numpy arrays is fast enough and has zero native dependencies — much more
  portable across operating systems.
- **Session-scoped storage** — each upload session gets its own isolated JSON file so different users' documents never mix in search results.
- **Streaming via Server-Sent Events** — chosen over plain polling or a raw text
  stream so citation metadata can be sent as a distinct, structured event before
  the answer tokens start arriving.
