import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LightbulbIcon, Info, Clock, Zap, Flame, Battery, PhoneCharging } from "lucide-react";
import { HourlyPriceResponse } from "@shared/schema";
import { formatHour, LOW_PRICE_THRESHOLD, HIGH_PRICE_THRESHOLD } from "@/lib/utils";

interface UsageTipsProps {
  priceData: HourlyPriceResponse[];
}

const UsageTips: React.FC<UsageTipsProps> = ({ priceData }) => {
  if (!priceData || priceData.length === 0) {
    return null;
  }

  // Find the cheapest and most expensive hours
  const sortedByPrice = [...priceData].sort((a, b) => a.price - b.price);
  const cheapestHours = sortedByPrice.slice(0, 3);
  const mostExpensiveHours = sortedByPrice.slice(-3).reverse();

  // Find current best time to use electricity (within the next 6 hours)
  const now = new Date();
  const currentHour = now.getHours();
  const next6Hours = Array.from({ length: 6 }, (_, i) => (currentHour + i) % 24);
  const upcomingPrices = priceData.filter(item => next6Hours.includes(item.hour))
    .sort((a, b) => a.price - b.price);
  
  const bestTimeUpcoming = upcomingPrices.length > 0 ? upcomingPrices[0] : null;

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-xl">
          <LightbulbIcon className="h-5 w-5 mr-2 text-yellow-400" />
          Smart Usage Tips
        </CardTitle>
        <CardDescription>Optimize your electricity usage</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-2">
        {/* Best Time to Use Electricity */}
        <div className="space-y-2">
          <h3 className="font-medium flex items-center text-sm">
            <Clock className="h-4 w-4 mr-1 inline-block text-blue-500" />
            Best Times Today
          </h3>
          <ul className="text-sm space-y-1 ml-1">
            {cheapestHours.map(hour => (
              <li key={`cheap-${hour.hour}`} className="flex items-center">
                <span className="w-16 font-medium">{formatHour(hour.hour)}</span>
                <span className={`ml-2 ${hour.price < LOW_PRICE_THRESHOLD ? 'text-green-600' : 'text-slate-600'}`}>
                  ${hour.price.toFixed(4)}/kWh
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Times to Avoid */}
        <div className="space-y-2">
          <h3 className="font-medium flex items-center text-sm">
            <Flame className="h-4 w-4 mr-1 inline-block text-red-500" />
            Times to Avoid
          </h3>
          <ul className="text-sm space-y-1 ml-1">
            {mostExpensiveHours.map(hour => (
              <li key={`expensive-${hour.hour}`} className="flex items-center">
                <span className="w-16 font-medium">{formatHour(hour.hour)}</span>
                <span className={`ml-2 ${hour.price > HIGH_PRICE_THRESHOLD ? 'text-red-600' : 'text-slate-600'}`}>
                  ${hour.price.toFixed(4)}/kWh
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Recommended Activities */}
        <div className="space-y-2">
          <h3 className="font-medium flex items-center text-sm">
            <Zap className="h-4 w-4 mr-1 inline-block text-purple-500" />
            Recommendations
          </h3>
          <ul className="text-sm space-y-2">
            {bestTimeUpcoming && (
              <li className="flex items-start">
                <Battery className="h-4 w-4 mr-2 mt-0.5 text-green-500 shrink-0" />
                <span>
                  Best time to charge devices in next 6 hours: <strong>{formatHour(bestTimeUpcoming.hour)}</strong>
                </span>
              </li>
            )}
            {cheapestHours[0] && (
              <li className="flex items-start">
                <PhoneCharging className="h-4 w-4 mr-2 mt-0.5 text-blue-500 shrink-0" />
                <span>
                  Schedule high-energy tasks for {formatHour(cheapestHours[0].hour)} when rates are lowest
                </span>
              </li>
            )}
          </ul>
        </div>

        {/* General Tips */}
        <div>
          <h3 className="font-medium flex items-center text-sm">
            <Info className="h-4 w-4 mr-1 inline-block text-amber-500" />
            General Tips
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Avoid running multiple high-power appliances during peak hours (4-8 PM). Consider investing in smart plugs to automate usage during cheaper hours.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default UsageTips;