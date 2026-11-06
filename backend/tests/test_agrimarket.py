import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "AgriMarket" in data["service"]

def test_dashboard_overview():
    res = client.get("/api/analytics/overview")
    assert res.status_code == 200
    data = res.json()
    assert data["total_commodities_tracked"] >= 20
    assert data["total_mandis_monitored"] >= 25
    assert data["avg_commodity_price"] > 0
    assert len(data["top_gainers"]) > 0
    assert len(data["price_trends"]) > 0

def test_commodities_directory():
    res = client.get("/api/commodities/")
    assert res.status_code == 200
    comms = res.json()
    assert len(comms) >= 20
    # Verify Wheat details
    wheat = next((c for c in comms if c["name"] == "Wheat"), None)
    assert wheat is not None
    assert wheat["current_modal_price"] is not None
    assert wheat["current_modal_price"] > 1500

def test_commodity_detail():
    res = client.get("/api/commodities/wheat")
    assert res.status_code == 200
    c = res.json()
    assert c["name"] == "Wheat"
    assert c["category_name"] == "Grains"

def test_market_prices():
    res = client.get("/api/market-prices/?limit=20")
    assert res.status_code == 200
    prices = res.json()
    assert len(prices) == 20
    first = prices[0]
    assert first["modal_price"] > 0
    assert first["data_status"] in ["LIVE", "DELAYED", "HISTORICAL", "SAMPLE"]

def test_price_history_and_moving_averages():
    # Wheat commodity ID is 1
    res = client.get("/api/market-prices/history?commodity_id=1&days=30")
    assert res.status_code == 200
    data = res.json()
    assert len(data["history"]) > 0
    assert "ma_7" in data["history"][-1]
    assert data["stats"]["volatility"] >= 0

def test_ml_prediction_engine():
    payload = {"commodity_id": 1, "horizon_days": 30}
    res = client.post("/api/predictions/generate", json=payload)
    assert res.status_code == 200
    pred = res.json()
    assert pred["predicted_modal_price"] > 0
    assert pred["expected_min_price"] <= pred["predicted_modal_price"]
    assert pred["expected_max_price"] >= pred["predicted_modal_price"]
    assert pred["market_direction"] in ["Bullish", "Bearish", "Stable"]
    assert pred["confidence_score"] > 0.5
    assert len(pred["forecast_series"]) == 30

def test_market_arbitrage():
    res = client.get("/api/market-opportunities/")
    assert res.status_code == 200
    opps = res.json()
    assert len(opps) > 0
    first = opps[0]
    assert first["net_benefit_per_qtl"] > 0
    assert first["estimated_distance_km"] > 0

def test_farmer_profit_calculator():
    payload = {
        "crop_name": "Wheat",
        "quantity": 100,
        "quantity_unit": "Quintal",
        "selling_price": 2450,
        "transport_cost": 4000,
        "labor_cost": 2500,
        "storage_cost": 1500,
        "packaging_cost": 1000,
        "other_cost": 500
    }
    res = client.post("/api/calculator/profit", json=payload)
    assert res.status_code == 200
    calc = res.json()
    assert calc["gross_revenue"] == 245000.0
    assert calc["total_expenses"] == 9500.0
    assert calc["net_profit"] == 235500.0
    assert calc["profit_margin_pct"] > 90.0

def test_storage_decision_support():
    payload = {
        "commodity_id": 1,
        "quantity_quintals": 100,
        "monthly_storage_rate_per_qtl": 25.0
    }
    res = client.post("/api/calculator/storage", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert len(data["scenarios"]) == 4
    assert data["immediate_selling_revenue"] > 0
    assert data["best_strategy"] is not None

def test_msp_intelligence():
    res = client.get("/api/msp/?year=2025-26")
    assert res.status_code == 200
    msps = res.json()
    assert len(msps) > 10
    wheat_msp = next((m for m in msps if m["commodity_name"] == "Wheat"), None)
    assert wheat_msp is not None
    assert wheat_msp["msp_price"] == 2425.0

def test_ai_market_assistant():
    payload = {"question": "What is the current wheat price in Punjab?"}
    res = client.post("/api/assistant/chat", json=payload)
    assert res.status_code == 200
    reply = res.json()
    assert "Wheat" in reply["answer"]
    assert len(reply["data_sources"]) > 0
    assert reply["confidence"] > 0.8
