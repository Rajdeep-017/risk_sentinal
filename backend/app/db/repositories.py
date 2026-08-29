from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.models import Customer, RiskAssessment, ApprovalAction
from typing import List, Optional

class CustomerRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, customer_id: str) -> Optional[Customer]:
        result = await self.session.execute(select(Customer).filter(Customer.id == customer_id))
        return result.scalars().first()

    async def get_all(self) -> List[Customer]:
        result = await self.session.execute(select(Customer))
        return result.scalars().all()

class RiskAssessmentRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, assessment: RiskAssessment) -> RiskAssessment:
        self.session.add(assessment)
        await self.session.commit()
        await self.session.refresh(assessment)
        return assessment

    async def get_by_entity(self, entity_id: str) -> List[RiskAssessment]:
        result = await self.session.execute(
            select(RiskAssessment)
            .filter(RiskAssessment.entity_id == entity_id)
            .order_by(RiskAssessment.assessed_at.desc())
        )
        return result.scalars().all()
