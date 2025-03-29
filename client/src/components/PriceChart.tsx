import React, { useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import Chart from "chart.js/auto";
import { HourlyPriceResponse } from "@shared/schema";
import { formatPrice, isPeakHour } from "@/lib/utils";

interface PriceChartProps {
  priceData: HourlyPriceResponse[];
  showPeakPeriods: boolean;
}

// Price thresholds for color coding (in dollars per kWh)
const LOW_PRICE_THRESHOLD = 0.02;   // 2 cents
const HIGH_PRICE_THRESHOLD = 0.06;  // 6 cents

// Line color based on price
const getLineColor = (price: number): string => {
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

const PriceChart: React.FC<PriceChartProps> = ({ priceData, showPeakPeriods }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (chartRef.current && priceData.length > 0) {
      // Destroy previous chart if it exists
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const hours = priceData.map(item => item.hour);
      const prices = priceData.map(item => item.price);
      
      // Define peak and off-peak background colors
      const backgroundColors = hours.map(hour => 
        isPeakHour(hour) ? 'rgba(255, 152, 0, 0.2)' : 'rgba(25, 118, 210, 0.1)'
      );

      const ctx = chartRef.current.getContext('2d');
      
      if (ctx) {
        // Create datasets for main data points
        const datasets = [
          {
            label: 'Peninsula Clean Energy (PCE) - EV2A Rate - Circuit ID: 013921103',
            data: prices,
            borderColor: 'rgba(0, 0, 0, 0.5)', // Base color for the line
            backgroundColor: showPeakPeriods ? backgroundColors : 'hsla(var(--primary), 0.1)',
            borderWidth: 3,
            tension: 0.2,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointBackgroundColor: prices.map(price => getLineColor(price)),
            pointBorderColor: 'white',
            pointBorderWidth: 1
          }
        ];

        // Create chart
        chartInstance.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels: hours.map(h => `${h}:00`),
            datasets
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: {
                title: {
                  display: true,
                  text: 'Hour of Day',
                  color: 'hsl(var(--foreground))'
                },
                grid: {
                  display: false
                },
                ticks: {
                  color: 'hsl(var(--foreground))'
                }
              },
              y: {
                title: {
                  display: true,
                  text: 'Price ($/kWh)',
                  color: 'hsl(var(--foreground))'
                },
                ticks: {
                  callback: function(value) {
                    return formatPrice(value as number);
                  },
                  color: 'hsl(var(--foreground))'
                },
                beginAtZero: true
              }
            },
            plugins: {
              legend: {
                display: false // Hide the auto-generated legend
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    const price = context.raw as number;
                    return `Price: ${formatPrice(price)} per kWh`;
                  },
                  title: function(context) {
                    const hour = parseInt(context[0].label as string);
                    return `Hour: ${hour}:00 - ${(hour+1) % 24}:00`;
                  },
                  afterLabel: function(context) {
                    const hour = parseInt(context.label as string);
                    const price = context.raw as number;
                    let priceCategory = "";
                    
                    if (price < LOW_PRICE_THRESHOLD) {
                      priceCategory = "Low Price";
                    } else if (price >= HIGH_PRICE_THRESHOLD) {
                      priceCategory = "High Price";
                    } else {
                      priceCategory = "Medium Price";
                    }
                    
                    return [
                      priceCategory,
                      isPeakHour(hour) ? 'Peak Period' : 'Off-Peak Period'
                    ];
                  }
                }
              }
            }
          }
        });
      }
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [priceData, showPeakPeriods]);

  return (
    <Card className="h-full">
      <CardContent className="p-4">
        <h2 className="text-xl font-semibold mb-2">Peninsula Clean Energy - EV2A Rate</h2>
        <h3 className="text-lg font-medium mb-4">Circuit ID: 013921103 - Hourly Pricing</h3>
        
        {/* Chart Container */}
        <div className="h-80 relative">
          <canvas ref={chartRef} id="pricing-chart"></canvas>
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-4 mt-4">
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-2"></span>
            <span className="text-sm">Low Price (&lt;2¢/kWh)</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>
            <span className="text-sm">Medium Price (2-6¢/kWh)</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-2"></span>
            <span className="text-sm">High Price (&gt;6¢/kWh)</span>
          </div>
          {showPeakPeriods && (
            <>
              <div className="flex items-center">
                <span className="inline-block w-10 h-3 bg-orange-100 mr-2"></span>
                <span className="text-sm">Peak Period</span>
              </div>
              <div className="flex items-center">
                <span className="inline-block w-10 h-3 bg-blue-100 mr-2"></span>
                <span className="text-sm">Off-Peak Period</span>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PriceChart;
