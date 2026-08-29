"""Structured JSON logging for RiskSentinel."""
import json
import logging
import sys
import time
import uuid
from contextvars import ContextVar
from datetime import datetime, timezone
from typing import Any, Dict, Optional


# Context variables for correlation IDs
request_id_var: ContextVar[Optional[str]] = ContextVar('request_id', default=None)
entity_id_var: ContextVar[Optional[str]] = ContextVar('entity_id', default=None)
entity_type_var: ContextVar[Optional[str]] = ContextVar('entity_type', default=None)
trace_id_var: ContextVar[Optional[str]] = ContextVar('trace_id', default=None)


class StructuredFormatter(logging.Formatter):
    """JSON formatter with correlation IDs."""
    
    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        
        # Add correlation IDs if present
        request_id = request_id_var.get()
        if request_id:
            log_data["request_id"] = request_id
        
        entity_id = entity_id_var.get()
        if entity_id:
            log_data["entity_id"] = entity_id
        
        entity_type = entity_type_var.get()
        if entity_type:
            log_data["entity_type"] = entity_type
        
        trace_id = trace_id_var.get()
        if trace_id:
            log_data["trace_id"] = trace_id
        
        # Add extra fields
        for key, value in record.__dict__.items():
            if key not in ['name', 'msg', 'args', 'created', 'filename', 'funcName', 
                          'levelname', 'levelno', 'lineno', 'module', 'msecs', 
                          'message', 'msg', 'name', 'pathname', 'process', 
                          'processName', 'relativeCreated', 'thread', 'threadName',
                          'exc_info', 'exc_text', 'stack_info']:
                try:
                    json.dumps(value)
                    log_data[key] = value
                except (TypeError, ValueError):
                    log_data[key] = str(value)
        
        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        
        return json.dumps(log_data, ensure_ascii=False)


def setup_structured_logging(level: str = "INFO"):
    """Configure structured JSON logging for the application."""
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, level.upper(), logging.INFO))
    
    # Remove existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # Add JSON handler
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(StructuredFormatter())
    root_logger.addHandler(handler)
    
    # Reduce noise from third-party loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.error").setLevel(logging.INFO)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    """Get a logger instance with structured formatting."""
    return logging.getLogger(name)


class CorrelationContext:
    """Context manager for setting correlation IDs."""
    
    def __init__(self, request_id: Optional[str] = None, entity_id: Optional[str] = None, 
                 entity_type: Optional[str] = None, trace_id: Optional[str] = None):
        self.request_id = request_id or str(uuid.uuid4())[:8]
        self.entity_id = entity_id
        self.entity_type = entity_type
        self.trace_id = trace_id or str(uuid.uuid4())
        self._tokens = []
    
    def __enter__(self):
        self._tokens.append(request_id_var.set(self.request_id))
        if self.entity_id:
            self._tokens.append(entity_id_var.set(self.entity_id))
        if self.entity_type:
            self._tokens.append(entity_type_var.set(self.entity_type))
        self._tokens.append(trace_id_var.set(self.trace_id))
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        for token in reversed(self._tokens):
            if token.var is request_id_var:
                request_id_var.reset(token)
            elif token.var is entity_id_var:
                entity_id_var.reset(token)
            elif token.var is entity_type_var:
                entity_type_var.reset(token)
            elif token.var is trace_id_var:
                trace_id_var.reset(token)


def log_agent_start(logger: logging.Logger, agent_name: str, **extra):
    """Log agent execution start."""
    logger.info(f"Agent started: {agent_name}", extra={"agent": agent_name, "event": "agent_start", **extra})


def log_agent_end(logger: logging.Logger, agent_name: str, duration_ms: float, success: bool, **extra):
    """Log agent execution end."""
    logger.info(
        f"Agent completed: {agent_name} ({duration_ms:.2f}ms, {'success' if success else 'failed'})",
        extra={
            "agent": agent_name,
            "event": "agent_end",
            "duration_ms": round(duration_ms, 2),
            "success": success,
            **extra
        }
    )


def log_agent_error(logger: logging.Logger, agent_name: str, error: Exception, **extra):
    """Log agent execution error."""
    logger.error(
        f"Agent failed: {agent_name} - {str(error)}",
        extra={
            "agent": agent_name,
            "event": "agent_error",
            "error_type": type(error).__name__,
            "error_message": str(error),
            **extra
        },
        exc_info=True
    )