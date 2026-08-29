"""Distributed tracing context for RiskSentinel."""
import uuid
from contextvars import ContextVar
from dataclasses import dataclass, field
from typing import Dict, List, Optional
import time


@dataclass
class TraceSpan:
    """A single trace span."""
    name: str
    start_time: float
    end_time: Optional[float] = None
    parent_id: Optional[str] = None
    span_id: str = field(default_factory=lambda: str(uuid.uuid4())[:8])
    tags: Dict[str, str] = field(default_factory=dict)
    logs: List[Dict] = field(default_factory=list)
    
    @property
    def duration_ms(self) -> float:
        if self.end_time:
            return (self.end_time - self.start_time) * 1000
        return (time.time() - self.start_time) * 1000
    
    def finish(self, tags: Optional[Dict] = None):
        self.end_time = time.time()
        if tags:
            self.tags.update(tags)
    
    def log(self, message: str, **fields):
        self.logs.append({
            "timestamp": time.time(),
            "message": message,
            **fields
        })


class TraceContext:
    """Manages trace context for a request."""
    
    def __init__(self, trace_id: Optional[str] = None, request_id: Optional[str] = None):
        self.trace_id = trace_id or str(uuid.uuid4())
        self.request_id = request_id or str(uuid.uuid4())[:8]
        self.spans: List[TraceSpan] = []
        self._current_span: Optional[TraceSpan] = None
    
    def start_span(self, name: str, tags: Optional[Dict] = None) -> TraceSpan:
        parent_id = self._current_span.span_id if self._current_span else None
        span = TraceSpan(name=name, start_time=time.time(), parent_id=parent_id)
        if tags:
            span.tags.update(tags)
        self.spans.append(span)
        self._current_span = span
        return span
    
    def end_span(self, tags: Optional[Dict] = None):
        if self._current_span:
            self._current_span.finish(tags)
            self._current_span = self._current_span.parent_id and next(
                (s for s in reversed(self.spans) if s.span_id == self._current_span.parent_id), None
            ) or None
    
    def get_current_span(self) -> Optional[TraceSpan]:
        return self._current_span
    
    def to_dict(self) -> Dict:
        return {
            "trace_id": self.trace_id,
            "request_id": self.request_id,
            "spans": [
                {
                    "span_id": s.span_id,
                    "name": s.name,
                    "parent_id": s.parent_id,
                    "start_time": s.start_time,
                    "end_time": s.end_time,
                    "duration_ms": round(s.duration_ms, 2),
                    "tags": s.tags,
                    "logs": s.logs,
                }
                for s in self.spans
            ]
        }


# Global trace context (request-scoped)
_trace_context_var: ContextVar[Optional[TraceContext]] = ContextVar('trace_context', default=None)


def get_trace_context() -> TraceContext:
    """Get or create the current trace context."""
    ctx = _trace_context_var.get()
    if ctx is None:
        ctx = TraceContext()
        _trace_context_var.set(ctx)
    return ctx


def set_trace_context(ctx: TraceContext):
    """Set the current trace context."""
    _trace_context_var.set(ctx)


def clear_trace_context():
    """Clear the current trace context."""
    token = _trace_context_var.get()
    if token:
        _trace_context_var.set(None)


class TracedAgent:
    """Mixin to add tracing to agent nodes."""
    
    def __init__(self, agent_name: str):
        self.agent_name = agent_name
    
    def _start_trace(self, state, operation: str = "execute") -> TraceSpan:
        ctx = get_trace_context()
        span = ctx.start_span(f"{self.agent_name}.{operation}", {
            "agent": self.agent_name,
            "entity_id": state.get("entity_id", "unknown"),
            "entity_type": state.get("entity_type", "unknown"),
        })
        return span
    
    def _end_trace(self, span: TraceSpan, success: bool = True, error: Optional[str] = None):
        tags = {"success": str(success).lower()}
        if error:
            tags["error"] = error
        span.finish(tags)
        get_trace_context().end_span()


def trace_agent(agent_name: str):
    """Decorator to add tracing to agent functions."""
    def decorator(func):
        def wrapper(state, *args, **kwargs):
            ctx = get_trace_context()
            span = ctx.start_span(f"{agent_name}.execute", {
                "agent": agent_name,
                "entity_id": state.get("entity_id", "unknown"),
                "entity_type": state.get("entity_type", "unknown"),
            })
            try:
                result = func(state, *args, **kwargs)
                span.finish({"success": "true"})
                return result
            except Exception as e:
                span.finish({"success": "false", "error": str(e)})
                raise
        return wrapper
    return decorator