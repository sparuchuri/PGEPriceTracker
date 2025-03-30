
import { HourlyPriceResponse, PricingSummary, hourlyPricesResponseSchema, pricingSummarySchema } from "@shared/schema";
import { isPeakHour } from "@/lib/utils";

// GridX API endpoint
const GRIDX_API_URL = 'https://pge-pe-api.gridx.com/stage/v1/getPricing';

// Default parameters
const DEFAULT_PARAMS = {
  utility: 'PGE',
  cca: 'PCE',
  ratename: 'EV2A',
  program: 'CalFUSE',
  market: 'DAM',
};

export const fetchPricingData = async (date: string, rateName: string, circuitId: string): Promise<HourlyPriceResponse[]> => {
  const formattedDate = date.replace(/-/g, '');
  
  const params = {
    ...DEFAULT_PARAMS,
    startdate: formattedDate,
    enddate: formattedDate,
    ratename: rateName,
    representativeCircuitId: circuitId,
  };

  const queryString = new URLSearchParams(params).toString();
  const response = await fetch(`${GRIDX_API_URL}?${queryString}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch pricing data');
  }

  const data = await response.json();
  
  if (!data?.data?.[0]?.priceDetails) {
    throw new Error('Invalid response format');
  }

  const hourlyPrices = data.data[0].priceDetails.map((detail: any) => {
    const hour = parseInt(detail.startIntervalTimeStamp.split('T')[1].split(':')[0], 10);
    const price = parseFloat(detail.intervalPrice || '0');
    
    return {
      hour,
      price,
      isPeak: isPeakHour(hour)
    };
  });

  return hourlyPricesResponseSchema.parse(hourlyPrices);
};

export const calculatePricingSummary = (priceData: HourlyPriceResponse[]): PricingSummary => {
  if (!priceData?.length) {
    return { average: 0, peak: 0, offPeak: 0 };
  }

  const peakPrices = priceData.filter(item => isPeakHour(item.hour)).map(item => item.price);
  const offPeakPrices = priceData.filter(item => !isPeakHour(item.hour)).map(item => item.price);
  
  const average = (arr: number[]) => arr.length ? arr.reduce((sum, val) => sum + val, 0) / arr.length : 0;

  return pricingSummarySchema.parse({
    average: average(priceData.map(item => item.price)),
    peak: average(peakPrices),
    offPeak: average(offPeakPrices)
  });
};
