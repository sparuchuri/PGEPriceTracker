import axios from 'axios';
import { HourlyPriceResponse, hourlyPricesResponseSchema, pricingSummarySchema } from '@shared/schema';
import { isPeakHour } from '../client/src/lib/utils';

// GridX API endpoint
const GRIDX_API_URL = 'https://pge-pe-api.gridx.com/v1/getPricing';

// Default parameters for Peninsula Clean Energy
const DEFAULT_PARAMS = {
  utility: 'PCE', // Try both parameter formats since API documentation may be outdated
  CCA: 'PCE',
  program: 'EV2AS',
  rateName: 'EV2AS',
  representativeCircuitID: '013921103'
};

// Type for the GridX API response
type GridXApiResponse = {
  // Expecting an array of pricing objects, but being flexible for different structures
  pricing?: Array<{
    hour: number;
    price: number;
    [key: string]: any; // Allow for additional properties we don't use
  }>;
  
  // Some APIs might return data in a different format
  data?: {
    pricing?: Array<{
      hour: number;
      price: number;
      [key: string]: any;
    }>;
    [key: string]: any;
  };
  
  // Allow for any other structure to avoid parsing errors
  [key: string]: any;
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
    // Set up headers for the request
    const headers: Record<string, string> = {
      'Accept': 'application/json'
    };
    
    // Make API request
    const response = await axios.get<GridXApiResponse>(GRIDX_API_URL, {
      params: {
        ...DEFAULT_PARAMS,
        date
      },
      headers
    });

    // Log response for debugging
    console.log('API Response Structure:', JSON.stringify(Object.keys(response.data)));
    
    // Extract pricing data from response, handling different possible structures
    let pricingArray = response.data.pricing || [];
    
    // If pricing is not directly in response.data, check if it's in response.data.data
    if (!pricingArray && response.data.data?.pricing) {
      pricingArray = response.data.data.pricing;
    }
    
    // If we still don't have pricing data, throw an error
    if (!pricingArray || !Array.isArray(pricingArray)) {
      console.error('Unexpected API response structure:', response.data);
      throw new Error('API response missing pricing data array');
    }
    
    // Transform API response to our schema
    const pricingData: HourlyPriceResponse[] = pricingArray.map(item => ({
      hour: item.hour,
      price: item.price,
      isPeak: isPeakHour(item.hour)
    }));
    
    // Log extracted data
    console.log(`Extracted ${pricingData.length} hours of pricing data`);

    // Validate response
    const validatedData = hourlyPricesResponseSchema.parse(pricingData);

    // Store in cache
    cache[cacheKey] = {
      data: validatedData,
      timestamp: new Date()
    };

    return validatedData;
  } catch (error) {
    console.error('API Request Error:', error);
    
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      let message = error.response?.data?.message || error.message;
      const url = error.config?.url;
      
      // Check if the response data contains a meta section with a response message (GridX API specific format)
      if (error.response?.data?.meta?.response) {
        message = error.response.data.meta.response;
        console.error('GridX API Error Response:', message);
      }
      
      console.error(`Failed API request: ${status} - ${message} for URL: ${url}`);
      
      // Special handling for utility/program not found error
      if (message.includes('utility or program name does not exist')) {
        throw new Error('The specified utility (PCE) or rate plan (EV2AS) could not be found. Please check API documentation for correct values.');
      }
      
      throw new Error(`Failed to fetch pricing data: ${message}`);
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
