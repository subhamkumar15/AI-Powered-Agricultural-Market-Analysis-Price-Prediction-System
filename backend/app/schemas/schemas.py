import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field

# ----------------- Auth Schemas -----------------
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    user_id: int
    full_name: str

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role_name: Optional[str] = "farmer"  # "farmer", "trader", "analyst", "admin"
    preferred_state: Optional[str] = "Punjab"
    preferred_mandi: Optional[str] = "Khanna Mandi"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    preferred_state: Optional[str]
    preferred_mandi: Optional[str]
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# ----------------- Commodity Schemas -----------------
class CategoryOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None

    class Config:
        from_attributes = True

class CommodityBase(BaseModel):
    name: str
    slug: str
    category_id: int
    description: Optional[str] = None
    unit: str = "₹/Quintal"
    msp_applicable: bool = False
    perishable: bool = False
    shelf_life_days: int = 180
    image_url: Optional[str] = None

class CommodityOut(CommodityBase):
    id: int
    category_name: Optional[str] = None
    current_modal_price: Optional[float] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    daily_pct_change: Optional[float] = None
    weekly_pct_change: Optional[float] = None
    monthly_pct_change: Optional[float] = None
    msp_price: Optional[float] = None
    is_in_watchlist: Optional[bool] = False

    class Config:
        from_attributes = True

# ----------------- Market & Price Schemas -----------------
class StateOut(BaseModel):
    id: int
    name: str
    code: str
    region: Optional[str]

    class Config:
        from_attributes = True

class MarketOut(BaseModel):
    id: int
    name: str
    state_id: int
    state_name: str
    district: str
    latitude: float
    longitude: float
    market_type: str

    class Config:
        from_attributes = True

class MarketPriceOut(BaseModel):
    id: int
    commodity_id: int
    commodity_name: str
    market_id: int
    market_name: str
    state_name: str
    district: str
    record_date: datetime.date
    min_price: float
    max_price: float
    modal_price: float
    arrival_quantity: float
    data_status: str  # LIVE, DELAYED, HISTORICAL, SAMPLE
    data_source: str
    unit: str = "₹/Quintal"

    class Config:
        from_attributes = True

class PriceHistoryItem(BaseModel):
    date: str
    modal_price: float
    min_price: float
    max_price: float
    arrival_quantity: float
    ma_7: Optional[float] = None
    ma_30: Optional[float] = None
    ma_90: Optional[float] = None

# ----------------- Analytics & Weather Schemas -----------------
class WeatherCurrentOut(BaseModel):
    market_name: str
    state_name: str
    latitude: float
    longitude: float
    temperature_current: float
    temperature_max: float
    temperature_min: float
    rainfall_mm: float
    humidity_pct: float
    wind_speed_kmh: float
    heatwave_detected: bool
    heavy_rain_detected: bool
    drought_index: float
    record_date: datetime.date

class WeatherCorrelationResponse(BaseModel):
    commodity_name: str
    pearson_rainfall_price: float
    pearson_temp_price: float
    spearman_rainfall_price: float
    spearman_temp_price: float
    rainfall_impact_summary: str
    temp_impact_summary: str
    disclaimer: str = "Correlation does not imply causation. Meteorological factors influence supply dynamics with varying biological gestation lags."
    trend_data: List[Dict[str, Any]]

# ----------------- Prediction Schemas -----------------
class PredictionRequest(BaseModel):
    commodity_id: int
    market_id: Optional[int] = None
    horizon_days: int = Field(30, description="Forecast horizon: 7, 15, 30, 60, or 90 days")

class PredictionOut(BaseModel):
    commodity_id: int
    commodity_name: str
    market_id: Optional[int]
    market_name: Optional[str]
    forecast_horizon_days: int
    target_date: str
    predicted_modal_price: float
    expected_min_price: float
    expected_max_price: float
    predicted_pct_change: float
    market_direction: str  # Bullish, Bearish, Stable
    confidence_score: float
    model_name: str
    influencing_factors: Dict[str, float]
    metrics: Dict[str, float]
    forecast_series: List[Dict[str, Any]]

class ModelVersionOut(BaseModel):
    id: int
    name: str
    version: str
    algorithm: str
    mae: float
    rmse: float
    r2: float
    mape: Optional[float]
    feature_count: int
    trained_at: datetime.datetime
    status: str

