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
      
      // Extract pricing data from response - handle the new complex structure
      let hourlyPrices: HourlyPriceResponse[] = [];
      
      // Check if the response contains data in the expected format
      if (response.data && response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
        console.log('Found data in GridX API response');
        
        // Attempt to extract pricing info from the new API format
        try {
          // Extract all pricing intervals from all days in the response
          const allIntervals: any[] = [];
          
          // Navigate through the nested structure to find intervals
          response.data.data.forEach(dataItem => {
            if (dataItem.pricingInfo && Array.isArray(dataItem.pricingInfo)) {
              dataItem.pricingInfo.forEach(pricingInfo => {
                if (pricingInfo.intervals && Array.isArray(pricingInfo.intervals)) {
                  allIntervals.push(...pricingInfo.intervals);
                }
              });
            }
          });
          
          console.log(`Found ${allIntervals.length} pricing intervals in API response`);
          
          if (allIntervals.length > 0) {
            hourlyPrices = allIntervals.map((interval, index) => {
              // Parse the timestamp to extract the hour
              const timestamp = interval.startIntervalTimeStamp;
              let hour = index; // Default to index if we can't parse the timestamp
              
              if (timestamp && typeof timestamp === 'string') {
                const date = new Date(timestamp);
                if (!isNaN(date.getTime())) {
                  hour = date.getHours();
                }
              }
              
              // Parse the price, defaulting to a random value if not available
              const price = interval.intervalPrice ? parseFloat(interval.intervalPrice) : Math.random() * 0.3;
              
              return {
                hour,
                price,
                isPeak: isPeakHour(hour)
              };
            });
            
            console.log(`Successfully extracted ${hourlyPrices.length} hours of pricing data from API`);
          }
        } catch (parseError) {
          console.error('Error parsing API response:', parseError);
        }
      }
      
      // If we successfully extracted pricing data
      if (hourlyPrices.length > 0) {
        // Sort by hour
        hourlyPrices.sort((a, b) => a.hour - b.hour);
        
        // Make sure we have exactly 24 hours by filling in any missing hours
        const completeHourlyPrices: HourlyPriceResponse[] = [];
        for (let hour = 0; hour < 24; hour++) {
          const existingEntry = hourlyPrices.find(entry => entry.hour === hour);
          if (existingEntry) {
            completeHourlyPrices.push(existingEntry);
          } else {
            // If we're missing an hour, interpolate or use a reasonable default
            const prevHour = hourlyPrices.find(entry => entry.hour < hour);
            const nextHour = hourlyPrices.find(entry => entry.hour > hour);
            let price;
            
            if (prevHour && nextHour) {
              // Interpolate between previous and next hours
              price = prevHour.price + (nextHour.price - prevHour.price) / (nextHour.hour - prevHour.hour) * (hour - prevHour.hour);
            } else if (prevHour) {
              price = prevHour.price;
            } else if (nextHour) {
              price = nextHour.price;
            } else {
              // Fallback to a reasonable default based on time of day
              price = isPeakHour(hour) ? 0.35 : 0.20;
            }
            
            completeHourlyPrices.push({
              hour,
              price,
              isPeak: isPeakHour(hour)
            });
          }
        }
        
        // Validate response
        const validatedData = hourlyPricesResponseSchema.parse(completeHourlyPrices);
        
        // Store in cache
        cache[cacheKey] = {
          data: validatedData,
          timestamp: new Date()
        };
        
        return validatedData;
      } else {
        console.log('Could not extract pricing data from API response. Response structure:', 
          JSON.stringify(Object.keys(response.data), null, 2));
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
