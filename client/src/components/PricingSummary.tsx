import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PricingSummary as PricingSummaryType } from "@shared/schema";
import { formatPrice, formatPercentage } from "@/lib/utils";
import { TrendingDown, TrendingUp, BarChart3 } from "lucide-react";

interface PricingSummaryProps {
  summary: PricingSummaryType;
}

const PricingSummary: React.FC<PricingSummaryProps> = ({ summary }) => {
  const { average, peak, offPeak } = summary;

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <h2 className="text-lg font-medium mb-4">Price Summary</h2>
        
        <div className="space-y-4">
          {/* Average Price */}
          <div className="flex justify-between items-center pb-2 border-b border-neutral-medium">
            <div>
              <p className="text-muted-foreground text-sm">Daily Average</p>
              <p className="text-2xl font-medium">{formatPrice(average)}</p>
            </div>
            <BarChart3 className="text-accent h-6 w-6" />
          </div>
          
          {/* Peak Price */}
          <div className="flex justify-between items-center pb-2 border-b border-neutral-medium">
            <div>
              <p className="text-muted-foreground text-sm">Peak (4pm-9pm)</p>
              <div className="flex items-end">
                <p className="text-xl font-medium">{formatPrice(peak)}</p>
                <span className="text-error text-sm ml-1">{formatPercentage(average, peak)}</span>
              </div>
            </div>
            <TrendingUp className="text-error h-6 w-6" />
          </div>
          
          {/* Off-Peak Price */}
          <div className="flex justify-between items-center">
            <div>
              <p className="text-muted-foreground text-sm">Off-Peak</p>
              <div className="flex items-end">
                <p className="text-xl font-medium">{formatPrice(offPeak)}</p>
                <span className="text-success text-sm ml-1">{formatPercentage(average, offPeak)}</span>
              </div>
            </div>
            <TrendingDown className="text-success h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PricingSummary;
