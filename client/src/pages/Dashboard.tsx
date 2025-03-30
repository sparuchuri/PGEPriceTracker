import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { HourlyPriceResponse, hourlyPricesResponseSchema, PricingSummary as PricingSummaryType, pricingSummarySchema } from "@shared/schema";
import { getTodayDate, parseErrorMessage } from "@/lib/utils";
import { fetchPricingData, calculatePricingSummary } from "@/services/gridXService";

// Components
import Header from "@/components/Header";
import ControlPanel from "@/components/ControlPanel";
import PriceChart from "@/components/PriceChart";
import PricingSummary from "@/components/PricingSummary";
import UsageTips from "@/components/UsageTips";
import LoadingIndicator from "@/components/LoadingIndicator";
import ErrorModal from "@/components/ErrorModal";
import PriceAlert from "@/components/PriceAlert";

const Dashboard: React.FC = () => {
  // State
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showPeakPeriods, setShowPeakPeriods] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [ratePlan, setRatePlan] = useState<string>("EV2A");
  const [circuitId, setCircuitId] = useState<string>("013921103");

  // Format date for API request
  const formattedDate = selectedDate.toISOString().split('T')[0];

  // Fetch pricing data
  const { 
    data: priceData, 
    isLoading: isPriceLoading, 
    error: priceError,
    refetch: refetchPriceData
  } = useQuery<HourlyPriceResponse[]>({
    queryKey: ['pricing', formattedDate, ratePlan, circuitId],
    queryFn: () => fetchPricingData(formattedDate, ratePlan, circuitId),
    enabled: !!(formattedDate && ratePlan && circuitId),
  });

  // Fetch summary data
  const summaryData = priceData ? calculatePricingSummary(priceData) : undefined;
  const isSummaryLoading = isPriceLoading;

  // Handle errors
  useEffect(() => {
    if (priceError) {
      setError(parseErrorMessage(priceError));
    } else {
      setError(null);
    }
  }, [priceError]);

  // Calculate summary locally if API doesn't return it
  const pricingSummary = summaryData || (priceData ? calculatePricingSummary(priceData) : { average: 0, peak: 0, offPeak: 0 });

  // Handle date change
  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  // Handle toggle peak periods
  const handleTogglePeakPeriods = (show: boolean) => {
    setShowPeakPeriods(show);
  };

  // Handle rate plan change
  const handleRatePlanChange = (plan: string) => {
    setRatePlan(plan);
  };

  // Handle circuit ID change
  const handleCircuitIdChange = (id: string) => {
    setCircuitId(id);
  };

  // Handle retry
  const handleRetry = () => {
    setError(null);
    refetchPriceData();
  };

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-6xl">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main>
        {/* Price Alert - Show current vs next hour with recommendation */}
        {priceData && priceData.length > 0 && 
          <PriceAlert priceData={priceData} />
        }
        
        {/* Responsive Layout - stacked on mobile, side-by-side on larger screens */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Chart Section - full width on mobile, 2/3 width on desktop */}
          <div className="lg:col-span-2 order-1">
            <PriceChart
              priceData={priceData || []}
              showPeakPeriods={showPeakPeriods}
              ratePlan={ratePlan}
              circuitId={circuitId}
            />
          </div>

          {/* Summary Cards - show in a row on mobile for small items */}
          <div className="space-y-4 sm:space-y-6 order-2">
            <PricingSummary summary={pricingSummary} />
            <UsageTips priceData={priceData || []} />
          </div>
        </div>
        
        {/* Controls Section - Now below the graph */}
        <div className="mt-6">
          <ControlPanel
            date={selectedDate}
            onDateChange={handleDateChange}
            showPeakPeriods={showPeakPeriods}
            onTogglePeakPeriods={handleTogglePeakPeriods}
            lastUpdated={priceData && priceData.length > 0 ? new Date() : null}
            ratePlan={ratePlan}
            onRatePlanChange={handleRatePlanChange}
            circuitId={circuitId}
            onCircuitIdChange={handleCircuitIdChange}
          />
        </div>

        {/* Loading Indicator */}
        <LoadingIndicator isLoading={isPriceLoading || isSummaryLoading} />

        {/* Error Modal */}
        <ErrorModal
          error={error}
          onClose={() => setError(null)}
          onRetry={handleRetry}
        />
      </main>
    </div>
  );
};

export default Dashboard;
