import { createContext, useContext } from 'react';
import { usePortfolio } from '../hooks/usePortfolio';

const PortfolioContext = createContext(null);

export function PortfolioProvider({ children }) {
  const portfolio = usePortfolio();
  return (
    <PortfolioContext.Provider value={portfolio}>
      {children}
    </PortfolioContext.Provider>
  );
}

export const usePortfolioCtx = () => useContext(PortfolioContext);
