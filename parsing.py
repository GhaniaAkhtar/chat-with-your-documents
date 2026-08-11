"""
Extracts raw text from uploaded files, keeping track of page numbers
where possible (used later for source citations).

Returns a list of dicts: [{"page": 1, "text": "..."}, {"page": 2, "text": "..."}]
For file types without a natural "page" concept (txt), everything is page 1.
"""

import fitz  # PyMuPDF
import docx
import io


def extract_pdf(file_bytes: bytes) -> list[dict]:
    pages = []
    with fitz.open(stream=file_bytes, filetype="pdf") as doc:
        for page_number, page in enumerate(doc, start=1):
            text = page.get_text()
            if text.strip():
                pages.append({"page": page_number, "text": text})
    return pages


def extract_docx(file_bytes: bytes) -> list[dict]:
    document = docx.Document(io.BytesIO(file_bytes))
    full_text = "\n".join(p.text for p in document.paragraphs if p.text.strip())
    # DOCX has no reliable page concept without a rendering engine,
    # so we treat the whole document as one logical "page".
    return [{"page": 1, "text": full_text}] if full_text.strip() else []


def extract_txt(file_bytes: bytes) -> list[dict]:
    text = file_bytes.decode("utf-8", errors="ignore")
    return [{"page": 1, "text": text}] if text.strip() else []


def extract_text(filename: str, file_bytes: bytes) -> list[dict]:
    ext = filename.lower().rsplit(".", 1)[-1]

    if ext == "pdf":
        return extract_pdf(file_bytes)
    elif ext == "docx":
        return extract_docx(file_bytes)
    elif ext == "txt":
        return extract_txt(file_bytes)
    else:
        raise ValueError(f"Unsupported file type: .{ext}")
