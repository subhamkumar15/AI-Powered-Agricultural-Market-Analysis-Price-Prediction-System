from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.entities import Commodity, CommodityCategory, MarketPrice, MSPRecord, UserWatchlist, User
from app.schemas.schemas import CommodityOut, CategoryOut, CommodityBase
from app.core.security import get_current_user, require_admin

router = APIRouter(prefix="/commodities", tags=["Commodities"])

@router.get("/categories", response_model=List[CategoryOut])
def list_categories(db: Session = Depends(get_db)):
    return db.query(CommodityCategory).all()

@router.get("/", response_model=List[CommodityOut])
def list_commodities(
    category_id: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Commodity)
    if category_id:
        query = query.filter(Commodity.category_id == category_id)
    if search:
        query = query.filter(Commodity.name.ilike(f"%{search}%"))

    commodities = query.all()
    results = []

    # Pre-fetch MSPs
    msps = {m.commodity_id: m.msp_price for m in db.query(MSPRecord).filter(MSPRecord.year.in_(["2024-25", "2025-26"])).all()}

    for c in commodities:
        # Get latest 30 days of prices to compute stats
        prices = (
            db.query(MarketPrice)
            .filter(MarketPrice.commodity_id == c.id)
            .order_by(MarketPrice.record_date.desc())
            .limit(30)
            .all()
        )

        modal = prices[0].modal_price if prices else None
        min_p = min([p.min_price for p in prices[:7]]) if prices else None
        max_p = max([p.max_price for p in prices[:7]]) if prices else None

        daily_change = None
        weekly_change = None
        monthly_change = None

        if len(prices) >= 2 and prices[1].modal_price > 0:
            daily_change = round(((prices[0].modal_price - prices[1].modal_price) / prices[1].modal_price) * 100.0, 2)
        if len(prices) >= 7 and prices[6].modal_price > 0:
            weekly_change = round(((prices[0].modal_price - prices[6].modal_price) / prices[6].modal_price) * 100.0, 2)
        if len(prices) >= 28 and prices[-1].modal_price > 0:
            monthly_change = round(((prices[0].modal_price - prices[-1].modal_price) / prices[-1].modal_price) * 100.0, 2)

        results.append({
            "id": c.id,
            "name": c.name,
            "slug": c.slug,
            "category_id": c.category_id,
            "category_name": c.category.name if c.category else "General",
            "description": c.description,
            "unit": c.unit,
            "msp_applicable": c.msp_applicable,
            "perishable": c.perishable,
            "shelf_life_days": c.shelf_life_days,
            "image_url": c.image_url,
            "current_modal_price": modal,
            "min_price": min_p,
            "max_price": max_p,
            "daily_pct_change": daily_change,
            "weekly_pct_change": weekly_change,
            "monthly_pct_change": monthly_change,
            "msp_price": msps.get(c.id),
            "is_in_watchlist": False
        })

    return results

@router.get("/{id_or_slug}", response_model=CommodityOut)
def get_commodity_detail(id_or_slug: str, db: Session = Depends(get_db)):
    if id_or_slug.isdigit():
        c = db.query(Commodity).filter(Commodity.id == int(id_or_slug)).first()
    else:
        c = db.query(Commodity).filter(Commodity.slug == id_or_slug).first()

    if not c:
        raise HTTPException(status_code=404, detail="Commodity not found")

    prices = (
        db.query(MarketPrice)
        .filter(MarketPrice.commodity_id == c.id)
        .order_by(MarketPrice.record_date.desc())
        .limit(30)
        .all()
    )

    modal = prices[0].modal_price if prices else None
    min_p = min([p.min_price for p in prices[:7]]) if prices else None
    max_p = max([p.max_price for p in prices[:7]]) if prices else None

    daily_change = None
    weekly_change = None
    monthly_change = None
    if len(prices) >= 2 and prices[1].modal_price > 0:
        daily_change = round(((prices[0].modal_price - prices[1].modal_price) / prices[1].modal_price) * 100.0, 2)
    if len(prices) >= 7 and prices[6].modal_price > 0:
        weekly_change = round(((prices[0].modal_price - prices[6].modal_price) / prices[6].modal_price) * 100.0, 2)
    if len(prices) >= 28 and prices[-1].modal_price > 0:
        monthly_change = round(((prices[0].modal_price - prices[-1].modal_price) / prices[-1].modal_price) * 100.0, 2)

    msp = db.query(MSPRecord).filter(MSPRecord.commodity_id == c.id).order_by(MSPRecord.id.desc()).first()

    return {
        "id": c.id,
        "name": c.name,
        "slug": c.slug,
        "category_id": c.category_id,
        "category_name": c.category.name if c.category else "General",
        "description": c.description,
        "unit": c.unit,
        "msp_applicable": c.msp_applicable,
        "perishable": c.perishable,
        "shelf_life_days": c.shelf_life_days,
        "image_url": c.image_url,
        "current_modal_price": modal,
        "min_price": min_p,
        "max_price": max_p,
        "daily_pct_change": daily_change,
        "weekly_pct_change": weekly_change,
        "monthly_pct_change": monthly_change,
        "msp_price": msp.msp_price if msp else None,
        "is_in_watchlist": False
    }

