import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Clock, ArrowRight, TrendingDown, Zap } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { HourlyPriceResponse } from "@shared/schema";

interface PriceAlertProps {
  priceData: HourlyPriceResponse[];
}

const PriceAlert: React.FC<PriceAlertProps> = ({ priceData }) => {
  // Return early if no price data
  if (!priceData || priceData.length === 0) {
    return null;
  }

  // Get current hour
  const now = new Date();
  const currentHour = now.getHours();
  
  // Find current hour's price data
  const currentPriceData = priceData.find(item => item.hour === currentHour);
  if (!currentPriceData) return null;
  
  // Find next hour's price data
  const nextHour = (currentHour + 1) % 24;
  const nextPriceData = priceData.find(item => item.hour === nextHour);
  if (!nextPriceData) return null;
  
  // Calculate price difference
  const priceDifference = nextPriceData.price - currentPriceData.price;
  const absoluteDifference = Math.abs(priceDifference);
  const percentChange = (priceDifference / currentPriceData.price) * 100;
  
  // Determine recommendation
  let recommendation = null;
  let variant = "default";
  
  if (priceDifference <= -0.01) {
    recommendation = (
      <div className="flex items-center gap-1 text-green-600 font-medium">
        <TrendingDown className="h-4 w-4" />
        <span>Recommendation: Wait until {nextHour}:00 to save {formatPrice(absoluteDifference)} per kWh</span>
      </div>
    );
    variant = "default";
  } else if (priceDifference >= 0.01) {
    recommendation = (
      <div className="flex items-center gap-1 text-amber-600 font-medium">
        <Zap className="h-4 w-4" />
        <span>Recommendation: Use electricity now before prices increase by {formatPrice(absoluteDifference)} per kWh</span>
      </div>
    );
    variant = "warning";
  }

  return (
    <Alert className="mb-4 border-l-4 border-primary" variant={variant as any}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <AlertTitle className="text-base flex items-center">
            <Clock className="h-4 w-4 mr-2" />
            Current Price ({currentHour}:00 - {(currentHour + 1) % 24}:00)
          </AlertTitle>
          <AlertDescription className="text-lg font-semibold text-primary">
            {formatPrice(currentPriceData.price)} per kWh
          </AlertDescription>
        </div>
        
        <div className="flex items-center text-muted-foreground sm:mx-2">
          <ArrowRight className="h-4 w-4" />
        </div>
        
        <div>
          <AlertTitle className="text-base flex items-center">
            <Clock className="h-4 w-4 mr-2" />
            Next Hour ({nextHour}:00 - {(nextHour + 1) % 24}:00)
          </AlertTitle>
          <AlertDescription className="text-lg font-semibold text-primary">
            {formatPrice(nextPriceData.price)} per kWh
            {priceDifference !== 0 && (
              <span className={`ml-2 text-sm font-normal ${priceDifference < 0 ? 'text-green-600' : 'text-red-600'}`}>
                {priceDifference < 0 ? '↓' : '↑'} {formatPrice(absoluteDifference)} 
                ({Math.abs(percentChange).toFixed(1)}%)
              </span>
            )}
          </AlertDescription>
        </div>
      </div>
      
      {recommendation && (
        <div className="mt-2 pt-2 border-t">
          {recommendation}
        </div>
      )}
    </Alert>
  );
};

export default PriceAlert;