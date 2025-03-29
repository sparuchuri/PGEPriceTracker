import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { HourlyPriceResponse, PricingSummary } from "@shared/schema";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Define peak hours (4pm-9pm, or 16-20 in 24hr format)
export const isPeakHour = (hour: number): boolean => hour >= 16 && hour <= 20;

// Price thresholds for color coding (in dollars per kWh)
export const LOW_PRICE_THRESHOLD = 0.02;   // 2 cents
export const HIGH_PRICE_THRESHOLD = 0.06;  // 6 cents

// Get color based on price
export const getPriceColor = (price: number): string => {
  if (price < LOW_PRICE_THRESHOLD) {
    return 'rgba(40, 167, 69, 1)';  // Green for low prices
  } else if (price >= HIGH_PRICE_THRESHOLD) {
    return 'rgba(220, 53, 69, 1)';  // Red for high prices
  } else {
    // Calculate a gradual transition from green to yellow to red
    if (price < (LOW_PRICE_THRESHOLD + HIGH_PRICE_THRESHOLD) / 2) {
      // Between green and yellow
      return 'rgba(255, 193, 7, 1)';  // Yellow for medium prices
    } else {
      // Between yellow and red
      return 'rgba(253, 126, 20, 1)';  // Orange for medium-high prices
    }
  }
};

// Format price for display with dollar sign and 3 decimal places
export const formatPrice = (price: number): string => {
  return `$${price.toFixed(3)}`;
};

// Format percentage difference
export const formatPercentage = (base: number, compare: number): string => {
  const diff = ((compare - base) / base) * 100;
  return `${diff > 0 ? '+' : ''}${diff.toFixed(0)}%`;
};

// Format date for display
export const formatDateForDisplay = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Format timestamp for display
export const formatTimestamp = (timestamp: Date): string => {
  return timestamp.toLocaleString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

// Calculate pricing summaries
export const calculatePricingSummary = (priceData: HourlyPriceResponse[]): PricingSummary => {
  if (!priceData || priceData.length === 0) {
    return { average: 0, peak: 0, offPeak: 0 };
  }

  const allPrices = priceData.map(item => item.price);
  const peakPrices = priceData.filter(item => isPeakHour(item.hour)).map(item => item.price);
  const offPeakPrices = priceData.filter(item => !isPeakHour(item.hour)).map(item => item.price);
  
  const average = (arr: number[]): number => 
    arr.length ? arr.reduce((sum, val) => sum + val, 0) / arr.length : 0;
  
  return {
    average: average(allPrices),
    peak: average(peakPrices),
    offPeak: average(offPeakPrices)
  };
};

// Format hour for display
export const formatHour = (hour: number): string => {
  const hourFormatted = hour % 12 || 12;
  const amPm = hour < 12 ? 'AM' : 'PM';
  return `${hourFormatted}${amPm}`;
};

// Get today's date in YYYY-MM-DD format
export const getTodayDate = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

// Parse API error message
export const parseErrorMessage = (error: any): string => {
  if (error?.message) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred. Please try again.';
};
