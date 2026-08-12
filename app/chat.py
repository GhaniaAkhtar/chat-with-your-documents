"""
Handles the actual call to the Groq API, including streaming the response
back token-by-token so the frontend can render it live (like ChatGPT).

Groq is a free LLM provider that runs open models (like Llama) very fast.
No credit card required to get an API key.
"""

import os
from groq import Groq
from dotenv import load_dotenv

from app.prompting import build_system_prompt

load_dotenv()

_client = None

# Llama 3.3 70B - free on Groq, strong general-purpose quality.
MODEL_NAME = "llama-3.3-70b-versatile"


def get_client() -> Groq:
    global _client
    if _client is None:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise RuntimeError(
                "GROQ_API_KEY not set. Copy .env.example to .env and add your free key "
                "from https://console.groq.com/keys"
            )
        _client = Groq(api_key=api_key)
    return _client


def stream_answer(matches: list[dict], question: str, history: list[dict]):
    """
    Yields text chunks as they arrive from the model.

    history: prior turns in this session, as [{"role": "user"/"assistant", "content": "..."}]
    Passing history in lets follow-up questions ("what about the second one?")
    work correctly, since the model sees the earlier conversation.
    """
    client = get_client()
    system_prompt = build_system_prompt(matches)

    messages = (
        [{"role": "system", "content": system_prompt}]
        + history
        + [{"role": "user", "content": question}]
    )

    stream = client.chat.completions.create(
        model=MODEL_NAME,
        messages=messages,
        max_tokens=1024,
        stream=True,
    )

    for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta
