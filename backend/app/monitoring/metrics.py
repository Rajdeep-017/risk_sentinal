"""Prometheus metrics collection for agent monitoring."""
import time
import threading
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Dict, Optional
from functools import wraps
import uuid


@dataclass
class AgentMetrics:
    """Metrics for a single agent."""
    name: str
    total_calls: int = 0
    total_duration_ms: float = 0.0
    success_count: int = 0
    error_count: int = 0
    last_error: Optional[str] = None
    last_duration_ms: float = 0.0
    min_duration_ms: float = float('inf')
    max_duration_ms: float = 0.0

    def record_call(self, duration_ms: float, success: bool, error: Optional[str] = None):
        self.total_calls += 1
        self.total_duration_ms += duration_ms
        self.last_duration_ms = duration_ms
        self.min_duration_ms = min(self.min_duration_ms, duration_ms)
        self.max_duration_ms = max(self.max_duration_ms, duration_ms)
        if success:
            self.success_count += 1
        else:
            self.error_count += 1
            self.last_error = error

    @property
    def avg_duration_ms(self) -> float:
        return self.total_duration_ms / self.total_calls if self.total_calls > 0 else 0.0

    @property
    def success_rate(self) -> float:
        return self.success_count / self.total_calls if self.total_calls > 0 else 0.0

    @property
    def error_rate(self) -> float:
        return self.error_count / self.total_calls if self.total_calls > 0 else 0.0


class MetricsCollector:
    """Thread-safe metrics collector for all agents."""
    
    def __init__(self):
        self._agents: Dict[str, AgentMetrics] = {}
        self._lock = threading.RLock()
        self._request_metrics: Dict[str, Dict] = {}
        self._request_lock = threading.RLock()
    
    def get_agent(self, name: str) -> AgentMetrics:
        with self._lock:
            if name not in self._agents:
                self._agents[name] = AgentMetrics(name)
            return self._agents[name]
    
    def record_agent_call(self, name: str, duration_ms: float, success: bool, error: Optional[str] = None):
        agent = self.get_agent(name)
        agent.record_call(duration_ms, success, error)
    
    def get_all_metrics(self) -> Dict:
        with self._lock:
            return {
                name: {
                    "name": agent.name,
                    "total_calls": agent.total_calls,
                    "avg_duration_ms": round(agent.avg_duration_ms, 2),
                    "min_duration_ms": round(agent.min_duration_ms, 2) if agent.min_duration_ms != float('inf') else 0,
                    "max_duration_ms": round(agent.max_duration_ms, 2),
                    "last_duration_ms": round(agent.last_duration_ms, 2),
                    "success_count": agent.success_count,
                    "error_count": agent.error_count,
                    "success_rate": round(agent.success_rate, 4),
                    "error_rate": round(agent.error_rate, 4),
                    "last_error": agent.last_error,
                }
                for name, agent in self._agents.items()
            }
    
    def get_prometheus_format(self) -> str:
        """Export metrics in Prometheus format."""
        lines = [
            "# HELP risksentinel_agent_calls_total Total number of agent calls",
            "# TYPE risksentinel_agent_calls_total counter",
            "# HELP risksentinel_agent_duration_ms Agent execution duration in milliseconds",
            "# TYPE risksentinel_agent_duration_ms histogram",
            "# HELP risksentinel_agent_success_rate Agent success rate",
            "# TYPE risksentinel_agent_success_rate gauge",
            "# HELP risksentinel_agent_error_rate Agent error rate",
            "# TYPE risksentinel_agent_error_rate gauge",
        ]
        
        with self._lock:
            for agent in self._agents.values():
                name = agent.name.replace('.', '_').replace('-', '_')
                lines.append(f'risksentinel_agent_calls_total{{agent="{name}"}} {agent.total_calls}')
                lines.append(f'risksentinel_agent_duration_ms{{agent="{name}",quantile="0.5"}} {agent.avg_duration_ms:.2f}')
                lines.append(f'risksentinel_agent_duration_ms{{agent="{name}",quantile="0.95"}} {agent.max_duration_ms:.2f}')
                lines.append(f'risksentinel_agent_success_rate{{agent="{name}"}} {agent.success_rate:.4f}')
                lines.append(f'risksentinel_agent_error_rate{{agent="{name}"}} {agent.error_rate:.4f}')
        
        return "\n".join(lines) + "\n"
    
    def start_request(self, request_id: str, entity_id: str, entity_type: str):
        with self._request_lock:
            self._request_metrics[request_id] = {
                "request_id": request_id,
                "entity_id": entity_id,
                "entity_type": entity_type,
                "start_time": time.time(),
                "agent_timings": [],
            }
    
    def record_agent_timing(self, request_id: str, agent_name: str, duration_ms: float, success: bool):
        with self._request_lock:
            if request_id in self._request_metrics:
                self._request_metrics[request_id]["agent_timings"].append({
                    "agent": agent_name,
                    "duration_ms": round(duration_ms, 2),
                    "success": success,
                    "timestamp": time.time(),
                })
    
    def end_request(self, request_id: str) -> Optional[Dict]:
        with self._request_lock:
            if request_id not in self._request_metrics:
                return None
            req = self._request_metrics.pop(request_id)
            req["total_duration_ms"] = round((time.time() - req["start_time"]) * 1000, 2)
            return req


metrics_collector = MetricsCollector()


def timed_agent(agent_name: str):
    """Decorator to time agent execution and record metrics."""
    def decorator(func):
        @wraps(func)
        def wrapper(state, *args, **kwargs):
            start = time.perf_counter()
            request_id = getattr(wrapper, '_current_request_id', None)
            try:
                result = func(state, *args, **kwargs)
                duration_ms = (time.perf_counter() - start) * 1000
                metrics_collector.record_agent_call(agent_name, duration_ms, True)
                if request_id:
                    metrics_collector.record_agent_timing(request_id, agent_name, duration_ms, True)
                return result
            except Exception as e:
                duration_ms = (time.perf_counter() - start) * 1000
                metrics_collector.record_agent_call(agent_name, duration_ms, False, str(e))
                if request_id:
                    metrics_collector.record_agent_timing(request_id, agent_name, duration_ms, False)
                raise
        return wrapper
    return decorator


def set_current_request_id(request_id: str):
    """Set the current request ID for the timed_agent decorator."""
    timed_agent._current_request_id = request_id


def clear_current_request_id():
    """Clear the current request ID."""
    if hasattr(timed_agent, '_current_request_id'):
        delattr(timed_agent, '_current_request_id')