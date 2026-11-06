from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.entities import Market, Commodity
from app.schemas.schemas import WeatherCurrentOut, WeatherCorrelationResponse
from app.services.weather_service import weather_service

router = APIRouter(prefix="/weather", tags=["Weather Intelligence"])

@router.get("/current")
async def get_current_weather(market_id: int, db: Session = Depends(get_db)):
    mkt = db.query(Market).filter(Market.id == market_id).first()
    if not mkt:
        raise HTTPException(status_code=404, detail="Market not found")

    # Try live Open-Meteo first
    live_data = await weather_service.fetch_live_open_meteo(mkt.latitude, mkt.longitude)
    if live_data:
        live_data["market_name"] = mkt.name
        live_data["state_name"] = mkt.state.name
        live_data["latitude"] = mkt.latitude
        live_data["longitude"] = mkt.longitude
        return live_data

    # Fallback to database record
    return weather_service.get_weather_for_market(db, market_id)

@router.get("/correlation", response_model=WeatherCorrelationResponse)
def get_weather_correlation(commodity_id: int, db: Session = Depends(get_db)):
    try:
        return weather_service.compute_correlation_analysis(db, commodity_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
