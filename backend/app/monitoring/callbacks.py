"""Simplified monitoring callback for agent instrumentation without langchain dependency."""
from typing import Any, Dict, Optional
from app.monitoring.metrics import metrics_collector, set_current_request_id, clear_current_request_id
from app.monitoring.logging import get_logger, log_agent_start, log_agent_end, log_agent_error
from app.monitoring.tracing import get_trace_context
import time


logger = get_logger("risksentinel.callbacks")


class MonitoringCallback:
    """Simple callback for monitoring agent execution without langchain dependency."""
    
    def __init__(self, request_id: Optional[str] = None, entity_id: Optional[str] = None, 
                 entity_type: Optional[str] = None):
        self.request_id = request_id or f"req_{int(time.time() * 1000)}"
        self.entity_id = entity_id
        self.entity_type = entity_type
        self._agent_start_times: Dict[str, float] = {}
        set_current_request_id(self.request_id)
    
    def on_agent_start(self, agent_name: str, inputs: Optional[Dict] = None) -> None:
        """Called when an agent starts."""
        self._agent_start_times[agent_name] = time.perf_counter()
        log_agent_start(logger, agent_name, 
                       entity_id=self.entity_id, 
                       entity_type=self.entity_type,
                       request_id=self.request_id)
        
        # Start trace span
        from app.monitoring.tracing import trace_agent
        trace_agent(agent_name)
        ctx = get_trace_context()
        ctx.start_span(f"{agent_name}.execute", {
            "agent": agent_name,
            "entity_id": self.entity_id or "unknown",
            "entity_type": self.entity_type or "unknown",
        })
    
    def on_agent_end(self, agent_name: str, outputs: Optional[Dict] = None) -> None:
        """Called when an agent ends successfully."""
        if agent_name in self._agent_start_times:
            start_time = self._agent_start_times.pop(agent_name)
            duration_ms = (time.perf_counter() - start_time) * 1000
            
            metrics_collector.record_agent_call(agent_name, duration_ms, True)
            metrics_collector.record_agent_timing(self.request_id, agent_name, duration_ms, True)
            
            log_agent_end(logger, agent_name, duration_ms, True,
                         entity_id=self.entity_id,
                         entity_type=self.entity_type,
                         request_id=self.request_id)
            
            # End trace span
            ctx = get_trace_context()
            ctx.end_span({"success": "true"})
    
    def on_agent_error(self, agent_name: str, error: Exception) -> None:
        """Called when an agent errors."""
        if agent_name in self._agent_start_times:
            start_time = self._agent_start_times.pop(agent_name)
            duration_ms = (time.perf_counter() - start_time) * 1000
            
            metrics_collector.record_agent_call(agent_name, duration_ms, False, str(error))
            metrics_collector.record_agent_timing(self.request_id, agent_name, duration_ms, False)
            
            log_agent_error(logger, agent_name, error,
                           entity_id=self.entity_id,
                           entity_type=self.entity_type,
                           request_id=self.request_id)
            
            # End trace span with error
            ctx = get_trace_context()
            ctx.end_span({"success": "false", "error": str(error)})
    
    def cleanup(self):
        """Clean up request context."""
        clear_current_request_id()


def create_monitoring_callback(request_id: Optional[str] = None, entity_id: Optional[str] = None,
                               entity_type: Optional[str] = None) -> MonitoringCallback:
    """Create a monitoring callback handler for a request."""
    return MonitoringCallback(request_id, entity_id, entity_type)