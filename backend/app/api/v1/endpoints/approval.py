"""Approval API — CRUD for risk mitigation approvals with persistence."""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone

router = APIRouter()

# In-memory store (replace with DB in production)
_approvals_store: List[dict] = [
    {
        "id": "app_001",
        "assessment_id": "assess_001",
        "entity_id": "C-1024",
        "action": "Implement step-up authentication for velocity anomalies",
        "action_type": "SECURITY_CONTROL",
        "category": "fraud",
        "confidence": 0.92,
        "expected_impact": "Block 90% of velocity-based fraud",
        "risk_level": "HIGH",
        "status": "PENDING",
        "created_at": "2026-08-29T10:00:00Z",
        "updated_at": None,
        "approved_by": None,
    },
    {
        "id": "app_002",
        "assessment_id": "assess_001",
        "entity_id": "C-1024",
        "action": "Accelerate collections on overdue accounts",
        "action_type": "FINANCIAL_CONTROL",
        "category": "financial",
        "confidence": 0.88,
        "expected_impact": "Reduce outstanding receivables by 15-20%",
        "risk_level": "MODERATE",
        "status": "PENDING",
        "created_at": "2026-08-29T10:01:00Z",
        "updated_at": None,
        "approved_by": None,
    },
    {
        "id": "app_003",
        "assessment_id": "assess_002",
        "entity_id": "S-0012",
        "action": "Activate backup supplier and renegotiate delivery terms",
        "action_type": "SUPPLY_CHAIN",
        "category": "operational",
        "confidence": 0.86,
        "expected_impact": "Reduce delivery delays by 60%",
        "risk_level": "HIGH",
        "status": "PENDING",
        "created_at": "2026-08-29T09:30:00Z",
        "updated_at": None,
        "approved_by": None,
    },
    {
        "id": "app_004",
        "assessment_id": "assess_003",
        "entity_id": "SYS-001",
        "action": "Isolate affected network segment and investigate data exfiltration",
        "action_type": "INCIDENT_RESPONSE",
        "category": "cyber",
        "confidence": 0.90,
        "expected_impact": "Prevent potential data breach",
        "risk_level": "CRITICAL",
        "status": "PENDING",
        "created_at": "2026-08-29T08:45:00Z",
        "updated_at": None,
        "approved_by": None,
    },
    {
        "id": "app_005",
        "assessment_id": "assess_004",
        "entity_id": "C-2048",
        "action": "Incentivize annual contract migration with 10% discount",
        "action_type": "RETENTION",
        "category": "customer",
        "confidence": 0.90,
        "expected_impact": "Reduce churn risk by 35%",
        "risk_level": "MODERATE",
        "status": "APPROVED",
        "created_at": "2026-08-28T14:00:00Z",
        "updated_at": "2026-08-28T15:30:00Z",
        "approved_by": "VP Risk",
    },
]


class ApprovalModification(BaseModel):
    modified_action: str


@router.get("/")
async def list_approvals(status: Optional[str] = None):
    """List all approval items, optionally filtered by status."""
    if status:
        return [a for a in _approvals_store if a["status"].upper() == status.upper()]
    return _approvals_store


@router.get("/{id}")
async def get_approval(id: str):
    """Get a single approval by ID."""
    for a in _approvals_store:
        if a["id"] == id:
            return a
    return {"error": "Not found"}


@router.post("/{id}/approve")
async def approve_action(id: str):
    """Approve a pending mitigation action."""
    now = datetime.now(timezone.utc).isoformat()
    for a in _approvals_store:
        if a["id"] == id:
            a["status"] = "APPROVED"
            a["updated_at"] = now
            a["approved_by"] = "Risk Officer"
            return a
    return {"error": "Not found"}


@router.post("/{id}/reject")
async def reject_action(id: str):
    """Reject a pending mitigation action."""
    now = datetime.now(timezone.utc).isoformat()
    for a in _approvals_store:
        if a["id"] == id:
            a["status"] = "REJECTED"
            a["updated_at"] = now
            return a
    return {"error": "Not found"}


@router.post("/{id}/modify")
async def modify_action(id: str, modification: ApprovalModification):
    """Modify and auto-approve a pending action."""
    now = datetime.now(timezone.utc).isoformat()
    for a in _approvals_store:
        if a["id"] == id:
            a["action"] = modification.modified_action
            a["status"] = "MODIFIED_AND_APPROVED"
            a["updated_at"] = now
            a["approved_by"] = "Risk Officer (Modified)"
            return a
    return {"error": "Not found"}


@router.get("/stats/summary")
async def approval_stats():
    """Get approval statistics."""
    total = len(_approvals_store)
    pending = sum(1 for a in _approvals_store if a["status"] == "PENDING")
    approved = sum(1 for a in _approvals_store if a["status"] == "APPROVED")
    rejected = sum(1 for a in _approvals_store if a["status"] == "REJECTED")
    return {
        "total": total,
        "pending": pending,
        "approved": approved,
        "rejected": rejected,
        "modified": total - pending - approved - rejected,
    }
