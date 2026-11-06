import math
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.entities import MarketPrice, Market, Commodity

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0 # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 1)

class ArbitrageService:
    def find_opportunities(self, db: Session, commodity_id: int = None, min_net_benefit: float = 0.0) -> List[Dict[str, Any]]:
        # Fetch latest prices for each commodity in each market
        query = db.query(MarketPrice).order_by(MarketPrice.record_date.desc())
        if commodity_id:
            query = query.filter(MarketPrice.commodity_id == commodity_id)

        all_prices = query.all()
        
        # Deduplicate to latest price per (commodity_id, market_id)
        latest_prices = {}
        for p in all_prices:
            key = (p.commodity_id, p.market_id)
            if key not in latest_prices:
                latest_prices[key] = p

        # Group by commodity
        by_commodity: Dict[int, List[MarketPrice]] = {}
        for (c_id, m_id), price_obj in latest_prices.items():
            if c_id not in by_commodity:
                by_commodity[c_id] = []
            by_commodity[c_id].append(price_obj)

        opportunities = []

        for c_id, prices in by_commodity.items():
            if len(prices) < 2:
                continue

            comm = prices[0].commodity
            # Compare all pairs (source: lower price, dest: higher price)
            sorted_prices = sorted(prices, key=lambda x: x.modal_price)
            lowest = sorted_prices[0]
            
            for dest in sorted_prices[1:]:
                price_diff = dest.modal_price - lowest.modal_price
                if price_diff <= 0:
                    continue

                m_src = lowest.market
                m_dest = dest.market
                if m_src.id == m_dest.id:
                    continue

                dist_km = haversine_distance_km(m_src.latitude, m_src.longitude, m_dest.latitude, m_dest.longitude)
                
                # Freight cost calculation:
                # Truck freight rate: ~₹0.38 per quintal per km for distance > 50km
                # Loading / unloading / labor: ₹25 / quintal
                # Mandi fee & cess: 1.5% of destination price
                freight_per_qtl = round(dist_km * 0.38 + 25.0 + (dest.modal_price * 0.015), 1)
                net_benefit_per_qtl = round(price_diff - freight_per_qtl, 1)

                if net_benefit_per_qtl < min_net_benefit:
                    continue

                if net_benefit_per_qtl >= 250:
                    rating = "Excellent"
                elif net_benefit_per_qtl >= 100:
                    rating = "Moderate"
                elif net_benefit_per_qtl >= 20:
                    rating = "Marginal"
                else:
                    rating = "Unfavorable"

                opportunities.append({
                    "commodity_name": comm.name,
                    "source_mandi": m_src.name,
                    "source_state": m_src.state.name,
                    "source_price": lowest.modal_price,
                    "dest_mandi": m_dest.name,
                    "dest_state": m_dest.state.name,
                    "dest_price": dest.modal_price,
                    "price_difference": round(price_diff, 1),
                    "estimated_distance_km": dist_km,
                    "estimated_freight_cost_per_qtl": freight_per_qtl,
                    "net_benefit_per_qtl": net_benefit_per_qtl,
                    "total_net_benefit_100qtl": round(net_benefit_per_qtl * 100.0, 1),
                    "freshness": lowest.data_status,
                    "opportunity_rating": rating
                })

        # Sort by highest net benefit
        opportunities.sort(key=lambda x: x["net_benefit_per_qtl"], reverse=True)
        return opportunities[:25]

arbitrage_service = ArbitrageService()
