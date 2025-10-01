import { MarketWithAmounts } from "../types";

export function setMarketInMarkets({
  market,
  markets,
  setMarkets,
}: {
  market: MarketWithAmounts;
  markets: Map<string, MarketWithAmounts>;
  setMarkets: (markets: Map<string, MarketWithAmounts>) => void;
}): void {
  const updatedMarkets = new Map(markets);
  updatedMarkets.set(market.id, market);
  setMarkets(updatedMarkets);
}