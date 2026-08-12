import CitationMarker from "./CitationMarker";

// Matches "[Source 1]", "[Source 2]", etc. inside the model's answer text.
const CITATION_REGEX = /\[Source (\d+)\]/g;

function renderLineWithCitations(line, citations, keyPrefix) {
  const parts = [];
  let lastIndex = 0;
  let match;
  CITATION_REGEX.lastIndex = 0;

  while ((match = CITATION_REGEX.exec(line)) !== null) {
    if (match.index > lastIndex) {
      parts.push(line.slice(lastIndex, match.index));
    }
    const number = match[1];
    const source = citations?.[`Source ${number}`];
    parts.push(
      <CitationMarker key={`${keyPrefix}-${match.index}-${number}`} number={number} source={source} />
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < line.length) {
    parts.push(line.slice(lastIndex));
  }

  return parts;
}

function renderAnswer(text, citations) {
  // Split into lines so bullet points and paragraphs render on their own
  // lines instead of collapsing into one dense block (HTML ignores plain \n).
  const lines = text.split("\n");

  return lines.map((line, i) => {
    const trimmed = line.trim();
    const isBullet = trimmed.startsWith("- ");
    const content = renderLineWithCitations(isBullet ? trimmed.slice(2) : line, citations, i);

    if (trimmed === "") {
      return <div key={i} className="h-2" />;
    }

    if (isBullet) {
      return (
        <div key={i} className="flex gap-2 pl-1">
          <span className="text-amber">–</span>
          <span>{content}</span>
        </div>
      );
    }

    return <div key={i}>{content}</div>;
  });
}

export default function MessageBubble({ role, text, citations, isStreaming }) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-sm px-4 py-3 font-body text-sm leading-relaxed ${
          isUser
            ? "bg-teal/15 text-blueprint-line"
            : "border border-blueprint-border bg-blueprint-panel text-blueprint-line"
        }`}
      >
        {!isUser && (
          <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-teal">
            Answer
          </p>
        )}
        {isUser ? (
          text
        ) : (
          <div className={`space-y-0.5 ${isStreaming ? "streaming-cursor" : ""}`}>
            {renderAnswer(text, citations)}
          </div>
        )}
      </div>
    </div>
  );
}
