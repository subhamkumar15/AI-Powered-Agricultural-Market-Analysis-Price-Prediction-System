import axios from 'axios';
import {
  Commodity,
  CommodityCategory,
  Market,
  StateItem,
  MarketPrice,
  PriceHistoryResponse,
  PredictionResult,
  WeatherCorrelationData,
  ArbitrageOpportunity,
  ProfitCalculationResult,
  StorageDecisionResponse,
  MSPRecordItem,
  CropCalendarItem,
  MarketRiskItem,
  MarketAlertItem,
  DashboardOverview,
  AssistantResponse,
  User
} from '../types';

const API_BASE = 'http://localhost:8000/api';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject JWT token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('agrimarket_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = {
  // Auth
  login: async (credentials: any) => {
    const res = await apiClient.post('/auth/login-json', credentials);
    return res.data;
  },
  getProfile: async (): Promise<User> => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },

  // Overview / Analytics
  getOverview: async (categoryId?: number, stateId?: number): Promise<DashboardOverview> => {
    const params: any = {};
    if (categoryId) params.category_id = categoryId;
    if (stateId) params.state_id = stateId;
    const res = await apiClient.get('/analytics/overview', { params });
    return res.data;
  },

  // Commodities
  getCommodities: async (categoryId?: number, search?: string): Promise<Commodity[]> => {
    const params: any = {};
    if (categoryId) params.category_id = categoryId;
    if (search) params.search = search;
    const res = await apiClient.get('/commodities/', { params });
    return res.data;
  },
  getCategories: async (): Promise<CommodityCategory[]> => {
    const res = await apiClient.get('/commodities/categories');
    return res.data;
  },
  getCommodityDetail: async (idOrSlug: string | number): Promise<Commodity> => {
    const res = await apiClient.get(`/commodities/${idOrSlug}`);
    return res.data;
  },
  toggleWatchlist: async (commodityId: number) => {
    const res = await apiClient.post(`/commodities/${commodityId}/watchlist`);
    return res.data;
  },
  getWatchlist: async (): Promise<Commodity[]> => {
    const res = await apiClient.get('/commodities/watchlist/me');
    return res.data;
  },

  // Markets
  getMarkets: async (stateId?: number, district?: string, search?: string): Promise<Market[]> => {
    const params: any = {};
    if (stateId) params.state_id = stateId;
    if (district) params.district = district;
    if (search) params.search = search;
    const res = await apiClient.get('/markets/', { params });
    return res.data;
  },
  getStates: async (): Promise<StateItem[]> => {
    const res = await apiClient.get('/markets/states');
    return res.data;
  },
  getMarketDetail: async (id: number) => {
    const res = await apiClient.get(`/markets/${id}`);
    return res.data;
  },

  // Market Prices
  getMarketPrices: async (params?: any): Promise<MarketPrice[]> => {
    const res = await apiClient.get('/market-prices/', { params });
    return res.data;
  },
  getPriceHistory: async (commodityId: number, marketId?: number, days = 90): Promise<PriceHistoryResponse> => {
    const params: any = { commodity_id: commodityId, days };
    if (marketId) params.market_id = marketId;
    const res = await apiClient.get('/market-prices/history', { params });
    return res.data;
  },
  compareMandis: async (commodityId: number, marketIds?: string, days = 30) => {
    const params: any = { commodity_id: commodityId, days };
    if (marketIds) params.market_ids = marketIds;
    const res = await apiClient.get('/market-prices/compare', { params });
    return res.data;
  },
  syncMarketData: async () => {
    const res = await apiClient.post('/market-prices/sync');
    return res.data;
  },

  // Predictions
  generatePrediction: async (commodityId: number, horizonDays = 30, marketId?: number): Promise<PredictionResult> => {
    const payload: any = { commodity_id: commodityId, horizon_days: horizonDays };
    if (marketId) payload.market_id = marketId;
    const res = await apiClient.post('/predictions/generate', payload);
    return res.data;
  },
  getModelVersions: async () => {
    const res = await apiClient.get('/predictions/models');
    return res.data;
  },
  retrainModels: async () => {
    const res = await apiClient.post('/predictions/retrain');
    return res.data;
  },

  // Weather
  getCurrentWeather: async (marketId: number) => {
    const res = await apiClient.get('/weather/current', { params: { market_id: marketId } });
    return res.data;
  },
  getWeatherCorrelation: async (commodityId: number): Promise<WeatherCorrelationData> => {
    const res = await apiClient.get('/weather/correlation', { params: { commodity_id: commodityId } });
    return res.data;
  },

  // Calculators
  calculateProfit: async (data: any): Promise<ProfitCalculationResult> => {
    const res = await apiClient.post('/calculator/profit', data);
    return res.data;
  },
  analyzeStorage: async (data: any): Promise<StorageDecisionResponse> => {
    const res = await apiClient.post('/calculator/storage', data);
    return res.data;
  },
  getProfitHistory: async () => {
    const res = await apiClient.get('/calculator/history');
    return res.data;
  },

  // Arbitrage
  getArbitrageOpportunities: async (commodityId?: number, minNetBenefit = 0): Promise<ArbitrageOpportunity[]> => {
    const params: any = { min_net_benefit: minNetBenefit };
    if (commodityId) params.commodity_id = commodityId;
    const res = await apiClient.get('/market-opportunities/', { params });
    return res.data;
  },

  // MSP
  getMSPRecords: async (year = '2025-26', season?: string): Promise<MSPRecordItem[]> => {
    const params: any = { year };
    if (season) params.season = season;
    const res = await apiClient.get('/msp/', { params });
    return res.data;
  },
  getBelowMSPRecords: async (): Promise<MSPRecordItem[]> => {
    const res = await apiClient.get('/msp/below-msp');
    return res.data;
  },

  // Supply & Demand
  getSupplyDemandOverview: async (commodityId?: number, days = 30) => {
    const params: any = { days };
    if (commodityId) params.commodity_id = commodityId;
    const res = await apiClient.get('/supply-demand/overview', { params });
    return res.data;
  },
  getCropCalendar: async (commodityId?: number, stateName?: string): Promise<CropCalendarItem[]> => {
    const params: any = {};
    if (commodityId) params.commodity_id = commodityId;
    if (stateName) params.state_name = stateName;
    const res = await apiClient.get('/supply-demand/crop-calendar', { params });
    return res.data;
  },

  // Risks
  getMarketRisks: async (): Promise<MarketRiskItem[]> => {
    const res = await apiClient.get('/market-risks/');
    return res.data;
  },

  // Alerts
  getAlerts: async (): Promise<MarketAlertItem[]> => {
    const res = await apiClient.get('/alerts/');
    return res.data;
  },
  createAlert: async (data: any): Promise<MarketAlertItem> => {
    const res = await apiClient.post('/alerts/', data);
    return res.data;
  },
  toggleAlert: async (id: number) => {
    const res = await apiClient.put(`/alerts/${id}/toggle`);
    return res.data;
  },
  deleteAlert: async (id: number) => {
    const res = await apiClient.delete(`/alerts/${id}`);
    return res.data;
  },

  // Assistant
  askAssistant: async (question: string, contextCommodity?: string, contextState?: string): Promise<AssistantResponse> => {
    const res = await apiClient.post('/assistant/chat', {
      question,
      context_commodity: contextCommodity,
      context_state: contextState,
    });
    return res.data;
  },

  // Reports
  generateReport: async (reportType: string, format = 'json', commodityId?: number) => {
    const res = await apiClient.post('/reports/generate', {
      report_type: reportType,
      format,
      commodity_id: commodityId,
    });
    return res.data;
  },
};
