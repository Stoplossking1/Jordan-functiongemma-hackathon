import json
import os
import sys
import threading
from typing import Any, Literal

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

# Cactus Python bindings path. Defaults to the same layout as the hackathon repo.
cactus_python_src = os.environ.get("LUMINA_CACTUS_PYTHON_SRC", "cactus/python/src")
if cactus_python_src not in sys.path:
    sys.path.insert(0, cactus_python_src)

from cactus import cactus_complete, cactus_destroy, cactus_init  # noqa: E402

DEFAULT_WEIGHTS_PATH = os.environ.get("LUMINA_CACTUS_WEIGHTS_PATH", "cactus/weights/functiongemma-270m-it")
DEFAULT_STOP_SEQUENCES = ["<|im_end|>", "<end_of_turn>"]
DEFAULT_SYSTEM_INSTRUCTION = "You are a helpful assistant that can use tools."


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


@app.on_event("shutdown")
def on_shutdown() -> None:
    destroy_model()
