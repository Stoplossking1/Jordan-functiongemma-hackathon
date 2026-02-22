import json
import os
import sys
import threading
import time
from typing import Any, Literal

import httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

# Cactus Python bindings path. Defaults to the same layout as the hackathon repo.
cactus_python_src = os.environ.get("LUMINA_CACTUS_PYTHON_SRC", "cactus/python/src")
if cactus_python_src not in sys.path:
    sys.path.insert(0, cactus_python_src)

from cactus import cactus_complete, cactus_destroy, cactus_init  # noqa: E402  # type: ignore

DEFAULT_WEIGHTS_PATH = os.environ.get("LUMINA_CACTUS_WEIGHTS_PATH", "cactus/weights/functiongemma-270m-it")
DEFAULT_STOP_SEQUENCES = ["<|im_end|>", "<end_of_turn>"]
DEFAULT_SYSTEM_INSTRUCTION = "You are a helpful assistant that can use tools."

# Gemini API configuration
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1"
GEMINI_MODEL = "gemini-2.5-flash"


class GatewayMessage(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str


class InferRequest(BaseModel):
    messages: list[GatewayMessage]
    tools: list[dict[str, Any]]
    systemInstruction: str | None = None
    temperature: float = 0.0
    forceTools: bool = True
    maxTokens: int = 256


class TranscribeRequest(BaseModel):
    audioBase64: str
    audioMimeType: str = "audio/mp4"
    prompt: str | None = None


class TranscribeResponse(BaseModel):
    text: str
    confidence: float = 0.0
    totalTimeInMs: float = 0.0


class FunctionCall(BaseModel):
    name: str
    arguments: dict[str, Any] = Field(default_factory=dict)


class InferResponse(BaseModel):
    functionCalls: list[FunctionCall] = Field(default_factory=list)
    confidence: float = 0.0
    totalTimeInMs: float = 0.0
    rawText: str | None = None


app = FastAPI(title="Lumina Cactus Gateway")
_model_lock = threading.Lock()
_model: Any | None = None


def get_model() -> Any:
    global _model
    with _model_lock:
        if _model is None:
            _model = cactus_init(DEFAULT_WEIGHTS_PATH)
        return _model


def destroy_model() -> None:
    global _model
    with _model_lock:
        if _model is not None:
            cactus_destroy(_model)
            _model = None


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/infer", response_model=InferResponse)
def infer(payload: InferRequest) -> InferResponse:
    if len(payload.tools) == 0:
        raise HTTPException(status_code=400, detail="At least one tool definition is required")

    try:
        model = get_model()

        system_instruction = payload.systemInstruction or DEFAULT_SYSTEM_INSTRUCTION
        cactus_tools = [{"type": "function", "function": tool} for tool in payload.tools]
        cactus_messages = [{"role": "system", "content": system_instruction}] + [
            {"role": message.role, "content": message.content}
            for message in payload.messages
        ]

        raw_text = cactus_complete(
            model,
            cactus_messages,
            tools=cactus_tools,
            temperature=payload.temperature,
            force_tools=payload.forceTools,
            max_tokens=payload.maxTokens,
            stop_sequences=DEFAULT_STOP_SEQUENCES,
        )

        try:
            parsed = json.loads(raw_text)
        except json.JSONDecodeError:
            return InferResponse(functionCalls=[], confidence=0.0, totalTimeInMs=0.0, rawText=raw_text)

        function_calls_raw = parsed.get("function_calls")
        function_calls: list[FunctionCall] = []
        if isinstance(function_calls_raw, list):
            for item in function_calls_raw:
                if not isinstance(item, dict):
                    continue
                name = item.get("name")
                arguments = item.get("arguments")
                if not isinstance(name, str):
                    continue
                if not isinstance(arguments, dict):
                    continue
                function_calls.append(FunctionCall(name=name, arguments=arguments))

        confidence = parsed.get("confidence") if isinstance(parsed.get("confidence"), (int, float)) else 0.0
        total_time = parsed.get("total_time_ms") if isinstance(parsed.get("total_time_ms"), (int, float)) else 0.0

        return InferResponse(
            functionCalls=function_calls,
            confidence=float(confidence),
            totalTimeInMs=float(total_time),
            rawText=raw_text,
        )
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Cactus inference failed: {error}") from error


@app.post("/transcribe", response_model=TranscribeResponse)
def transcribe(payload: TranscribeRequest) -> TranscribeResponse:
    """Transcribe audio using Gemini API."""
    start_time = time.time()
    
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY environment variable not set")
    
    try:
        transcription_prompt = payload.prompt or (
            "Transcribe this audio recording. The person is describing a math problem. "
            "Output ONLY the transcription of what they said, nothing else."
        )
        
        request_body = {
            "contents": [
                {
                    "parts": [
                        {"text": transcription_prompt},
                        {
                            "inline_data": {
                                "mime_type": payload.audioMimeType,
                                "data": payload.audioBase64,
                            }
                        },
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0,
                "maxOutputTokens": 1024,
            },
        }
        
        url = f"{GEMINI_API_BASE_URL}/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
        
        with httpx.Client(timeout=30.0) as client:
            response = client.post(
                url,
                json=request_body,
                headers={"Content-Type": "application/json"},
            )
        
        if response.status_code != 200:
            error_detail = response.text
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Gemini API error: {error_detail}"
            )
        
        data = response.json()
        transcription = ""
        
        # Extract transcription from Gemini response
        candidates = data.get("candidates", [])
        if candidates:
            content = candidates[0].get("content", {})
            parts = content.get("parts", [])
            if parts:
                transcription = parts[0].get("text", "").strip()
        
        total_time_ms = (time.time() - start_time) * 1000
        
        return TranscribeResponse(
            text=transcription,
            confidence=1.0 if transcription else 0.0,
            totalTimeInMs=total_time_ms,
        )
        
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {error}") from error


@app.on_event("shutdown")
def on_shutdown() -> None:
    destroy_model()
