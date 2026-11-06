from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.entities import MarketPrice, Commodity, ProfitCalculation

class ProfitabilityService:
    def calculate_profit(self, db: Session, req: Dict[str, Any], user_id: int = None) -> Dict[str, Any]:
        qty = float(req.get("quantity", 100.0))
        unit = req.get("quantity_unit", "Quintal")
        crop_name = req.get("crop_name", "Wheat")
        selling_price = float(req.get("selling_price", 2450.0))

        # Unit normalization to Quintals
        if unit.lower() in ["kg", "kilogram"]:
            qty_qtl = qty / 100.0
            price_per_qtl = selling_price * 100.0
        elif unit.lower() in ["ton", "tonne", "mt"]:
            qty_qtl = qty * 10.0
            price_per_qtl = selling_price / 10.0
        else:
            qty_qtl = qty
            price_per_qtl = selling_price

        transport = float(req.get("transport_cost", 0.0))
        labor = float(req.get("labor_cost", 0.0))
        storage = float(req.get("storage_cost", 0.0))
        packaging = float(req.get("packaging_cost", 0.0))
        other = float(req.get("other_cost", 0.0))

        gross_revenue = qty_qtl * price_per_qtl
        total_expenses = transport + labor + storage + packaging + other
        net_profit = gross_revenue - total_expenses
        profit_margin = (net_profit / gross_revenue * 100.0) if gross_revenue > 0 else 0.0
        profit_per_qtl = (net_profit / qty_qtl) if qty_qtl > 0 else 0.0
        break_even_price = (total_expenses / qty_qtl) if qty_qtl > 0 else 0.0

        # Save record if user_id or valid calculation
        try:
            record = ProfitCalculation(
                user_id=user_id,
                commodity_name=crop_name,
                quantity=qty,
                quantity_unit=unit,
                selling_price=selling_price,
                transport_cost=transport,
                labor_cost=labor,
                storage_cost=storage,
                packaging_cost=packaging,
                other_cost=other,
                gross_revenue=gross_revenue,
                total_expenses=total_expenses,
                net_profit=net_profit,
                profit_margin_pct=round(profit_margin, 2),
                break_even_price=round(break_even_price, 2)
            )
            db.add(record)
            db.commit()
        except Exception:
            db.rollback()

        # Mandi comparisons for this crop
        mandi_comparisons = []
        comm = db.query(Commodity).filter(Commodity.name.ilike(f"%{crop_name}%")).first()
        if comm:
            latest_prices = (
                db.query(MarketPrice)
                .filter(MarketPrice.commodity_id == comm.id)
                .order_by(MarketPrice.record_date.desc())
                .limit(10)
                .all()
            )
            seen_m = set()
            for p in latest_prices:
                if p.market_id not in seen_m and len(mandi_comparisons) < 5:
                    seen_m.add(p.market_id)
                    m_rev = qty_qtl * p.modal_price
                    m_prof = m_rev - total_expenses
                    m_margin = (m_prof / m_rev * 100.0) if m_rev > 0 else 0.0
                    mandi_comparisons.append({
                        "mandi_name": p.market.name,
                        "state_name": p.market.state.name,
                        "modal_price": p.modal_price,
                        "estimated_revenue": round(m_rev, 2),
                        "estimated_net_profit": round(m_prof, 2),
                        "profit_margin_pct": round(m_margin, 2)
                    })

        return {
            "crop_name": crop_name,
            "quantity_quintals": round(qty_qtl, 2),
            "selling_price_per_quintal": round(price_per_qtl, 2),
            "gross_revenue": round(gross_revenue, 2),
            "total_expenses": round(total_expenses, 2),
            "net_profit": round(net_profit, 2),
            "profit_margin_pct": round(profit_margin, 2),
            "profit_per_quintal": round(profit_per_qtl, 2),
            "break_even_price": round(break_even_price, 2),
            "breakdown": {
                "transport": transport,
                "labor": labor,
                "storage": storage,
                "packaging": packaging,
                "other": other
            },
            "mandi_comparisons": mandi_comparisons
        }

profitability_service = ProfitabilityService()
