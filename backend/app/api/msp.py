from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.entities import MSPRecord, MarketPrice, Commodity
from app.schemas.schemas import MSPRecordOut

router = APIRouter(prefix="/msp", tags=["MSP Intelligence"])

@router.get("/", response_model=List[MSPRecordOut])
def list_msp_records(
    year: Optional[str] = "2025-26",
    season: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(MSPRecord)
    if year:
        query = query.filter(MSPRecord.year == year)
    if season:
        query = query.filter(MSPRecord.season == season)

    records = query.all()
    results = []

    for r in records:
        latest = (
            db.query(MarketPrice)
            .filter(MarketPrice.commodity_id == r.commodity_id)
            .order_by(MarketPrice.record_date.desc())
            .first()
        )
        modal = latest.modal_price if latest else None
        diff_pct = None
        is_below = False

        if modal is not None:
            diff_pct = round(((modal - r.msp_price) / r.msp_price) * 100.0, 2)
            is_below = modal < r.msp_price

        results.append({
            "commodity_id": r.commodity_id,
            "commodity_name": r.commodity.name,
            "season": r.season,
            "year": r.year,
            "msp_price": r.msp_price,
            "current_modal_price": modal,
            "difference_pct": diff_pct,
            "is_below_msp": is_below,
            "cost_of_production": r.cost_of_production,
            "margin_percent": r.margin_percent
        })

    return results

@router.get("/below-msp", response_model=List[MSPRecordOut])
def list_commodities_below_msp(db: Session = Depends(get_db)):
    all_msp = list_msp_records(year="2025-26", db=db)
    return [m for m in all_msp if m["is_below_msp"]]
