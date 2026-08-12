// Base URL of the backend. In development this points at your local FastAPI
// server. Before deploying, set VITE_API_URL in a .env file to your deployed
// backend URL (e.g. https://your-app.onrender.com).
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function uploadDocuments(files) {
  const formData = new FormData();
  for (const file of files) {
    formData.append("files", file);
  }

  const response = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: "Upload failed." }));
    throw new Error(err.detail || "Upload failed.");
  }

  return response.json();
}

/**
 * Streams a chat answer using Server-Sent Events.
 *
 * The backend sends three event types:
 *   - "citations": a map of "Source 1" -> {filename, page}, sent once at the start
 *   - "token": one small piece of answer text, sent repeatedly
 *   - "done": signals the stream is complete
 *   - "error": something went wrong server-side (e.g. missing API key)
 *
 * Callbacks let the UI update live as each event arrives, instead of waiting
 * for the whole response.
 */
export async function streamChat(
  { sessionId, question },
  { onCitations, onToken, onDone, onError }
) {
  const response = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, question }),
  });

  if (!response.ok || !response.body) {
    const err = await response.json().catch(() => ({ detail: "Chat request failed." }));
    onError?.(err.detail || "Chat request failed.");
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // SSE events are separated by a blank line ("\n\n")
    const events = buffer.split("\n\n");
    buffer = events.pop(); // keep the last (possibly incomplete) chunk in the buffer

    for (const rawEvent of events) {
      const lines = rawEvent.split("\n");
      const eventLine = lines.find((l) => l.startsWith("event:"));
      const dataLine = lines.find((l) => l.startsWith("data:"));
      if (!eventLine || !dataLine) continue;

      const eventType = eventLine.replace("event:", "").trim();
      const dataRaw = dataLine.replace("data:", "").trim();

      let data;
      try {
        data = JSON.parse(dataRaw);
      } catch {
        continue;
      }

      if (eventType === "citations") onCitations?.(data);
      else if (eventType === "token") onToken?.(data);
      else if (eventType === "error") onError?.(data);
      else if (eventType === "done") onDone?.();
    }
  }
}
