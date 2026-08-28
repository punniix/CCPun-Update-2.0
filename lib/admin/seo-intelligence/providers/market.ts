import type { MarketProviderSnapshot } from "../contracts";

export type MarketAdapterOptions = {
  now: string;
  staleAfterHours?: number;
};

export interface MarketDataProvider<TInput> {
  readonly id: string;
  normalize(input: TInput, options: MarketAdapterOptions): MarketProviderSnapshot;
}
