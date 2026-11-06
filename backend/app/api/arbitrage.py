from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.schemas import ArbitrageOpportunityItem
from app.services.arbitrage_service import arbitrage_service

router = APIRouter(prefix="/market-opportunities", tags=["Market Arbitrage"])

@router.get("/", response_model=List[ArbitrageOpportunityItem])
def get_market_opportunities(
    commodity_id: Optional[int] = None,
    min_net_benefit: float = 0.0,
    db: Session = Depends(get_db)
):
    return arbitrage_service.find_opportunities(
        db=db,
        commodity_id=commodity_id,
        min_net_benefit=min_net_benefit
    )
