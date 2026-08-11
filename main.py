import uuid

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.parsing import extract_text
from app.chunking import chunk_document
from app.vectorstore import add_chunks, query_chunks, session_exists
from app.prompting import build_citation_map
from app.chat import stream_answer

app = FastAPI(title="Chat With Your Documents - API")

# Allow the React frontend (running on a different port/domain) to call this API.
# In step 5 (deploy) we'll lock this down to the real frontend URL instead of "*".
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

ALLOWED_EXTENSIONS = {"pdf", "docx", "txt"}
MAX_FILE_SIZE_MB = 20


class SearchRequest(BaseModel):
    session_id: str
    query: str
    top_k: int = 4


class ChatRequest(BaseModel):
    session_id: str
    question: str
    top_k: int = 4


# In-memory chat history per session: session_id -> [{"role": ..., "content": ...}, ...]
# For a portfolio-scale project this is fine; a production app would use Redis/a DB
# so history survives server restarts and works across multiple server instances.
CHAT_HISTORY: dict[str, list[dict]] = {}


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/upload")
async def upload_documents(files: list[UploadFile] = File(...)):
    if not files:
        raise HTTPException(status_code=400, detail="No files provided.")

    session_id = str(uuid.uuid4())
    all_chunks: list[dict] = []

    for upload in files:
        ext = upload.filename.lower().rsplit(".", 1)[-1] if "." in upload.filename else ""
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type '{upload.filename}'. Allowed: {sorted(ALLOWED_EXTENSIONS)}",
            )

        file_bytes = await upload.read()
        size_mb = len(file_bytes) / (1024 * 1024)
        if size_mb > MAX_FILE_SIZE_MB:
            raise HTTPException(
                status_code=400,
                detail=f"'{upload.filename}' is {size_mb:.1f}MB, exceeds {MAX_FILE_SIZE_MB}MB limit.",
            )

        try:
            pages = extract_text(upload.filename, file_bytes)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

        if not pages:
            raise HTTPException(
                status_code=400,
                detail=f"Could not extract any text from '{upload.filename}'. It may be scanned/image-only.",
            )

        doc_chunks = chunk_document(upload.filename, pages)
        all_chunks.extend(doc_chunks)

    if not all_chunks:
        raise HTTPException(status_code=400, detail="No extractable text found in any uploaded file.")

    # Embed all chunks and store them in the vector database for this session.
    add_chunks(session_id, all_chunks)

    return {
        "session_id": session_id,
        "files_processed": [f.filename for f in files],
        "total_chunks": len(all_chunks),
    }


@app.post("/search")
def search_documents(request: SearchRequest):
    """
    Temporary test endpoint for Step 2 — lets us verify retrieval quality
    before wiring up the LLM answer generation in Step 3.
    """
    if not session_exists(request.session_id):
        raise HTTPException(status_code=404, detail="Session not found or has no documents.")

    matches = query_chunks(request.session_id, request.query, top_k=request.top_k)
    return {"query": request.query, "matches": matches}


@app.post("/chat")
def chat(request: ChatRequest):
    """
    Retrieval-augmented chat endpoint. Streams the answer back as Server-Sent
    Events so the frontend can render it token-by-token.

    Response stream format (each line is one SSE event):
      event: citations
      data: {"Source 1": {"filename": ..., "page": ...}, ...}

      event: token
      data: "next chunk of answer text"

      event: done
      data: {}
    """
    if not session_exists(request.session_id):
        raise HTTPException(status_code=404, detail="Session not found or has no documents.")

    matches = query_chunks(request.session_id, request.question, top_k=request.top_k)
    citation_map = build_citation_map(matches)
    history = CHAT_HISTORY.get(request.session_id, [])

    def event_generator():
        import json

        yield f"event: citations\ndata: {json.dumps(citation_map)}\n\n"

        full_answer = ""
        try:
            for text_piece in stream_answer(matches, request.question, history):
                full_answer += text_piece
                # Escape newlines so each SSE "data:" line stays on one line
                safe_piece = json.dumps(text_piece)
                yield f"event: token\ndata: {safe_piece}\n\n"
        except RuntimeError as e:
            yield f"event: error\ndata: {json.dumps(str(e))}\n\n"
            return

        # Save this turn to history for follow-up questions
        history.append({"role": "user", "content": request.question})
        history.append({"role": "assistant", "content": full_answer})
        CHAT_HISTORY[request.session_id] = history

        yield "event: done\ndata: {}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
