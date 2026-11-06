import datetime
import io
import csv
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.entities import Commodity, MarketPrice, Market, MSPRecord

router = APIRouter(prefix="/reports", tags=["Report Generation"])

@router.post("/generate")
def generate_report(
    payload: Dict[str, Any],
    db: Session = Depends(get_db)
):
    report_type = payload.get("report_type", "commodity_price")
    format_type = payload.get("format", "json").lower()
    commodity_id = payload.get("commodity_id")

    now = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")

    if report_type == "commodity_price":
        query = db.query(MarketPrice).order_by(MarketPrice.record_date.desc())
        if commodity_id:
            query = query.filter(MarketPrice.commodity_id == commodity_id)
        records = query.limit(50).all()

        data = []
        for r in records:
            data.append({
                "Date": r.record_date.strftime("%Y-%m-%d"),
                "Commodity": r.commodity.name,
                "Mandi": r.market.name,
                "State": r.market.state.name,
                "Modal Price (₹/Qtl)": r.modal_price,
                "Min Price": r.min_price,
                "Max Price": r.max_price,
                "Arrivals (MT)": r.arrival_quantity,
                "Status": r.data_status
            })

    elif report_type == "msp_comparison":
        records = db.query(MSPRecord).filter(MSPRecord.year.in_(["2024-25", "2025-26"])).all()
        data = []
        for r in records:
            latest = db.query(MarketPrice).filter(MarketPrice.commodity_id == r.commodity_id).order_by(MarketPrice.record_date.desc()).first()
            modal = latest.modal_price if latest else 0
            diff = round(((modal - r.msp_price) / r.msp_price) * 100.0, 1) if r.msp_price else 0
            data.append({
                "Commodity": r.commodity.name,
                "Season": r.season,
                "Year": r.year,
                "Official MSP (₹/Qtl)": r.msp_price,
                "Current Market Modal": modal,
                "Spread (%)": diff,
                "Below MSP": "YES" if modal < r.msp_price else "NO"
            })
    else:
        # Default market overview
        comms = db.query(Commodity).all()
        data = []
        for c in comms:
            latest = db.query(MarketPrice).filter(MarketPrice.commodity_id == c.id).order_by(MarketPrice.record_date.desc()).first()
            data.append({
                "Commodity": c.name,
                "Category": c.category.name,
                "Modal Price": latest.modal_price if latest else 0,
                "Unit": c.unit,
                "Perishable": "YES" if c.perishable else "NO"
            })

    if format_type == "csv":
        output = io.StringIO()
        if data:
            writer = csv.DictWriter(output, fieldnames=list(data[0].keys()))
            writer.writeheader()
            writer.writerows(data)
        
        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=agrimarket_{report_type}.csv"}
        )

    return {
        "report_type": report_type,
        "generated_at": now,
        "record_count": len(data),
        "data_sources": ["AGMARKNET", "Ministry of Agriculture CACP", "Open-Meteo"],
        "records": data
    }
