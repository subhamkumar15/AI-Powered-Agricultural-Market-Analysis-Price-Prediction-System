from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.services.risk_service import risk_service

router = APIRouter(prefix="/market-risks", tags=["Market Risk Intelligence"])

@router.get("/")
def get_market_risks(db: Session = Depends(get_db)):
    return risk_service.detect_market_risks(db)
