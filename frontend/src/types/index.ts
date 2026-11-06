export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'farmer' | 'trader' | 'analyst' | 'admin';
  preferred_state?: string;
  preferred_mandi?: string;
  created_at: string;
}

export interface CommodityCategory {
  id: number;
  name: string;
  description?: string;
  icon?: string;
}

export interface Commodity {
  id: number;
  name: string;
  slug: string;
  category_id: number;
  category_name?: string;
  description?: string;
  unit: string;
  msp_applicable: boolean;
  perishable: boolean;
  shelf_life_days: number;
  image_url?: string;
  current_modal_price?: number;
  min_price?: number;
  max_price?: number;
  daily_pct_change?: number;
  weekly_pct_change?: number;
  monthly_pct_change?: number;
  msp_price?: number;
  is_in_watchlist?: boolean;
}

export interface Market {
  id: number;
  name: string;
  state_id: number;
  state_name: string;
  district: string;
  latitude: number;
  longitude: number;
  market_type: string;
}

export interface StateItem {
  id: number;
  name: string;
  code: string;
  region?: string;
}

export interface MarketPrice {
  id: number;
  commodity_id: number;
  commodity_name: string;
  market_id: number;
  market_name: string;
  state_name: string;
  district: string;
  record_date: string;
  min_price: number;
  max_price: number;
  modal_price: number;
  arrival_quantity: number;
  data_status: 'LIVE' | 'DELAYED' | 'HISTORICAL' | 'SAMPLE';
  data_source: string;
  unit: string;
}

export interface PriceHistoryPoint {
  date: string;
  modal_price: number;
  min_price: number;
  max_price: number;
  arrival_quantity: number;
  ma_7?: number;
  ma_30?: number;
  ma_90?: number;
}

export interface PriceHistoryResponse {
  commodity_name: string;
  days: number;
  history: PriceHistoryPoint[];
  stats: {
    current_modal: number;
    historical_min: number;
    historical_max: number;
    historical_avg: number;
    volatility: number;
    deviation_from_avg_pct: number;
  };
}

export interface PredictionResult {
  commodity_id: number;
  commodity_name: string;
  market_id?: number;
  market_name?: string;
  forecast_horizon_days: number;
  target_date: string;
  predicted_modal_price: number;
  expected_min_price: number;
  expected_max_price: number;
  predicted_pct_change: number;
  market_direction: 'Bullish' | 'Bearish' | 'Stable';
  confidence_score: number;
  model_name: string;
  influencing_factors: Record<string, number>;
  metrics: {
    mae: number;
    rmse: number;
    r2: number;
    mape: number;
  };
  forecast_series: Array<{
    date: string;
    day_offset: number;
    predicted_price: number;
    lower_bound: number;
    upper_bound: number;
  }>;
}

export interface WeatherCorrelationData {
  commodity_name: string;
  pearson_rainfall_price: number;
  pearson_temp_price: number;
  spearman_rainfall_price: number;
  spearman_temp_price: number;
  rainfall_impact_summary: string;
  temp_impact_summary: string;
  disclaimer: string;
  trend_data: Array<{
    date: string;
    modal_price: number;
    rainfall_mm: number;
    temperature: number;
    humidity: number;
  }>;
}

export interface ArbitrageOpportunity {
  commodity_name: string;
  source_mandi: string;
  source_state: string;
  source_price: number;
  dest_mandi: string;
  dest_state: string;
  dest_price: number;
  price_difference: number;
  estimated_distance_km: number;
  estimated_freight_cost_per_qtl: number;
  net_benefit_per_qtl: number;
  total_net_benefit_100qtl: number;
  freshness: string;
  opportunity_rating: 'Excellent' | 'Moderate' | 'Marginal' | 'Unfavorable';
}

export interface ProfitCalculationResult {
  crop_name: string;
  quantity_quintals: number;
  selling_price_per_quintal: number;
  gross_revenue: number;
  total_expenses: number;
  net_profit: number;
  profit_margin_pct: number;
  profit_per_quintal: number;
  break_even_price: number;
  breakdown: {
    transport: number;
    labor: number;
    storage: number;
    packaging: number;
    other: number;
  };
  mandi_comparisons: Array<{
    mandi_name: string;
    state_name: string;
    modal_price: number;
    estimated_revenue: number;
    estimated_net_profit: number;
    profit_margin_pct: number;
  }>;
}

export interface StorageScenarioItem {
  duration_days: number;
  projected_price: number;
  gross_future_revenue: number;
  storage_cost: number;
  holding_cost: number;
  wastage_loss_amount: number;
  net_future_proceeds: number;
  net_gain_vs_immediate: number;
  recommendation: string;
}

export interface StorageDecisionResponse {
  commodity_name: string;
  quantity_quintals: number;
  current_price: number;
  immediate_selling_revenue: number;
  scenarios: StorageScenarioItem[];
  best_strategy: string;
  decision_summary: string;
}

export interface MSPRecordItem {
  commodity_id: number;
  commodity_name: string;
  season: string;
  year: string;
  msp_price: number;
  current_modal_price?: number;
  difference_pct?: number;
  is_below_msp: boolean;
  cost_of_production?: number;
  margin_percent?: number;
}

export interface CropCalendarItem {
  id: number;
  commodity_name: string;
  state_name: string;
  season: string;
  sowing_period: string;
  harvesting_period: string;
  peak_arrival_period: string;
  notes?: string;
}

export interface MarketRiskItem {
  id: number;
  risk_category: string;
  severity: 'High' | 'Medium' | 'Low';
  commodity_name: string;
  market_name: string;
  description: string;
  supporting_data?: Record<string, any>;
  recommended_action: string;
  detected_at: string;
}

export interface MarketAlertItem {
  id: number;
  commodity_name?: string;
  market_name?: string;
  condition_type: string;
  threshold_value: number;
  is_active: boolean;
  last_triggered_at?: string;
  trigger_message?: string;
}

export interface DashboardOverview {
  total_commodities_tracked: number;
  total_mandis_monitored: number;
  avg_commodity_price: number;
  total_market_arrivals: number;
  commodities_increasing: number;
  commodities_decreasing: number;
  highest_price_gain_commodity: string;
  highest_price_gain_pct: number;
  highest_price_drop_commodity: string;
  highest_price_drop_pct: number;
  last_sync_time: string;
  top_gainers: Array<{
    commodity_id: number;
    commodity_name: string;
    category: string;
    modal_price: number;
    weekly_pct_change: number;
    arrival_quantity: number;
    unit: string;
  }>;
  top_losers: Array<{
    commodity_id: number;
    commodity_name: string;
    category: string;
    modal_price: number;
    weekly_pct_change: number;
    arrival_quantity: number;
    unit: string;
  }>;
  price_trends: Array<{
    date: string;
    avg_modal_price: number;
    total_arrivals: number;
  }>;
  category_distribution: Array<{
    name: string;
    value: number;
  }>;
  regional_prices: Array<{
    state: string;
    region: string;
    avg_price: number;
  }>;
}

export interface AssistantResponse {
  answer: string;
  data_sources: string[];
  citations: any[];
  confidence: number;
  timestamp: string;
}
