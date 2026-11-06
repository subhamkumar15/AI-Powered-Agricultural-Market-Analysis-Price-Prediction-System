import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey, Enum as SQLEnum, JSON, Index
)
from sqlalchemy.orm import relationship
from app.database.session import Base

class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)  # "farmer", "trader", "analyst", "admin"
    description = Column(String(255), nullable=True)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), default=1)
    is_active = Column(Boolean, default=True)
    preferred_state = Column(String(100), nullable=True)
    preferred_mandi = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    role = relationship("Role")
    watchlists = relationship("UserWatchlist", back_populates="user", cascade="all, delete-orphan")
    alerts = relationship("MarketAlert", back_populates="user", cascade="all, delete-orphan")

class CommodityCategory(Base):
    __tablename__ = "commodity_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)  # "Grains", "Pulses", "Vegetables", "Fruits", "Oilseeds and Cash Crops"
    description = Column(Text, nullable=True)
    icon = Column(String(50), nullable=True)

    commodities = relationship("Commodity", back_populates="category")

class Commodity(Base):
    __tablename__ = "commodities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)  # Wheat, Rice, Chana, Onion, Tomato, Mustard, etc.
    slug = Column(String(100), unique=True, index=True, nullable=False)
    category_id = Column(Integer, ForeignKey("commodity_categories.id"), nullable=False)
    description = Column(Text, nullable=True)
    unit = Column(String(20), default="₹/Quintal")  # ₹/Quintal, ₹/Kg, ₹/Ton
    msp_applicable = Column(Boolean, default=False)
    perishable = Column(Boolean, default=False)
    shelf_life_days = Column(Integer, default=180)  # Average storage capacity
    image_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    category = relationship("CommodityCategory", back_populates="commodities")
    prices = relationship("MarketPrice", back_populates="commodity", cascade="all, delete-orphan")
    msp_records = relationship("MSPRecord", back_populates="commodity", cascade="all, delete-orphan")
    calendars = relationship("CropCalendar", back_populates="commodity", cascade="all, delete-orphan")
    predictions = relationship("PricePrediction", back_populates="commodity", cascade="all, delete-orphan")

class State(Base):
    __tablename__ = "states"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    code = Column(String(10), unique=True, nullable=False)
    region = Column(String(50), nullable=True)  # North, South, East, West, Central

    markets = relationship("Market", back_populates="state")

