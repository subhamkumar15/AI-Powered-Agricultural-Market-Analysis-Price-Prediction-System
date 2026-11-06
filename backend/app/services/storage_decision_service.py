from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.entities import Commodity, MarketPrice
from app.services.ml_engine import ml_engine

class StorageDecisionService:
    def analyze_scenarios(
        self,
        db: Session,
        commodity_id: int,
        quantity_quintals: float = 100.0,
        current_price: float = None,
        monthly_storage_rate_per_qtl: float = 25.0,
        monthly_holding_interest_pct: float = 0.8,
        monthly_wastage_pct: float = 1.5
    ) -> Dict[str, Any]:
        comm = db.query(Commodity).filter(Commodity.id == commodity_id).first()
        if not comm:
            raise ValueError("Commodity not found")

        # Get latest market price if not provided
        if not current_price:
            latest = (
                db.query(MarketPrice)
                .filter(MarketPrice.commodity_id == commodity_id)
                .order_by(MarketPrice.record_date.desc())
                .first()
            )
            current_price = latest.modal_price if latest else 2400.0

        immediate_revenue = round(quantity_quintals * current_price, 2)

        # Get ML forecasts for 7, 15, 30, 60 days
        scenarios = []
        best_scenario = None
        max_gain = -float("inf")

        for duration in [7, 15, 30, 60]:
            try:
                pred = ml_engine.predict_future_prices(db, commodity_id, horizon_days=duration)
                future_price = pred["predicted_modal_price"]
            except Exception:
                # Conservative fallback if ML model needs more history
                future_price = current_price * (1.0 + (0.03 * (duration / 30.0)))

            months_fraction = duration / 30.0

            # Costs
            storage_cost = round(months_fraction * monthly_storage_rate_per_qtl * quantity_quintals, 2)
            holding_cost = round(months_fraction * (monthly_holding_interest_pct / 100.0) * immediate_revenue, 2)
            
            # Perishability factor accelerates wastage
            wastage_rate = monthly_wastage_pct * (2.5 if comm.perishable else 1.0)
            wastage_qty = quantity_quintals * (months_fraction * (wastage_rate / 100.0))
            saleable_qty = max(0.0, quantity_quintals - wastage_qty)
            wastage_loss = round(wastage_qty * future_price, 2)

            future_gross = round(saleable_qty * future_price, 2)
            net_proceeds = round(future_gross - storage_cost - holding_cost, 2)
            net_gain = round(net_proceeds - immediate_revenue, 2)

            rec = "STORE & WAIT" if net_gain > 500.0 else "SELL IMMEDIATELY"

            if net_gain > max_gain:
                max_gain = net_gain
                best_scenario = (duration, rec, net_gain)

            scenarios.append({
                "duration_days": duration,
                "projected_price": round(future_price, 1),
                "gross_future_revenue": future_gross,
                "storage_cost": storage_cost,
                "holding_cost": holding_cost,
                "wastage_loss_amount": wastage_loss,
                "net_future_proceeds": net_proceeds,
                "net_gain_vs_immediate": net_gain,
                "recommendation": rec
            })

        best_duration, best_rec, best_gain = best_scenario
        if best_gain > 0:
            summary = (
                f"Holding {comm.name} for {best_duration} days offers an estimated net economic gain of "
                f"₹{best_gain:,.2f} over immediate liquidation, even after accounting for warehouse rentals, "
                f"capital holding interest, and storage shrinkage."
            )
        else:
            summary = (
                f"Immediate sale is recommended for {comm.name}. Anticipated price gains across all horizons "
                f"fail to offset cumulative warehouse rent, interest costs, and spoilage risk."
            )

        return {
            "commodity_name": comm.name,
            "quantity_quintals": quantity_quintals,
            "current_price": current_price,
            "immediate_selling_revenue": immediate_revenue,
            "scenarios": scenarios,
            "best_strategy": f"{best_rec} ({best_duration} Days)" if best_gain > 0 else "SELL IMMEDIATELY",
            "decision_summary": summary
        }

storage_decision_service = StorageDecisionService()
