import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { FilterProvider } from './context/FilterContext';
import { Layout } from './components/layout/Layout';

// Module Pages
import { OverviewPage } from './pages/OverviewPage';
import { MarketTrackerPage } from './pages/MarketTrackerPage';
import { CommodityExplorerPage } from './pages/CommodityExplorerPage';
import { CommodityDetailPage } from './pages/CommodityDetailPage';
import { PredictionsPage } from './pages/PredictionsPage';
import { WeatherIntelligencePage } from './pages/WeatherIntelligencePage';
import { PriceAnalyticsPage } from './pages/PriceAnalyticsPage';
import { SupplyDemandPage } from './pages/SupplyDemandPage';
import { MandiComparisonPage } from './pages/MandiComparisonPage';
import { ArbitragePage } from './pages/ArbitragePage';
import { ProfitCalculatorPage } from './pages/ProfitCalculatorPage';
import { StorageDecisionPage } from './pages/StorageDecisionPage';
import { MSPIntelligencePage } from './pages/MSPIntelligencePage';
import { CropCalendarPage } from './pages/CropCalendarPage';
import { RiskIntelligencePage } from './pages/RiskIntelligencePage';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { MapPage } from './pages/MapPage';
import { InternationalMarketPage } from './pages/InternationalMarketPage';
import { WatchlistPage } from './pages/WatchlistPage';
import { AlertsPage } from './pages/AlertsPage';
import { ReportsPage } from './pages/ReportsPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <FilterProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<OverviewPage />} />
              <Route path="market-tracker" element={<MarketTrackerPage />} />
              <Route path="commodities" element={<CommodityExplorerPage />} />
              <Route path="commodities/:slug" element={<CommodityDetailPage />} />
              <Route path="predictions" element={<PredictionsPage />} />
              <Route path="weather" element={<WeatherIntelligencePage />} />
              <Route path="analytics" element={<PriceAnalyticsPage />} />
              <Route path="supply-demand" element={<SupplyDemandPage />} />
              <Route path="mandi-comparison" element={<MandiComparisonPage />} />
              <Route path="arbitrage" element={<ArbitragePage />} />
              <Route path="profit-calculator" element={<ProfitCalculatorPage />} />
              <Route path="storage-decision" element={<StorageDecisionPage />} />
              <Route path="msp" element={<MSPIntelligencePage />} />
              <Route path="crop-calendar" element={<CropCalendarPage />} />
              <Route path="market-risks" element={<RiskIntelligencePage />} />
              <Route path="assistant" element={<AIAssistantPage />} />
              <Route path="map" element={<MapPage />} />
              <Route path="international" element={<InternationalMarketPage />} />
              <Route path="watchlist" element={<WatchlistPage />} />
              <Route path="alerts" element={<AlertsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </FilterProvider>
    </AuthProvider>
  );
};

export default App;