class Market(Base):
    __tablename__ = "markets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), index=True, nullable=False)  # e.g., "Khanna Mandi", "Azadpur", "Lasalgaon"
    state_id = Column(Integer, ForeignKey("states.id"), nullable=False)
    district = Column(String(100), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    market_type = Column(String(50), default="APMC Mandi")  # APMC Mandi, eNAM, Private Yard
    is_active = Column(Boolean, default=True)

    state = relationship("State", back_populates="markets")
    prices = relationship("MarketPrice", back_populates="market", cascade="all, delete-orphan")
    weather_records = relationship("WeatherData", back_populates="market", cascade="all, delete-orphan")

class MarketPrice(Base):
    __tablename__ = "market_prices"

    id = Column(Integer, primary_key=True, index=True)
    commodity_id = Column(Integer, ForeignKey("commodities.id"), nullable=False)
    market_id = Column(Integer, ForeignKey("markets.id"), nullable=False)
    record_date = Column(DateTime, index=True, nullable=False)
    min_price = Column(Float, nullable=False)
    max_price = Column(Float, nullable=False)
    modal_price = Column(Float, nullable=False)
    arrival_quantity = Column(Float, default=0.0)  # in Metric Tonnes or Quintals
    data_status = Column(String(20), default="LIVE")  # LIVE, DELAYED, HISTORICAL, SAMPLE
    data_source = Column(String(50), default="AGMARKNET")  # AGMARKNET, data.gov.in, eNAM
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    commodity = relationship("Commodity", back_populates="prices")
    market = relationship("Market", back_populates="prices")

    __table_args__ = (
        Index("ix_price_comm_mkt_date", "commodity_id", "market_id", "record_date"),
    )

class WeatherData(Base):
    __tablename__ = "weather_data"

    id = Column(Integer, primary_key=True, index=True)
    market_id = Column(Integer, ForeignKey("markets.id"), nullable=False)
    record_date = Column(DateTime, index=True, nullable=False)
    temperature_current = Column(Float, nullable=True)
    temperature_max = Column(Float, nullable=True)
    temperature_min = Column(Float, nullable=True)
    rainfall_mm = Column(Float, default=0.0)
    humidity_pct = Column(Float, nullable=True)
    wind_speed_kmh = Column(Float, nullable=True)
    heatwave_detected = Column(Boolean, default=False)
    heavy_rain_detected = Column(Boolean, default=False)
    drought_index = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    market = relationship("Market", back_populates="weather_records")

class MSPRecord(Base):
    __tablename__ = "msp_records"

    id = Column(Integer, primary_key=True, index=True)
    commodity_id = Column(Integer, ForeignKey("commodities.id"), nullable=False)
    season = Column(String(50), nullable=False)  # Kharif, Rabi, Commercial
    year = Column(String(20), nullable=False)  # "2023-24", "2024-25", "2025-26"
    msp_price = Column(Float, nullable=False)  # in ₹/Quintal
    cost_of_production = Column(Float, nullable=True)
    margin_percent = Column(Float, nullable=True)  # Return over cost (e.g. 50%)

    commodity = relationship("Commodity", back_populates="msp_records")

class CropCalendar(Base):
    __tablename__ = "crop_calendars"

    id = Column(Integer, primary_key=True, index=True)
    commodity_id = Column(Integer, ForeignKey("commodities.id"), nullable=False)
    state_name = Column(String(100), nullable=False)
    season = Column(String(50), nullable=False)  # Kharif, Rabi, Zaid
    sowing_start_month = Column(String(20), nullable=False)
    sowing_end_month = Column(String(20), nullable=False)
    harvesting_start_month = Column(String(20), nullable=False)
    harvesting_end_month = Column(String(20), nullable=False)
    peak_arrival_month = Column(String(20), nullable=False)
    notes = Column(Text, nullable=True)

    commodity = relationship("Commodity", back_populates="calendars")

class PricePrediction(Base):
    __tablename__ = "price_predictions"

    id = Column(Integer, primary_key=True, index=True)
    commodity_id = Column(Integer, ForeignKey("commodities.id"), nullable=False)
    market_id = Column(Integer, ForeignKey("markets.id"), nullable=True)
    horizon_days = Column(Integer, nullable=False)  # 7, 15, 30, 60, 90
    forecast_date = Column(DateTime, nullable=False)
    predicted_modal_price = Column(Float, nullable=False)
    expected_min_price = Column(Float, nullable=False)
    expected_max_price = Column(Float, nullable=False)
    predicted_pct_change = Column(Float, nullable=False)
    market_direction = Column(String(20), nullable=False)  # Bullish, Bearish, Stable
    confidence_score = Column(Float, nullable=False)  # e.g., 0.88 (88%)
    model_name = Column(String(100), nullable=False)  # "Random Forest Regressor", "Gradient Boosting"
    influencing_factors = Column(JSON, nullable=True)
    evaluation_metrics = Column(JSON, nullable=True)  # MAE, RMSE, MAPE, R2
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    commodity = relationship("Commodity", back_populates="predictions")

class ModelVersion(Base):
    __tablename__ = "model_versions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    version = Column(String(50), nullable=False)
    algorithm = Column(String(100), nullable=False)
    mae = Column(Float, nullable=False)
    rmse = Column(Float, nullable=False)
    r2 = Column(Float, nullable=False)
    mape = Column(Float, nullable=True)
    feature_count = Column(Integer, default=12)
    trained_at = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String(20), default="active")  # active, archived, testing

