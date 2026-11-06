from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.entities import ProfitCalculation, User
from app.schemas.schemas import (
    ProfitCalculationRequest,
    ProfitCalculationResponse,
    StorageAnalysisRequest,
    StorageDecisionResponse
)
from app.services.profitability_service import profitability_service
from app.services.storage_decision_service import storage_decision_service
from app.core.security import get_current_user

router = APIRouter(prefix="/calculator", tags=["Financial Calculators"])

@router.post("/profit", response_model=ProfitCalculationResponse)
def calculate_farmer_profit(
    req: ProfitCalculationRequest,
    db: Session = Depends(get_db)
):
    return profitability_service.calculate_profit(db, req.dict())

@router.post("/storage", response_model=StorageDecisionResponse)
def analyze_storage_decisions(
    req: StorageAnalysisRequest,
    db: Session = Depends(get_db)
):
    try:
        return storage_decision_service.analyze_scenarios(
            db=db,
            commodity_id=req.commodity_id,
            quantity_quintals=req.quantity_quintals,
            current_price=req.current_price,
            monthly_storage_rate_per_qtl=req.monthly_storage_rate_per_qtl,
            monthly_holding_interest_pct=req.monthly_holding_interest_pct,
            monthly_wastage_pct=req.monthly_wastage_pct
        )
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))

@router.get("/history")
def get_calculation_history(db: Session = Depends(get_db)):
    calcs = db.query(ProfitCalculation).order_by(ProfitCalculation.created_at.desc()).limit(15).all()
    results = []
    for c in calcs:
        results.append({
            "id": c.id,
            "crop_name": c.commodity_name,
            "quantity": c.quantity,
            "quantity_unit": c.quantity_unit,
            "selling_price": c.selling_price,
            "gross_revenue": c.gross_revenue,
            "total_expenses": c.total_expenses,
            "net_profit": c.net_profit,
            "profit_margin_pct": c.profit_margin_pct,
            "break_even_price": c.break_even_price,
            "created_at": c.created_at.strftime("%Y-%m-%d %H:%M")
        })
    return results
