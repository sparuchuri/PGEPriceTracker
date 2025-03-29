import React, { useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import Chart from "chart.js/auto";
import { HourlyPriceResponse } from "@shared/schema";
import { formatPrice, isPeakHour, getPriceColor, LOW_PRICE_THRESHOLD, HIGH_PRICE_THRESHOLD } from "@/lib/utils";

interface PriceChartProps {
  priceData: HourlyPriceResponse[];
  showPeakPeriods: boolean;
  ratePlan?: string;
  circuitId?: string;
}

// This plugin will draw colored line segments
const createColoredSegmentPlugin = (prices: number[]) => {
  return {
    id: 'coloredLines',
    beforeDraw: (chart: any) => {
      const ctx = chart.ctx;
      const chartArea = chart.chartArea;
      const meta = chart.getDatasetMeta(0);
      
      // Only proceed if we have at least 2 points
      if (meta.data.length < 2) return;
      
      // Draw colored line segments
      for (let i = 0; i < meta.data.length - 1; i++) {
        const currentPrice = prices[i];
        const nextPrice = prices[i + 1];
        
        // Use the color of the higher price point for the segment
        const color = nextPrice > currentPrice 
          ? getPriceColor(nextPrice) 
          : getPriceColor(currentPrice);
        
        const current = meta.data[i];
        const next = meta.data[i + 1];
        
        // Draw line segment
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(current.x, current.y);
        ctx.lineTo(next.x, next.y);
        ctx.lineWidth = 3;
        ctx.strokeStyle = color;
        ctx.stroke();
        ctx.restore();
      }
    }
  };
};

const PriceChart: React.FC<PriceChartProps> = ({ 
  priceData, 
  showPeakPeriods, 
  ratePlan = "EV2A", 
  circuitId = "013921103" 
}) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (chartRef.current && priceData.length > 0) {
      // Destroy previous chart if it exists
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const hours = priceData.map((item: HourlyPriceResponse) => item.hour);
      const prices = priceData.map((item: HourlyPriceResponse) => item.price);
      
      // Define peak and off-peak background colors
      const backgroundColors = hours.map((hour: number) => 
        isPeakHour(hour) ? 'rgba(255, 152, 0, 0.2)' : 'rgba(25, 118, 210, 0.1)'
      );

      const ctx = chartRef.current.getContext('2d');
      
      if (ctx) {
        // Create a single dataset for the points
        const datasets = [
          {
            label: `Peninsula Clean Energy (PCE) - ${ratePlan} Rate - Circuit ID: ${circuitId}`,
            data: prices,
            // Use a very light line that will be visually replaced by our custom plugin
            borderColor: 'rgba(200, 200, 200, 0.2)',
            backgroundColor: showPeakPeriods ? backgroundColors : 'rgba(200, 200, 200, 0.1)',
            borderWidth: 1,
            tension: 0.2,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointBackgroundColor: prices.map((price: number) => getPriceColor(price)),
            pointBorderColor: 'white',
            pointBorderWidth: 1
          }
        ];

        // Create a custom plugin to draw the colored line segments
        const coloredLinePlugin = createColoredSegmentPlugin(prices);
        
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
            devicePixelRatio: 2, // Higher resolution for sharper display on mobile
            scales: {
              x: {
                title: {
                  display: true,
                  text: 'Hour of Day',
                  color: 'hsl(var(--foreground))',
                  font: {
                    size: window.innerWidth < 640 ? 10 : 12
                  }
                },
                grid: {
                  display: false
                },
                ticks: {
                  color: 'hsl(var(--foreground))',
                  font: {
                    size: window.innerWidth < 640 ? 9 : 11
                  },
                  maxRotation: 0, // Prevent rotation on mobile
                  autoSkip: true,
                  autoSkipPadding: 20,
                  callback: function(value, index) {
                    // On mobile, show fewer ticks to avoid overcrowding
                    if (window.innerWidth < 640) {
                      return index % 3 === 0 ? value : '';
                    }
                    return value;
                  }
                }
              },
              y: {
                title: {
                  display: true,
                  text: 'Price ($/kWh)',
                  color: 'hsl(var(--foreground))',
                  font: {
                    size: window.innerWidth < 640 ? 10 : 12
                  }
                },
                ticks: {
                  callback: function(value) {
                    return formatPrice(value as number);
                  },
                  color: 'hsl(var(--foreground))',
                  font: {
                    size: window.innerWidth < 640 ? 9 : 11
                  },
                  maxTicksLimit: window.innerWidth < 640 ? 5 : 8 // Fewer ticks on mobile
                },
                beginAtZero: true
              }
            },
            plugins: {
              legend: {
                display: false // Hide the auto-generated legend
              },
              tooltip: {
                enabled: true,
                usePointStyle: true,
                displayColors: false,
                titleFont: {
                  size: window.innerWidth < 640 ? 11 : 13,
                  weight: 'bold'
                },
                bodyFont: {
                  size: window.innerWidth < 640 ? 10 : 12
                },
                padding: window.innerWidth < 640 ? 6 : 10,
                callbacks: {
                  label: function(context) {
                    const price = context.raw as number;
                    return `${formatPrice(price)} per kWh`;
                  },
                  title: function(context) {
                    const hour = parseInt(context[0].label as string);
                    return window.innerWidth < 640 
                      ? `${hour}:00 - ${(hour+1) % 24}:00` 
                      : `Hour: ${hour}:00 - ${(hour+1) % 24}:00`;
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
          },
          plugins: [coloredLinePlugin] // Register our custom plugin
        });
      }
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [priceData, showPeakPeriods, ratePlan, circuitId]);

  return (
    <Card className="h-full">
      <CardContent className="p-3 sm:p-4">
        {/* Responsive title with circuit ID on second line for mobile */}
        <h2 className="text-base sm:text-xl font-semibold mb-1 sm:mb-2 leading-tight">Peninsula Clean Energy - {ratePlan} Rate</h2>
        <h3 className="text-sm sm:text-lg font-medium mb-3 sm:mb-4 text-muted-foreground leading-tight">Circuit ID: {circuitId} - Hourly Pricing</h3>
        
        {/* Chart Container - adjust height for different screen sizes */}
        <div className="h-64 sm:h-72 md:h-80 relative">
          <canvas ref={chartRef} id="pricing-chart"></canvas>
        </div>
        
        {/* Legend - improve mobile layout */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mt-3 sm:mt-4 text-center">
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-1 sm:mr-2"></span>
            <span className="text-xs sm:text-sm">Low (&lt;2¢)</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 rounded-full bg-yellow-500 mr-1 sm:mr-2"></span>
            <span className="text-xs sm:text-sm">Medium (2-6¢)</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-1 sm:mr-2"></span>
            <span className="text-xs sm:text-sm">High (&gt;6¢)</span>
          </div>
          {showPeakPeriods && (
            <>
              <div className="flex items-center">
                <span className="inline-block w-8 sm:w-10 h-3 bg-orange-100 mr-1 sm:mr-2"></span>
                <span className="text-xs sm:text-sm">Peak</span>
              </div>
              <div className="flex items-center">
                <span className="inline-block w-8 sm:w-10 h-3 bg-blue-100 mr-1 sm:mr-2"></span>
                <span className="text-xs sm:text-sm">Off-Peak</span>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PriceChart;
