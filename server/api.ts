import axios from 'axios';
import { HourlyPriceResponse, hourlyPricesResponseSchema, pricingSummarySchema, GridXParameters } from '@shared/schema';
import { isPeakHour } from '../client/src/lib/utils';

// GridX API endpoint with stage prefix
const GRIDX_API_URL = 'https://pge-pe-api.gridx.com/stage/v1/getPricing';

// Default parameters for Peninsula Clean Energy based on user requirements
const DEFAULT_PARAMS = {
  utility: 'PGE',                       // PG&E utility 
  cca: 'PCE',                           // Peninsula Clean Energy (PCE)
  ratename: 'EV2A',                     // EV2A electric vehicle rate
  program: 'CalFUSE',                   // California Flexible Unified Signal Extension
  market: 'DAM',                        // Day-Ahead Market
  representativeCircuitId: '013921103'  // Default circuit ID
};

// Type for the GridX API response
// The actual response has a complex nested structure, so we define a more detailed type
type GridXApiResponse = {
  // Top level properties
  meta?: {
    code?: number;
    requestURL?: string;
    response?: string;
    [key: string]: any;
  };
  
  // Main data array containing pricing information
  data?: Array<{
    // Each data item may have pricing information for specific days
    pricingInfo?: Array<{
      // Each day has an array of intervals (hourly pricing)
      intervals?: Array<{
        startIntervalTimeStamp?: string; // Format: "2025-03-29T00:00:00-0700"
        intervalPrice?: string;          // Price as string, e.g. "0.022125"
        priceStatus?: string;            // e.g. "Final"
        priceComponents?: Array<{
          component?: string;            // e.g. "cld", "mec", "mgcc"
          intervalPrice?: string;
          priceType?: string;            // e.g. "distribution", "generation"
        }>;
        [key: string]: any;
      }>;
      [key: string]: any;
    }>;
    [key: string]: any;
  }>;
  
  // Legacy format support
  pricing?: Array<{
    hour: number;
    price: number;
    [key: string]: any;
  }>;
  
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

export const fetchPricingData = async (params: GridXParameters): Promise<HourlyPriceResponse[]> => {
  // Create a cache key that includes all the parameters
  const cacheKey = `pricing_${params.date}_${params.rateName}_${params.representativeCircuitId}_${params.cca}`;

  // Check if we have a valid cache entry
  if (cache[cacheKey] && (Date.now() - cache[cacheKey].timestamp.getTime()) < CACHE_EXPIRATION) {
    return cache[cacheKey].data;
  }

  try {
    // Format date for the API - should be in YYYYMMDD format
    const formattedDate = formatDateForGridXApi(params.date);
    
    // Set up request parameters and headers
    const requestParams = {
      ...DEFAULT_PARAMS,
      startdate: formattedDate,
      enddate: formattedDate,
      ratename: params.rateName,
      representativeCircuitId: params.representativeCircuitId,
      cca: params.cca
    };
    
    const headers = {
      'Accept': 'application/json'
    };
    
    console.log(`Making API request to ${GRIDX_API_URL} with params:`, requestParams);
    
    // Make the API request
    const response = await axios.get<GridXApiResponse>(GRIDX_API_URL, {
      params: requestParams,
      headers,
      timeout: 10000 // 10 second timeout for reliability
    });
    
    console.log('API response received with status:', response.status);
    
    // Initialize hourlyPrices array
    let hourlyPrices: HourlyPriceResponse[] = [];
    
    // Check if response contains data array
    if (response.data && response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
      console.log('Found data array in response');
      
      // Check for priceDetails in the first data item
      const dataItem = response.data.data[0];
      if (dataItem && dataItem.priceDetails && Array.isArray(dataItem.priceDetails)) {
        console.log(`Found priceDetails array with ${dataItem.priceDetails.length} entries`);
        
        // Map each price detail to our HourlyPriceResponse format
        hourlyPrices = dataItem.priceDetails.map((detail: any) => {
          // Extract hour from timestamp (format is "2025-03-29T00:00:00-0700")
          let hour = 0;
          
          if (detail.startIntervalTimeStamp) {
            const timestamp = detail.startIntervalTimeStamp;
            const timePart = timestamp.split('T')[1];
            if (timePart) {
              hour = parseInt(timePart.split(':')[0], 10);
            }
          }
          
          // Parse price from intervalPrice
          const price = parseFloat(detail.intervalPrice || '0');
          
          return {
            hour,
            price,
            isPeak: isPeakHour(hour)
          };
        });
        
        console.log(`Extracted ${hourlyPrices.length} price data points`);
        
        // If we have data, process it
        if (hourlyPrices.length > 0) {
          // Ensure we have 24 hours of data
          const completeData: HourlyPriceResponse[] = [];
          
          // Fill in any missing hours
          for (let h = 0; h < 24; h++) {
            const entry = hourlyPrices.find(p => p.hour === h);
            if (entry) {
              completeData.push(entry);
            } else {
              console.log(`Filling in missing hour: ${h}`);
              // Find closest hours for interpolation
              const before = [...hourlyPrices].filter(p => p.hour < h).sort((a, b) => b.hour - a.hour)[0];
              const after = [...hourlyPrices].filter(p => p.hour > h).sort((a, b) => a.hour - b.hour)[0];
              
              let price = 0;
              if (before && after) {
                // Interpolate between before and after
                price = before.price + ((after.price - before.price) / (after.hour - before.hour)) * (h - before.hour);
              } else if (before) {
                price = before.price;
              } else if (after) {
                price = after.price;
              } else {
                price = 0.01; // Fallback price if no reference points
              }
              
              completeData.push({
                hour: h,
                price,
                isPeak: isPeakHour(h)
              });
            }
          }
          
          // Sort by hour
          completeData.sort((a, b) => a.hour - b.hour);
          
          console.log('Successfully prepared 24 hours of pricing data');
          
          // Validate and cache the data
          const validatedData = hourlyPricesResponseSchema.parse(completeData);
          cache[cacheKey] = {
            data: validatedData,
            timestamp: new Date()
          };
          
          return validatedData;
        }
      } else {
        console.log('No priceDetails found in data item');
      }
    } else {
      console.log('No data array found in response');
    }
    
    // If we got here, we couldn't extract the data correctly
    console.error('Failed to extract price data from response');
    throw new Error('Could not extract valid pricing data from the API response');
    
  } catch (error) {
    console.error('Error fetching pricing data:', error);
    throw new Error('Failed to fetch pricing data from the API');
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
