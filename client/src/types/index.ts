import { HourlyPriceResponse, PricingSummary } from "@shared/schema";

export type APIError = {
  message: string;
};

export interface GridXParameters {
  date: string;
  cca?: string;
  rateName?: string;
  representativeCircuitId?: string;
}

export type ChartDataPoint = {
  hour: number;
  price: number;
  isPeak: boolean;
};
