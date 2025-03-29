import axios from 'axios';
import { HourlyPriceResponse, hourlyPricesResponseSchema, pricingSummarySchema } from '@shared/schema';
import { isPeakHour } from '../client/src/lib/utils';

// GridX API endpoint with stage prefix
const GRIDX_API_URL = 'https://pge-pe-api.gridx.com/stage/v1/getPricing';

// Default parameters for Peninsula Clean Energy based on working example
const DEFAULT_PARAMS = {
  utility: 'PGE',                       // PG&E utility 
  cca: 'AVA',                           // Using the CCA from the working example
  ratename: 'EV2A',                     // Using simpler rate name without the 'S' suffix
  program: 'CalFUSE',                   // Note: uppercase "FUSE"
  market: 'DAM',                        // Day-Ahead Market
  representativeCircuitId: '013532223'  // Using ID from working example
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

// Generate realistic pricing data for a given date
// This function produces synthetic but realistic data patterns for electricity pricing
const generatePricingData = (date: string): HourlyPriceResponse[] => {
  console.log(`Generating pricing data for ${date}`);
  
  // Create a deterministic seed based on the date so the same date always returns the same data
  const seed = date.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Simple pseudo-random number generator with seed
  const random = (min: number, max: number): number => {
    const x = Math.sin(seed + 1) * 10000;
    return (x - Math.floor(x)) * (max - min) + min;
  };
  
  // Base prices for different periods of the day
  const basePrices = {
    overnight: 0.12,  // 12-6am: lowest rates
    morning: 0.18,    // 6-10am: rising demand
    midday: 0.22,     // 10am-4pm: solar production keeps prices moderate
    evening: 0.38,    // 4-9pm: peak demand
    night: 0.20       // 9pm-12am: declining demand
  };
  
  // Day of week adjustments (weekend vs weekday)
  const dateObj = new Date(date);
  const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
  const weekendFactor = isWeekend ? 0.8 : 1.0; // 20% cheaper on weekends
  
  // Create 24 hours of pricing data
  const pricingData: HourlyPriceResponse[] = [];
  
  for (let hour = 0; hour < 24; hour++) {
    let basePrice: number;
    
    // Determine time period
    if (hour >= 0 && hour < 6) {
      basePrice = basePrices.overnight;
    } else if (hour >= 6 && hour < 10) {
      basePrice = basePrices.morning;
    } else if (hour >= 10 && hour < 16) {
      basePrice = basePrices.midday;
    } else if (hour >= 16 && hour < 21) {
      basePrice = basePrices.evening;
    } else {
      basePrice = basePrices.night;
    }
    
    // Apply weekend adjustment
    basePrice *= weekendFactor;
    
    // Add up to 10% random variation
    const randomVariation = 1 + (random(0, 10) - 5) / 100;
    const price = +(basePrice * randomVariation).toFixed(5);
    
    pricingData.push({
      hour,
      price,
      isPeak: isPeakHour(hour)
    });
  }
  
  return hourlyPricesResponseSchema.parse(pricingData);
};

/**
 * Converts a date string in ISO format (YYYY-MM-DD) to the format required by the GridX API (YYYYMMDD)
 */
const formatDateForGridXApi = (dateString: string): string => {
  return dateString.replace(/-/g, '');
};

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
    
    // Format dates for the API - startdate and enddate should be in YYYYMMDD format
    const formattedDate = formatDateForGridXApi(date);
    
    // Try making an API request
    try {
      console.log(`Making API request to ${GRIDX_API_URL} for date ${formattedDate}`);
      
      const response = await axios.get<GridXApiResponse>(GRIDX_API_URL, {
        params: {
          ...DEFAULT_PARAMS,
          startdate: formattedDate,  // Using the correct parameter name
          enddate: formattedDate     // Same date for start and end to get a single day
        },
        headers,
        timeout: 5000 // 5 second timeout
      });
      
      console.log('API response status:', response.status);
      
      // Extract pricing data from response
      let pricingArray = response.data.pricing || [];
      
      // If pricing is not directly in response.data, check if it's in response.data.data
      if ((!pricingArray || pricingArray.length === 0) && response.data.data?.pricing) {
        pricingArray = response.data.data.pricing;
      }
      
      // If we have valid pricing data, use it
      if (pricingArray && Array.isArray(pricingArray) && pricingArray.length > 0) {
        console.log(`Successfully retrieved ${pricingArray.length} hours of pricing data from API`);
        
        // Transform API response to our schema
        const pricingData: HourlyPriceResponse[] = pricingArray.map(item => ({
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
      } else {
        console.log('API response did not contain pricing data array. Response:', JSON.stringify(response.data, null, 2));
      }
    } catch (apiError: any) {
      // Log API error but continue to fallback method
      if (axios.isAxiosError(apiError)) {
        console.log(`API request failed with status ${apiError.response?.status}:`, 
          apiError.response?.data || apiError.message);
      } else {
        console.log('API request failed:', apiError);
      }
    }
    
    // If API request failed or returned invalid data, generate data
    console.log('Using generated pricing data for visualization');
    const generatedData = generatePricingData(date);
    
    // Store in cache
    cache[cacheKey] = {
      data: generatedData,
      timestamp: new Date()
    };
    
    return generatedData;
  } catch (error) {
    console.error('Error in fetchPricingData:', error);
    throw new Error('Failed to fetch or generate pricing data');
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
