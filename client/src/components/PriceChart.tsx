import React, { useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import Chart from "chart.js/auto";
import { HourlyPriceResponse } from "@shared/schema";
import { formatPrice, isPeakHour } from "@/lib/utils";

interface PriceChartProps {
  priceData: HourlyPriceResponse[];
  showPeakPeriods: boolean;
}

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
        // Create chart
        chartInstance.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels: hours.map(h => `${h}:00`),
            datasets: [{
              label: 'Price ($/kWh)',
              data: prices,
              borderColor: 'hsl(var(--primary))',
              backgroundColor: showPeakPeriods ? backgroundColors : 'hsla(var(--primary), 0.1)',
              borderWidth: 2,
              tension: 0.2,
              pointBackgroundColor: 'hsl(var(--primary))',
              pointRadius: 3,
              pointHoverRadius: 5
            }]
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
                    return isPeakHour(hour) ? 'Peak Period' : 'Off-Peak Period';
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
        <h2 className="text-lg font-medium mb-4">Hourly Electricity Pricing</h2>
        
        {/* Chart Container */}
        <div className="h-80 relative">
          <canvas ref={chartRef} id="pricing-chart"></canvas>
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-4 mt-4">
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 rounded-full bg-primary mr-2"></span>
            <span className="text-sm">Price ($/kWh)</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 rounded-full bg-accent/50 mr-2"></span>
            <span className="text-sm">Peak Periods</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 rounded-full bg-primary/20 mr-2"></span>
            <span className="text-sm">Off-Peak Periods</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PriceChart;
