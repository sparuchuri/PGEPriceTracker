
import { HourlyPriceResponse, PricingSummary } from '@shared/schema';
import axios from 'axios';

export const fetchPricingData = async (date: string): Promise<HourlyPriceResponse[]> => {
  const response = await axios.get(`/api/pricing`, {
    params: {
      date,
      rateName: 'EV2A',
      representativeCircuitId: '013921103',
      cca: 'PCE'
    }
  });
  return response.data;
};

export const calculatePricingSummary = async (date: string): Promise<PricingSummary> => {
  const response = await axios.get(`/api/pricing/summary`, {
    params: {
      date,
      rateName: 'EV2A',
      representativeCircuitId: '013921103',
      cca: 'PCE'
    }
  });
  return response.data;
};
