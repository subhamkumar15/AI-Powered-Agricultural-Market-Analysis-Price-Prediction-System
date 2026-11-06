import datetime
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.entities import MarketPrice, WeatherData, MSPRecord, Commodity, Market

class RiskService:
    def detect_market_risks(self, db: Session) -> List[Dict[str, Any]]:
        risks = []
        now = datetime.datetime.utcnow()

        # 1. Commodities trading below MSP
        msps = db.query(MSPRecord).filter(MSPRecord.year.in_(["2024-25", "2025-26"])).all()
        msp_map = {m.commodity_id: m for m in msps}

        # Latest prices per commodity
        all_commodities = db.query(Commodity).all()
        for comm in all_commodities:
            prices = (
                db.query(MarketPrice)
                .filter(MarketPrice.commodity_id == comm.id)
                .order_by(MarketPrice.record_date.desc())
                .limit(10)
                .all()
            )
            if not prices:
                continue

            latest_p = prices[0]
            
            # MSP Deficit check
            if comm.id in msp_map:
                msp_obj = msp_map[comm.id]
                if latest_p.modal_price < msp_obj.msp_price:
                    pct_below = round(((msp_obj.msp_price - latest_p.modal_price) / msp_obj.msp_price) * 100.0, 1)
                    risks.append({
                        "id": len(risks) + 1,
                        "risk_category": "Distress Selling Below MSP",
                        "severity": "High" if pct_below >= 10.0 else "Medium",
                        "commodity_name": comm.name,
                        "market_name": latest_p.market.name,
                        "description": (
                            f"{comm.name} is quoting at ₹{latest_p.modal_price:,.0f}/qtl in {latest_p.market.name}, "
                            f"which is {pct_below}% below the Central Government MSP benchmark (₹{msp_obj.msp_price:,.0f}/qtl)."
                        ),
                        "supporting_data": {
                            "modal_price": latest_p.modal_price,
                            "msp_price": msp_obj.msp_price,
                            "deficit_pct": pct_below
                        },
                        "recommended_action": "Farmers should access NAFED / FCI procurement centers or hold produce via e-NWR warehouse pledge financing.",
                        "detected_at": now.strftime("%Y-%m-%d %H:%M")
                    })

            # Volatility & sudden drop check
            if len(prices) >= 5:
                modal_vals = [p.modal_price for p in prices]
                pct_7d = ((modal_vals[0] - modal_vals[-1]) / modal_vals[-1]) * 100.0
                if pct_7d <= -8.0:
                    risks.append({
                        "id": len(risks) + 1,
                        "risk_category": "Sudden Price Crash",
                        "severity": "High" if pct_7d <= -15.0 else "Medium",
                        "commodity_name": comm.name,
                        "market_name": latest_p.market.name,
                        "description": f"Sharp decline of {abs(round(pct_7d, 1))}% observed over the past 7 trading days.",
                        "supporting_data": {"weekly_pct_change": round(pct_7d, 1), "latest_price": modal_vals[0]},
                        "recommended_action": "Avoid panic dumping; verify if arrival surge is temporary harvest glut.",
                        "detected_at": now.strftime("%Y-%m-%d %H:%M")
                    })

        # 2. Weather anomalies in mandis
        weather_records = (
            db.query(WeatherData)
            .order_by(WeatherData.record_date.desc())
            .limit(30)
            .all()
        )
        seen_m_weather = set()
        for w in weather_records:
            if w.market_id in seen_m_weather:
                continue
            seen_m_weather.add(w.market_id)

            if w.heavy_rain_detected:
                risks.append({
                    "id": len(risks) + 1,
                    "risk_category": "Weather Hazard (Heavy Rain)",
                    "severity": "Medium",
                    "commodity_name": "Vegetables & Pulses",
                    "market_name": w.market.name,
                    "description": f"Severe rainfall ({w.rainfall_mm} mm) recorded in {w.market.district}. Transit disruptions anticipated.",
                    "supporting_data": {"rainfall_mm": w.rainfall_mm, "humidity": w.humidity_pct},
                    "recommended_action": "Ensure covered tarp transit; anticipate mandi arrival dampness discounts.",
                    "detected_at": now.strftime("%Y-%m-%d %H:%M")
                })
            elif w.heatwave_detected:
                risks.append({
                    "id": len(risks) + 1,
                    "risk_category": "Extreme Heatwave",
                    "severity": "High",
                    "commodity_name": "Perishable Horticultural Crops",
                    "market_name": w.market.name,
                    "description": f"Maximum ambient temperature touched {w.temperature_max}°C. Rapid degradation risk for greens and tomatoes.",
                    "supporting_data": {"temperature_max": w.temperature_max},
                    "recommended_action": "Expedite early morning auctioning and utilize refrigerated transit van cold-chains.",
                    "detected_at": now.strftime("%Y-%m-%d %H:%M")
                })

        return risks[:12]

risk_service = RiskService()
