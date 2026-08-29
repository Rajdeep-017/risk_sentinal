"""Monitoring API endpoints."""
import time
from fastapi import APIRouter, Response
from app.monitoring.metrics import metrics_collector
from app.monitoring.logging import get_logger

router = APIRouter()
logger = get_logger("risksentinel.monitoring")


@router.get("/metrics")
async def get_metrics():
    """Get Prometheus-formatted metrics."""
    return Response(content=metrics_collector.get_prometheus_format(), media_type="text/plain")


@router.get("/metrics/json")
async def get_metrics_json():
    """Get metrics in JSON format."""
    return metrics_collector.get_all_metrics()


@router.get("/health/detailed")
async def detailed_health():
    """Detailed health check with agent status."""
    metrics = metrics_collector.get_all_metrics()
    return {
        "status": "ok",
        "agents": metrics,
        "timestamp": time.time(),
    }