@router.post("/", response_model=CommodityOut)
def create_commodity(
    data: CommodityBase,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    existing = db.query(Commodity).filter(Commodity.slug == data.slug).first()
    if existing:
        raise HTTPException(status_code=400, detail="Commodity with this slug already exists")

    c = Commodity(
        name=data.name,
        slug=data.slug,
        category_id=data.category_id,
        description=data.description,
        unit=data.unit,
        msp_applicable=data.msp_applicable,
        perishable=data.perishable,
        shelf_life_days=data.shelf_life_days,
        image_url=data.image_url
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return c

@router.put("/{id}", response_model=CommodityOut)
def update_commodity(
    id: int,
    data: CommodityBase,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    c = db.query(Commodity).filter(Commodity.id == id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Commodity not found")

    c.name = data.name
    c.slug = data.slug
    c.category_id = data.category_id
    c.description = data.description
    c.unit = data.unit
    c.msp_applicable = data.msp_applicable
    c.perishable = data.perishable
    c.shelf_life_days = data.shelf_life_days
    if data.image_url:
        c.image_url = data.image_url

    db.commit()
    db.refresh(c)
    return c

@router.delete("/{id}")
def delete_commodity(
    id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    c = db.query(Commodity).filter(Commodity.id == id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Commodity not found")
    db.delete(c)
    db.commit()
    return {"message": f"Commodity {c.name} deleted successfully"}

@router.post("/{id}/watchlist")
def toggle_watchlist(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    c = db.query(Commodity).filter(Commodity.id == id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Commodity not found")

    existing = db.query(UserWatchlist).filter(
        UserWatchlist.user_id == current_user.id,
        UserWatchlist.commodity_id == id
    ).first()

    if existing:
        db.delete(existing)
        db.commit()
        return {"status": "removed", "commodity_id": id}
    else:
        item = UserWatchlist(user_id=current_user.id, commodity_id=id)
        db.add(item)
        db.commit()
        return {"status": "added", "commodity_id": id}

@router.get("/watchlist/me", response_model=List[CommodityOut])
def get_user_watchlist(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    items = db.query(UserWatchlist).filter(UserWatchlist.user_id == current_user.id).all()
    comm_ids = [it.commodity_id for it in items]
    comms = db.query(Commodity).filter(Commodity.id.in_(comm_ids)).all()
    
    results = []
    for c in comms:
        latest = db.query(MarketPrice).filter(MarketPrice.commodity_id == c.id).order_by(MarketPrice.record_date.desc()).first()
        results.append({
            "id": c.id,
            "name": c.name,
            "slug": c.slug,
            "category_id": c.category_id,
            "category_name": c.category.name if c.category else "General",
            "description": c.description,
            "unit": c.unit,
            "msp_applicable": c.msp_applicable,
            "perishable": c.perishable,
            "shelf_life_days": c.shelf_life_days,
            "image_url": c.image_url,
            "current_modal_price": latest.modal_price if latest else 0.0,
            "min_price": latest.min_price if latest else 0.0,
            "max_price": latest.max_price if latest else 0.0,
            "daily_pct_change": 0.0,
            "is_in_watchlist": True
        })
    return results
