import axios from 'axios';
import { HourlyPriceResponse, hourlyPricesResponseSchema, pricingSummarySchema } from '@shared/schema';
import { isPeakHour } from '../client/src/lib/utils';

// GridX API endpoint
const GRIDX_API_URL = 'https://api-calculate-docs.gridx.com/acgd/get-pricing';

// Default parameters for Peninsula Clean Energy
const DEFAULT_PARAMS = {
  CCA: 'PCE',
  rateName: 'EV2AS',
  representativeCircuitID: '013921103'
};

// Type for the GridX API response
type GridXApiResponse = {
  pricing: Array<{
    hour: number;
    price: number;
  }>;
};

// Cache storage
type CacheEntry = {
  data: HourlyPriceResponse[];
  timestamp: Date;
};

// Cache expiration in milliseconds (30 minutes)
const CACHE_EXPIRATION = 30 * 60 * 1000;

// In-memory cache
const cache: Record<string, CacheEntry> = {};

export const fetchPricingData = async (date: string): Promise<HourlyPriceResponse[]> => {
  const cacheKey = `pricing_${date}`;

  // Check if we have a valid cache entry
  if (cache[cacheKey] && (Date.now() - cache[cacheKey].timestamp.getTime()) < CACHE_EXPIRATION) {
    return cache[cacheKey].data;
  }

  try {
    // Make API request
    const response = await axios.get<GridXApiResponse>(GRIDX_API_URL, {
      params: {
        ...DEFAULT_PARAMS,
        date
      },
      headers: {
        'Accept': 'application/json'
      }
    });

    // Transform API response to our schema
    const pricingData: HourlyPriceResponse[] = response.data.pricing.map(item => ({
      hour: item.hour,
      price: item.price,
      isPeak: isPeakHour(item.hour)
    }));

    // Validate response
    const validatedData = hourlyPricesResponseSchema.parse(pricingData);

    // Store in cache
    cache[cacheKey] = {
      data: validatedData,
      timestamp: new Date()
    };

    return validatedData;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Failed to fetch pricing data: ${error.response?.data?.message || error.message}`);
    }
    throw new Error('Failed to fetch pricing data from GridX API');
  }
};

export const calculatePricingSummary = (priceData: HourlyPriceResponse[]) => {
  if (!priceData || priceData.length === 0) {
    return { average: 0, peak: 0, offPeak: 0 };
  }

  const allPrices = priceData.map(item => item.price);
  const peakPrices = priceData.filter(item => isPeakHour(item.hour)).map(item => item.price);
  const offPeakPrices = priceData.filter(item => !isPeakHour(item.hour)).map(item => item.price);
  
  const average = (arr: number[]): number => 
    arr.length ? arr.reduce((sum, val) => sum + val, 0) / arr.length : 0;
  
  const summary = {
    average: average(allPrices),
    peak: average(peakPrices),
    offPeak: average(offPeakPrices)
  };

  return pricingSummarySchema.parse(summary);
};
