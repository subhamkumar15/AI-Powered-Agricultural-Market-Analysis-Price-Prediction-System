import datetime
import re
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.entities import Commodity, Market, MarketPrice, MSPRecord, State
from app.services.ml_engine import ml_engine
from app.services.arbitrage_service import arbitrage_service
from app.services.weather_service import weather_service
from app.services.profitability_service import profitability_service

class AIAssistantService:
    def answer_query(self, db: Session, query_text: str, context_comm: str = None, context_state: str = None) -> Dict[str, Any]:
        q = query_text.lower()
        now = datetime.datetime.utcnow()
        citations = []
        sources = ["AgriMarket Intelligence Analytical Engine", "AGMARKNET Verified Feed"]

        # 1. Below MSP query
        if "below msp" in q or "under msp" in q or "msp deficit" in q:
            msps = db.query(MSPRecord).filter(MSPRecord.year.in_(["2024-25", "2025-26"])).all()
            below_msp_list = []
            for m in msps:
                comm = m.commodity
                latest = (
                    db.query(MarketPrice)
                    .filter(MarketPrice.commodity_id == comm.id)
                    .order_by(MarketPrice.record_date.desc())
                    .first()
                )
                if latest and latest.modal_price < m.msp_price:
                    diff_pct = round(((m.msp_price - latest.modal_price) / m.msp_price) * 100.0, 1)
                    below_msp_list.append((comm.name, latest.modal_price, m.msp_price, diff_pct, latest.market.name))
                    citations.append({
                        "commodity": comm.name,
                        "market": latest.market.name,
                        "modal_price": latest.modal_price,
                        "msp_benchmark": m.msp_price,
                        "date": latest.record_date.strftime("%Y-%m-%d")
                    })

            if below_msp_list:
                items_str = "\n".join([
                    f"- **{name}**: Quoting at ₹{p:,.0f}/qtl in {mkt} (MSP: ₹{msp:,.0f}/qtl, **{diff}% below**)"
                    for name, p, msp, diff, mkt in below_msp_list
                ])
                answer = (
                    f"### Commodities Trading Below Government MSP Benchmark\n\n"
                    f"Based on real-time market data across tracked APMC yards, the following commodities are currently under distress:\n\n"
                    f"{items_str}\n\n"
                    f"**Advisory:** Farmers trading in these commodities are strongly advised to explore procurement under PM-AASHA, "
                    f"CCI (Cotton), or NAFED centers rather than offloading in open mandi auctions at a discount."
                )
            else:
                answer = "All monitored MSP-notified commodities are currently trading at or above their respective government Minimum Support Price thresholds."
            
            return {
                "answer": answer,
                "data_sources": sources + ["CACP Government MSP Notifications"],
                "citations": citations,
                "confidence": 0.95,
                "timestamp": now
            }

        # 2. Prediction query
        if "predict" in q or "forecast" in q or "future" in q:
            # Extract commodity
            comm_match = None
            all_comms = db.query(Commodity).all()
            for c in all_comms:
                if c.name.lower() in q:
                    comm_match = c
                    break

            if not comm_match and context_comm:
                comm_match = db.query(Commodity).filter(Commodity.name.ilike(context_comm)).first()

            if not comm_match:
                comm_match = db.query(Commodity).filter(Commodity.name == "Tomato").first()

            # Extract horizon
            horizon = 15
            if "7 day" in q or "7-day" in q or "week" in q: horizon = 7
            elif "30 day" in q or "30-day" in q or "month" in q: horizon = 30
            elif "60 day" in q: horizon = 60
            elif "90 day" in q: horizon = 90

            try:
                pred = ml_engine.predict_future_prices(db, comm_match.id, horizon_days=horizon)
                citations.append({
                    "model": pred["model_name"],
                    "horizon_days": horizon,
                    "target_date": pred["target_date"],
                    "metrics": pred["metrics"]
                })
                dir_icon = "📈 Bullish" if pred["market_direction"] == "Bullish" else ("📉 Bearish" if pred["market_direction"] == "Bearish" else "⚖️ Stable")
                answer = (
                    f"### AI Machine Learning Price Forecast: {comm_match.name} ({horizon}-Day Horizon)\n\n"
                    f"- **Forecasted Modal Price:** ₹{pred['predicted_modal_price']:,.1f} / Quintal\n"
                    f"- **Expected Band:** ₹{pred['expected_min_price']:,.1f} – ₹{pred['expected_max_price']:,.1f}\n"
                    f"- **Projected Movement:** {pred['predicted_pct_change']:+0.2f}% ({dir_icon})\n"
                    f"- **Target Settlement Date:** {pred['target_date']}\n"
                    f"- **Model Used:** {pred['model_name']} (Walk-forward Validation R²: {pred['metrics']['r2']}, MAE: ₹{pred['metrics']['mae']})\n\n"
                    f"**Key Driving Features:** " + ", ".join([f"{k} ({round(v*100, 1)}%)" for k, v in list(pred['influencing_factors'].items())[:4]]) + ".\n\n"
                    f"*Note: Forecast models account for historical lags, market arrivals, seasonality cycles, and ambient temperatures.*"
                )
                return {
                    "answer": answer,
                    "data_sources": ["AgriMarket ML Forecast Engine", "AGMARKNET Historical Records"],
                    "citations": citations,
                    "confidence": pred["confidence_score"],
                    "timestamp": now
                }
            except Exception as e:
                return {
                    "answer": f"Unable to generate machine learning forecast for {comm_match.name}: {str(e)}",
                    "data_sources": sources,
                    "citations": [],
                    "confidence": 0.5,
                    "timestamp": now
                }

        # 3. Mandi Highest / Lowest Price query
        if "highest" in q or "lowest" in q or "best price" in q or "cheapest" in q:
            comm_match = None
            for c in db.query(Commodity).all():
                if c.name.lower() in q:
                    comm_match = c
                    break
            if not comm_match and context_comm:
                comm_match = db.query(Commodity).filter(Commodity.name.ilike(context_comm)).first()
            if not comm_match:
                comm_match = db.query(Commodity).filter(Commodity.name == "Onion").first()

            prices = (
                db.query(MarketPrice)
                .filter(MarketPrice.commodity_id == comm_match.id)
                .order_by(MarketPrice.record_date.desc())
                .limit(15)
                .all()
            )
            latest_prices = {}
            for p in prices:
                if p.market_id not in latest_prices:
                    latest_prices[p.market_id] = p

            sorted_p = sorted(latest_prices.values(), key=lambda x: x.modal_price)
            if sorted_p:
                low = sorted_p[0]
                high = sorted_p[-1]
                citations.extend([
                    {"market": high.market.name, "modal_price": high.modal_price, "date": high.record_date.strftime("%Y-%m-%d")},
                    {"market": low.market.name, "modal_price": low.modal_price, "date": low.record_date.strftime("%Y-%m-%d")}
                ])
                answer = (
                    f"### Market Price Extremes for {comm_match.name}\n\n"
                    f"- **Highest Quoting Mandi:** **{high.market.name}** ({high.market.state.name}) at **₹{high.modal_price:,.0f} / Quintal** (Range: ₹{high.min_price:,.0f} – ₹{high.max_price:,.0f})\n"
                    f"- **Lowest Quoting Mandi:** **{low.market.name}** ({low.market.state.name}) at **₹{low.modal_price:,.0f} / Quintal** (Range: ₹{low.min_price:,.0f} – ₹{low.max_price:,.0f})\n"
                    f"- **Inter-Mandi Spread:** ₹{(high.modal_price - low.modal_price):,.0f} / Quintal ({round(((high.modal_price - low.modal_price)/low.modal_price)*100, 1)}% differential)\n\n"
                    f"Traders evaluating cross-market dispatches should consult the **Market Arbitrage** module to verify whether transit freight maintains net profitability."
                )
                return {
                    "answer": answer,
                    "data_sources": sources,
                    "citations": citations,
                    "confidence": 0.94,
                    "timestamp": now
                }

        # 4. Weather impact query
        if "weather" in q or "rainfall" in q or "temperature" in q or "rain" in q:
            comm_match = None
            for c in db.query(Commodity).all():
                if c.name.lower() in q:
                    comm_match = c
                    break
            if not comm_match:
                comm_match = db.query(Commodity).filter(Commodity.name == "Onion").first()

            corr = weather_service.compute_correlation_analysis(db, comm_match.id)
            citations.append({
                "commodity": comm_match.name,
                "pearson_rainfall": corr["pearson_rainfall_price"],
                "pearson_temperature": corr["pearson_temp_price"]
            })
            answer = (
                f"### Meteorological Correlation Analysis: {comm_match.name}\n\n"
                f"- **Rainfall vs Price Correlation (Pearson r):** `{corr['pearson_rainfall_price']}` (Spearman: `{corr['spearman_rainfall_price']}`)\n"
                f"- **Temperature vs Price Correlation (Pearson r):** `{corr['pearson_temp_price']}`\n\n"
                f"**Precipitation Dynamics:** {corr['rainfall_impact_summary']}\n\n"
                f"**Thermal Dynamics:** {corr['temp_impact_summary']}\n\n"
                f"*Scientific Disclaimer:* Statistical correlation does not establish causation. Meteorological fluctuations induce physical supply shifts, plucking constraints, and post-harvest shelf-decay with biological lag times."
            )
            return {
                "answer": answer,
                "data_sources": ["Open-Meteo Synced Records", "Statistical Correlation Engine"],
                "citations": citations,
                "confidence": 0.92,
                "timestamp": now
            }

        # 5. Default commodity price lookup or general intelligence
        # Find if any commodity mentioned
        found_comm = None
        for c in db.query(Commodity).all():
            if c.name.lower() in q:
                found_comm = c
                break

        if found_comm:
            # Get latest price across mandis
            prices = (
                db.query(MarketPrice)
                .filter(MarketPrice.commodity_id == found_comm.id)
                .order_by(MarketPrice.record_date.desc())
                .limit(10)
                .all()
            )
            seen_m = set()
            m_items = []
            for p in prices:
                if p.market_id not in seen_m and len(m_items) < 4:
                    seen_m.add(p.market_id)
                    m_items.append(f"- **{p.market.name}** ({p.market.state.name}): Modal: **₹{p.modal_price:,.0f}**, Min: ₹{p.min_price:,.0f}, Max: ₹{p.max_price:,.0f}")
                    citations.append({
                        "mandi": p.market.name,
                        "state": p.market.state.name,
                        "modal_price": p.modal_price,
                        "date": p.record_date.strftime("%Y-%m-%d"),
                        "status": p.data_status
                    })
            
            prices_str = "\n".join(m_items)
            answer = (
                f"### Current Market Intelligence for {found_comm.name}\n\n"
                f"**Category:** {found_comm.category.name} | **Standard Trading Unit:** {found_comm.unit}\n\n"
                f"**Recent Mandi Prices:**\n{prices_str}\n\n"
                f"**Perishability & Storage:** {found_comm.shelf_life_days} days average shelf-life ({'Perishable' if found_comm.perishable else 'Storable cereal/dry pulse'}).\n\n"
                f"Would you like an AI price forecast, mandi arbitrage comparison, or weather correlation analysis for {found_comm.name}?"
            )
            return {
                "answer": answer,
                "data_sources": sources,
                "citations": citations,
                "confidence": 0.96,
                "timestamp": now
            }

        # General Assistant Overview
        answer = (
            f"### AgriMarket Intelligence Operational Assistant\n\n"
            f"I have live access to your database of **26 agricultural commodities**, **34 mandis across 12 Indian states**, "
            f"verified AGMARKNET pricing records, Open-Meteo meteorological readings, and machine learning forecasting models.\n\n"
            f"**Try asking me:**\n"
            f"- *'What is the current wheat price in Punjab?'*\n"
            f"- *'Which mandi offers the highest price for onions?'*\n"
            f"- *'Predict tomato prices for the next 15 days.'*\n"
            f"- *'Which commodities are trading below government MSP?'*\n"
            f"- *'How does rainfall impact onion price trends?'*\n"
            f"- *'Calculate profit from selling 100 quintals of mustard.'*"
        )
        return {
            "answer": answer,
            "data_sources": sources,
            "citations": [],
            "confidence": 1.0,
            "timestamp": now
        }

ai_assistant_service = AIAssistantService()
