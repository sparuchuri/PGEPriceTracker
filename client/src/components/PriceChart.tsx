import React, { useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import Chart from "chart.js/auto";
import { HourlyPriceResponse } from "@shared/schema";
import { formatPrice, isPeakHour, getPriceColor, LOW_PRICE_THRESHOLD, HIGH_PRICE_THRESHOLD } from "@/lib/utils";

interface PriceChartProps {
  priceData: HourlyPriceResponse[];
  showPeakPeriods: boolean;
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

const PriceChart: React.FC<PriceChartProps> = ({ priceData, showPeakPeriods }) => {
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
            label: 'Peninsula Clean Energy (PCE) - EV2A Rate - Circuit ID: 013921103',
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
