from fastapi import APIRouter
from app.api.v1.endpoints import risk_assessment, risk_dashboard, risk_copilot, simulator, approval, monitoring

api_router = APIRouter()
api_router.include_router(risk_assessment.router, prefix="/assess", tags=["Assessment"])
api_router.include_router(risk_dashboard.router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(risk_copilot.router, prefix="/copilot", tags=["Copilot"])
api_router.include_router(simulator.router, prefix="/simulate", tags=["Simulator"])
api_router.include_router(approval.router, prefix="/approvals", tags=["Approvals"])
api_router.include_router(monitoring.router, prefix="/monitoring", tags=["Monitoring"])