class MarketAlert(Base):
    __tablename__ = "market_alerts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    commodity_id = Column(Integer, ForeignKey("commodities.id"), nullable=True)
    market_id = Column(Integer, ForeignKey("markets.id"), nullable=True)
    condition_type = Column(String(50), nullable=False)  # "price_above", "price_below", "pct_change_up", "pct_change_down", "below_msp", "high_volatility"
    threshold_value = Column(Float, nullable=False)
    is_active = Column(Boolean, default=True)
    notification_channel = Column(String(50), default="in_app")  # in_app, email
    last_triggered_at = Column(DateTime, nullable=True)
    trigger_message = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="alerts")

class UserWatchlist(Base):
    __tablename__ = "user_watchlists"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    commodity_id = Column(Integer, ForeignKey("commodities.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="watchlists")
    commodity = relationship("Commodity")

class ProfitCalculation(Base):
    __tablename__ = "profit_calculations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    commodity_name = Column(String(100), nullable=False)
    quantity = Column(Float, nullable=False)
    quantity_unit = Column(String(20), default="Quintal")  # Quintal, Kg, Ton
    selling_price = Column(Float, nullable=False)
    transport_cost = Column(Float, default=0.0)
    labor_cost = Column(Float, default=0.0)
    storage_cost = Column(Float, default=0.0)
    packaging_cost = Column(Float, default=0.0)
    other_cost = Column(Float, default=0.0)
    gross_revenue = Column(Float, nullable=False)
    total_expenses = Column(Float, nullable=False)
    net_profit = Column(Float, nullable=False)
    profit_margin_pct = Column(Float, nullable=False)
    break_even_price = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class StorageScenario(Base):
    __tablename__ = "storage_scenarios"

    id = Column(Integer, primary_key=True, index=True)
    commodity_name = Column(String(100), nullable=False)
    quantity = Column(Float, nullable=False)
    current_price = Column(Float, nullable=False)
    immediate_revenue = Column(Float, nullable=False)
    duration_days = Column(Integer, nullable=False)
    storage_charge = Column(Float, nullable=False)
    wastage_loss = Column(Float, nullable=False)
    expected_future_price = Column(Float, nullable=False)
    future_revenue = Column(Float, nullable=False)
    net_proceeds = Column(Float, nullable=False)
    net_benefit_vs_immediate = Column(Float, nullable=False)
    recommendation = Column(String(50), nullable=False)  # "SELL NOW", "STORE & WAIT"
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class MarketRiskAnomaly(Base):
    __tablename__ = "market_risk_anomalies"

    id = Column(Integer, primary_key=True, index=True)
    commodity_id = Column(Integer, ForeignKey("commodities.id"), nullable=True)
    market_id = Column(Integer, ForeignKey("markets.id"), nullable=True)
    risk_category = Column(String(100), nullable=False)  # "Price Crash", "Severe Volatility", "Supply Choke", "Weather Hazard"
    severity = Column(String(20), nullable=False)  # "High", "Medium", "Low"
    commodity_name = Column(String(100), nullable=False)
    market_name = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    supporting_data = Column(JSON, nullable=True)
    recommended_action = Column(Text, nullable=True)
    is_resolved = Column(Boolean, default=False)
    detected_at = Column(DateTime, default=datetime.datetime.utcnow)

class DataSyncLog(Base):
    __tablename__ = "data_sync_logs"

    id = Column(Integer, primary_key=True, index=True)
    source = Column(String(50), nullable=False)  # AGMARKNET, data.gov.in, Open-Meteo
    sync_type = Column(String(50), default="AUTOMATIC")  # AUTOMATIC, MANUAL
    records_added = Column(Integer, default=0)
    records_updated = Column(Integer, default=0)
    status = Column(String(20), default="SUCCESS")  # SUCCESS, FAILED, PARTIAL
    error_message = Column(Text, nullable=True)
    synced_at = Column(DateTime, default=datetime.datetime.utcnow)
