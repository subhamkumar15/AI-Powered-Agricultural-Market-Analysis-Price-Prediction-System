from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.entities import MarketAlert, User, Commodity, Market
from app.schemas.schemas import AlertCreate, AlertOut
from app.core.security import get_current_user

router = APIRouter(prefix="/alerts", tags=["Market Alerts"])

@router.get("/", response_model=List[AlertOut])
def list_user_alerts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    alerts = db.query(MarketAlert).filter(MarketAlert.user_id == current_user.id).all()
    results = []
    for a in alerts:
        comm_name = a.commodity_id and db.query(Commodity).filter(Commodity.id == a.commodity_id).first()
        mkt_name = a.market_id and db.query(Market).filter(Market.id == a.market_id).first()
        results.append({
            "id": a.id,
            "commodity_name": comm_name.name if comm_name else "All Commodities",
            "market_name": mkt_name.name if mkt_name else "All Mandis",
            "condition_type": a.condition_type,
            "threshold_value": a.threshold_value,
            "is_active": a.is_active,
            "last_triggered_at": a.last_triggered_at,
            "trigger_message": a.trigger_message
        })
    return results

@router.post("/", response_model=AlertOut)
def create_user_alert(
    data: AlertCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    alert = MarketAlert(
        user_id=current_user.id,
        commodity_id=data.commodity_id,
        market_id=data.market_id,
        condition_type=data.condition_type,
        threshold_value=data.threshold_value,
        notification_channel=data.notification_channel,
        is_active=True
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)

    comm_name = alert.commodity_id and db.query(Commodity).filter(Commodity.id == alert.commodity_id).first()
    mkt_name = alert.market_id and db.query(Market).filter(Market.id == alert.market_id).first()

    return {
        "id": alert.id,
        "commodity_name": comm_name.name if comm_name else "All Commodities",
        "market_name": mkt_name.name if mkt_name else "All Mandis",
        "condition_type": alert.condition_type,
        "threshold_value": alert.threshold_value,
        "is_active": alert.is_active,
        "last_triggered_at": alert.last_triggered_at,
        "trigger_message": alert.trigger_message
    }

@router.put("/{id}/toggle")
def toggle_alert(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    alert = db.query(MarketAlert).filter(
        MarketAlert.id == id,
        MarketAlert.user_id == current_user.id
    ).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.is_active = not alert.is_active
    db.commit()
    return {"id": alert.id, "is_active": alert.is_active}

@router.delete("/{id}")
def delete_alert(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    alert = db.query(MarketAlert).filter(
        MarketAlert.id == id,
        MarketAlert.user_id == current_user.id
    ).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    db.delete(alert)
    db.commit()
    return {"message": "Alert deleted successfully"}
