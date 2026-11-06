import React, { createContext, useContext, useState } from 'react';

interface FilterContextType {
  selectedState: string;
  setSelectedState: (state: string) => void;
  selectedMandi: string;
  setSelectedMandi: (mandi: string) => void;
  selectedCommodityId: number | null;
  setSelectedCommodityId: (id: number | null) => void;
  dateRangeDays: number;
  setDateRangeDays: (days: number) => void;
}

const FilterContext = createContext<FilterContextType>({
  selectedState: 'All States',
  setSelectedState: () => {},
  selectedMandi: 'All Mandis',
  setSelectedMandi: () => {},
  selectedCommodityId: null,
  setSelectedCommodityId: () => {},
  dateRangeDays: 30,
  setDateRangeDays: () => {},
});

export const FilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedState, setSelectedState] = useState<string>('All States');
  const [selectedMandi, setSelectedMandi] = useState<string>('All Mandis');
  const [selectedCommodityId, setSelectedCommodityId] = useState<number | null>(null);
  const [dateRangeDays, setDateRangeDays] = useState<number>(30);

  return (
    <FilterContext.Provider
      value={{
        selectedState,
        setSelectedState,
        selectedMandi,
        setSelectedMandi,
        selectedCommodityId,
        setSelectedCommodityId,
        dateRangeDays,
        setDateRangeDays,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
};

export const useFilter = () => useContext(FilterContext);