# ----------------- Calculators & Arbitrage -----------------
class ProfitCalculationRequest(BaseModel):
    crop_name: str
    quantity: float
    quantity_unit: str = "Quintal"  # Quintal, Kg, Ton
    selling_price: float
    transport_cost: float = 0.0
    labor_cost: float = 0.0
    storage_cost: float = 0.0
    packaging_cost: float = 0.0
    other_cost: float = 0.0

class ProfitCalculationResponse(BaseModel):
    crop_name: str
    quantity_quintals: float
    selling_price_per_quintal: float
    gross_revenue: float
    total_expenses: float
    net_profit: float
    profit_margin_pct: float
    profit_per_quintal: float
    break_even_price: float
    breakdown: Dict[str, float]
    mandi_comparisons: List[Dict[str, Any]]

class ArbitrageOpportunityItem(BaseModel):
    commodity_name: str
    source_mandi: str
    source_state: str
    source_price: float
    dest_mandi: str
    dest_state: str
    dest_price: float
    price_difference: float
    estimated_distance_km: float
    estimated_freight_cost_per_qtl: float
    net_benefit_per_qtl: float
    total_net_benefit_100qtl: float
    freshness: str
    opportunity_rating: str  # Excellent, Moderate, Marginal, Unfavorable

# ----------------- Storage Decision -----------------
class StorageAnalysisRequest(BaseModel):
    commodity_id: int
    quantity_quintals: float = 100.0
    current_price: Optional[float] = None
    monthly_storage_rate_per_qtl: float = 25.0
    monthly_holding_interest_pct: float = 0.8
    monthly_wastage_pct: float = 1.5

class StorageScenarioItem(BaseModel):
    duration_days: int
    projected_price: float
    gross_future_revenue: float
    storage_cost: float
    holding_cost: float
    wastage_loss_amount: float
    net_future_proceeds: float
    net_gain_vs_immediate: float
    recommendation: str

class StorageDecisionResponse(BaseModel):
    commodity_name: str
    quantity_quintals: float
    current_price: float
    immediate_selling_revenue: float
    scenarios: List[StorageScenarioItem]
    best_strategy: str
    decision_summary: str

# ----------------- MSP & Supply-Demand -----------------
class MSPRecordOut(BaseModel):
    commodity_id: int
    commodity_name: str
    season: str
    year: str
    msp_price: float
    current_modal_price: Optional[float]
    difference_pct: Optional[float]
    is_below_msp: bool
    cost_of_production: Optional[float]
    margin_percent: Optional[float]

class CropCalendarOut(BaseModel):
    id: int
    commodity_name: str
    state_name: str
    season: str
    sowing_period: str
    harvesting_period: str
    peak_arrival_period: str
    notes: Optional[str]

# ----------------- AI Assistant -----------------
class AssistantQueryRequest(BaseModel):
    question: str
    context_commodity: Optional[str] = None
    context_state: Optional[str] = None

class AssistantQueryResponse(BaseModel):
    answer: str
    data_sources: List[str]
    citations: List[Dict[str, Any]]
    confidence: float
    timestamp: datetime.datetime

# ----------------- Alerts & Dashboard Overview -----------------
class AlertCreate(BaseModel):
    commodity_id: Optional[int] = None
    market_id: Optional[int] = None
    condition_type: str
    threshold_value: float
    notification_channel: str = "in_app"

class AlertOut(BaseModel):
    id: int
    commodity_name: Optional[str]
    market_name: Optional[str]
    condition_type: str
    threshold_value: float
    is_active: bool
    last_triggered_at: Optional[datetime.datetime]
    trigger_message: Optional[str]

class DashboardOverviewResponse(BaseModel):
    total_commodities_tracked: int
    total_mandis_monitored: int
    avg_commodity_price: float
    total_market_arrivals: float
    commodities_increasing: int
    commodities_decreasing: int
    highest_price_gain_commodity: str
    highest_price_gain_pct: float
    highest_price_drop_commodity: str
    highest_price_drop_pct: float
    last_sync_time: str
    top_gainers: List[Dict[str, Any]]
    top_losers: List[Dict[str, Any]]
    price_trends: List[Dict[str, Any]]
    category_distribution: List[Dict[str, Any]]
    regional_prices: List[Dict[str, Any]]
