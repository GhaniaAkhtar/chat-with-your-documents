import { useState } from "react";
import UploadZone from "./components/UploadZone";
import DocumentSidebar from "./components/DocumentSidebar";
import ChatPanel from "./components/ChatPanel";
import { uploadDocuments } from "./api";

export default function App() {
  const [session, setSession] = useState(null); // { sessionId, files, chunkCount }
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  async function handleUpload(files) {
    setIsUploading(true);
    setUploadError(null);
    try {
      const result = await uploadDocuments(files);
      setSession({
        sessionId: result.session_id,
        files: result.files_processed,
        chunkCount: result.total_chunks,
      });
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setIsUploading(false);
    }
  }

  if (!session) {
    return (
      <UploadZone
        onUpload={handleUpload}
        isUploading={isUploading}
        error={uploadError}
      />
    );
  }

  return (
    <div className="flex h-screen bg-blueprint-bg">
      <DocumentSidebar
        files={session.files}
        chunkCount={session.chunkCount}
        onNewSession={() => setSession(null)}
      />
      <ChatPanel sessionId={session.sessionId} />
    </div>
  );
}
