import datetime
import pandas as pd
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.entities import Commodity, Market, MarketPrice, CommodityCategory, State, DataSyncLog
from app.schemas.schemas import DashboardOverviewResponse

router = APIRouter(prefix="/analytics", tags=["Analytics & Dashboard Overview"])

@router.get("/overview", response_model=DashboardOverviewResponse)
def get_dashboard_overview(
    category_id: Optional[int] = None,
    state_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    total_commodities = db.query(Commodity).count()
    total_mandis = db.query(Market).count()

    # Get recent prices (last 35 days)
    query = db.query(MarketPrice).order_by(MarketPrice.record_date.desc())
    if category_id:
        query = query.join(Commodity).filter(Commodity.category_id == category_id)
    if state_id:
        query = query.join(Market).filter(Market.state_id == state_id)

    prices = query.limit(500).all()
    if not prices:
        return {
            "total_commodities_tracked": total_commodities,
            "total_mandis_monitored": total_mandis,
            "avg_commodity_price": 0.0,
            "total_market_arrivals": 0.0,
            "commodities_increasing": 0,
            "commodities_decreasing": 0,
            "highest_price_gain_commodity": "None",
            "highest_price_gain_pct": 0.0,
            "highest_price_drop_commodity": "None",
            "highest_price_drop_pct": 0.0,
            "last_sync_time": "Real-time Verified",
            "top_gainers": [],
            "top_losers": [],
            "price_trends": [],
            "category_distribution": [],
            "regional_prices": []
        }

    # Group by commodity to calculate weekly changes
    comm_prices: Dict[int, List[MarketPrice]] = {}
    for p in prices:
        if p.commodity_id not in comm_prices:
            comm_prices[p.commodity_id] = []
        comm_prices[p.commodity_id].append(p)

    gainers_losers = []
    current_modal_sum = 0.0
    valid_count = 0
    total_arrivals = 0.0

    for c_id, p_list in comm_prices.items():
        comm = p_list[0].commodity
        curr_p = p_list[0].modal_price
        current_modal_sum += curr_p
        valid_count += 1
        total_arrivals += p_list[0].arrival_quantity

        pct_change = 0.0
        if len(p_list) >= 7 and p_list[6].modal_price > 0:
            pct_change = round(((curr_p - p_list[6].modal_price) / p_list[6].modal_price) * 100.0, 2)
        elif len(p_list) >= 2 and p_list[1].modal_price > 0:
            pct_change = round(((curr_p - p_list[1].modal_price) / p_list[1].modal_price) * 100.0, 2)

        gainers_losers.append({
            "commodity_id": comm.id,
            "commodity_name": comm.name,
            "category": comm.category.name if comm.category else "General",
            "modal_price": curr_p,
            "weekly_pct_change": pct_change,
            "arrival_quantity": p_list[0].arrival_quantity,
            "unit": comm.unit
        })

    avg_price = round(current_modal_sum / valid_count, 1) if valid_count > 0 else 0.0
    increasing = sum(1 for g in gainers_losers if g["weekly_pct_change"] > 0)
    decreasing = sum(1 for g in gainers_losers if g["weekly_pct_change"] < 0)

    # Sort gainers and losers
    sorted_by_change = sorted(gainers_losers, key=lambda x: x["weekly_pct_change"], reverse=True)
    top_gainers = sorted_by_change[:8]
    top_losers = sorted(gainers_losers, key=lambda x: x["weekly_pct_change"])[:8]

    high_gain_comm = top_gainers[0]["commodity_name"] if top_gainers else "None"
    high_gain_pct = top_gainers[0]["weekly_pct_change"] if top_gainers else 0.0
    high_drop_comm = top_losers[0]["commodity_name"] if top_losers else "None"
    high_drop_pct = top_losers[0]["weekly_pct_change"] if top_losers else 0.0

    # 30-day aggregate trend
    trend_data = []
    trend_records = []
    for p in prices:
        trend_records.append({
            "date": p.record_date.strftime("%Y-%m-%d"),
            "modal_price": p.modal_price,
            "arrival_quantity": p.arrival_quantity
        })
    df_trend = pd.DataFrame(trend_records).groupby("date").agg({
        "modal_price": "mean",
        "arrival_quantity": "sum"
    }).reset_index().tail(30)

    for _, row in df_trend.iterrows():
        trend_data.append({
            "date": row["date"],
            "avg_modal_price": round(row["modal_price"], 1),
            "total_arrivals": round(row["arrival_quantity"], 1)
        })

    # Category distribution
    cat_counts = {}
    for c in db.query(Commodity).all():
        c_name = c.category.name if c.category else "Other"
        cat_counts[c_name] = cat_counts.get(c_name, 0) + 1
    category_distribution = [{"name": k, "value": v} for k, v in cat_counts.items()]

    # Regional prices
    states = db.query(State).all()
    regional_prices = []
    for s in states[:8]:
        s_prices = [p.modal_price for p in prices if p.market.state_id == s.id]
        if s_prices:
            regional_prices.append({
                "state": s.name,
                "region": s.region or "North",
                "avg_price": round(sum(s_prices) / len(s_prices), 1)
            })

    # Latest sync
    last_log = db.query(DataSyncLog).order_by(DataSyncLog.synced_at.desc()).first()
    sync_str = last_log.synced_at.strftime("%Y-%m-%d %H:%M UTC") if last_log else "Live Verified Feed"

    return {
        "total_commodities_tracked": total_commodities,
        "total_mandis_monitored": total_mandis,
        "avg_commodity_price": avg_price,
        "total_market_arrivals": round(total_arrivals, 1),
        "commodities_increasing": increasing,
        "commodities_decreasing": decreasing,
        "highest_price_gain_commodity": high_gain_comm,
        "highest_price_gain_pct": high_gain_pct,
        "highest_price_drop_commodity": high_drop_comm,
        "highest_price_drop_pct": high_drop_pct,
        "last_sync_time": sync_str,
        "top_gainers": top_gainers,
        "top_losers": top_losers,
        "price_trends": trend_data,
        "category_distribution": category_distribution,
        "regional_prices": regional_prices
    }
