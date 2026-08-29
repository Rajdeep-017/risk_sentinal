from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, Boolean, Enum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum
from app.db.database import Base

class RiskLevelEnum(str, enum.Enum):
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"
    VERY_HIGH = "VERY_HIGH"
    CRITICAL = "CRITICAL"

class Customer(Base):
    __tablename__ = 'customers'
    id = Column(String, primary_key=True)
    name = Column(String)
    industry = Column(String)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class Transaction(Base):
    __tablename__ = 'transactions'
    id = Column(String, primary_key=True)
    customer_id = Column(String, ForeignKey('customers.id'))
    amount = Column(Float)
    status = Column(String)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    customer = relationship("Customer")

class RiskAssessment(Base):
    __tablename__ = 'risk_assessments'
    id = Column(String, primary_key=True)
    entity_id = Column(String)
    entity_type = Column(String)
    composite_score = Column(Float)
    risk_level = Column(Enum(RiskLevelEnum))
    assessed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
class ApprovalAction(Base):
    __tablename__ = 'approval_actions'
    id = Column(String, primary_key=True)
    assessment_id = Column(String, ForeignKey('risk_assessments.id'))
    action_type = Column(String)
    status = Column(String, default="PENDING")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    resolved_at = Column(DateTime, nullable=True)

class AuditLog(Base):
    __tablename__ = 'audit_logs'
    id = Column(String, primary_key=True)
    action = Column(String)
    entity_id = Column(String)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    details = Column(String)
