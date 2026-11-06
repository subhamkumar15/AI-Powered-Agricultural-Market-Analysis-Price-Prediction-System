from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.entities import Market, State, MarketPrice
from app.schemas.schemas import MarketOut, StateOut

router = APIRouter(prefix="/markets", tags=["Markets & Mandis"])

@router.get("/states", response_model=List[StateOut])
def list_states(db: Session = Depends(get_db)):
    return db.query(State).all()

@router.get("/", response_model=List[MarketOut])
def list_markets(
    state_id: Optional[int] = None,
    district: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Market)
    if state_id:
        query = query.filter(Market.state_id == state_id)
    if district:
        query = query.filter(Market.district.ilike(f"%{district}%"))
    if search:
        query = query.filter(Market.name.ilike(f"%{search}%"))

    markets = query.all()
    results = []
    for m in markets:
        results.append({
            "id": m.id,
            "name": m.name,
            "state_id": m.state_id,
            "state_name": m.state.name if m.state else "India",
            "district": m.district,
            "latitude": m.latitude,
            "longitude": m.longitude,
            "market_type": m.market_type
        })
    return results

@router.get("/{id}")
def get_market_detail(id: int, db: Session = Depends(get_db)):
    m = db.query(Market).filter(Market.id == id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Market not found")

    # Fetch latest prices in this mandi
    prices = (
        db.query(MarketPrice)
        .filter(MarketPrice.market_id == m.id)
        .order_by(MarketPrice.record_date.desc())
        .limit(20)
        .all()
    )
    price_items = []
    seen_c = set()
    for p in prices:
        if p.commodity_id not in seen_c:
            seen_c.add(p.commodity_id)
            price_items.append({
                "commodity_id": p.commodity_id,
                "commodity_name": p.commodity.name,
                "modal_price": p.modal_price,
                "min_price": p.min_price,
                "max_price": p.max_price,
                "arrival_quantity": p.arrival_quantity,
                "date": p.record_date.strftime("%Y-%m-%d"),
                "status": p.data_status
            })

    return {
        "id": m.id,
        "name": m.name,
        "state_name": m.state.name,
        "district": m.district,
        "latitude": m.latitude,
        "longitude": m.longitude,
        "market_type": m.market_type,
        "commodities_traded": price_items
    }
