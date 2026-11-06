from typing import List, Optional
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.entities import MarketPrice, CropCalendar, Commodity
from app.schemas.schemas import CropCalendarOut

router = APIRouter(prefix="/supply-demand", tags=["Supply & Demand Intelligence"])

@router.get("/overview")
def get_supply_demand_overview(
    commodity_id: Optional[int] = None,
    days: int = 30,
    db: Session = Depends(get_db)
):
    query = db.query(MarketPrice)
    if commodity_id:
        query = query.filter(MarketPrice.commodity_id == commodity_id)

    prices = query.order_by(MarketPrice.record_date.desc()).all()
    if not prices:
        return {"arrivals_trend": [], "supply_status": "Balanced", "detected_anomalies": []}

    records = []
    for p in prices:
        records.append({
            "date": p.record_date.strftime("%Y-%m-%d"),
            "arrival_quantity": p.arrival_quantity,
            "modal_price": p.modal_price
        })

    df = pd.DataFrame(records).groupby("date").agg({
        "arrival_quantity": "sum",
        "modal_price": "mean"
    }).reset_index()

    df = df.tail(days)
    trend = df.to_dict(orient="records")

    # Detect sudden arrival anomalies (> 40% deviation from 14-day rolling mean)
    recent_arr = df["arrival_quantity"]
    mean_arr = float(recent_arr.mean()) if len(recent_arr) > 0 else 100.0
    latest_arr = float(recent_arr.iloc[-1]) if len(recent_arr) > 0 else 100.0

    arr_diff_pct = round(((latest_arr - mean_arr) / mean_arr) * 100.0, 1)

    if arr_diff_pct >= 40.0:
        status = "Surplus Glut (High Arrivals)"
    elif arr_diff_pct <= -35.0:
        status = "Supply Squeeze (Arrival Deficit)"
    else:
        status = "Market Balance"

    return {
        "arrivals_trend": trend,
        "average_daily_arrival_mt": round(mean_arr, 1),
        "latest_daily_arrival_mt": round(latest_arr, 1),
        "arrival_deviation_pct": arr_diff_pct,
        "supply_status": status,
        "data_coverage": "Tracked APMC Mandis (Metric Tonnes)"
    }

@router.get("/crop-calendar", response_model=List[CropCalendarOut])
def get_crop_calendars(
    commodity_id: Optional[int] = None,
    state_name: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(CropCalendar)
    if commodity_id:
        query = query.filter(CropCalendar.commodity_id == commodity_id)
    if state_name:
        query = query.filter(CropCalendar.state_name.ilike(f"%{state_name}%"))

    calendars = query.all()
    results = []
    for c in calendars:
        results.append({
            "id": c.id,
            "commodity_name": c.commodity.name,
            "state_name": c.state_name,
            "season": c.season,
            "sowing_period": f"{c.sowing_start_month} – {c.sowing_end_month}",
            "harvesting_period": f"{c.harvesting_start_month} – {c.harvesting_end_month}",
            "peak_arrival_period": c.peak_arrival_month,
            "notes": c.notes
        })
    return results
