import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, Download } from "lucide-react";
import { HourlyPriceResponse } from "@shared/schema";

interface UsageTipsProps {
  priceData: HourlyPriceResponse[];
}

const UsageTips: React.FC<UsageTipsProps> = ({ priceData }) => {
  const handleDownload = () => {
    if (!priceData.length) return;

    // Create CSV content
    const headers = ['Hour', 'Price ($/kWh)', 'Peak Period'];
    const csvRows = [
      headers.join(','),
      ...priceData.map(item => [
        `${item.hour}:00`,
        item.price.toFixed(3),
        item.isPeak ? 'Yes' : 'No'
      ].join(','))
    ];
    const csvContent = csvRows.join('\n');
    
    // Create a blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'electricity_pricing_data.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card>
      <CardContent className="p-4">
        <h2 className="text-lg font-medium mb-4">Usage Tips</h2>
        
        <ul className="space-y-3">
          <li className="flex items-start">
            <div className="mr-2 flex-shrink-0 mt-0.5 bg-success/20 rounded-full p-1">
              <Check className="h-3 w-3 text-success" />
            </div>
            <span className="text-sm">Charge EVs and run appliances during off-peak hours (12am-4pm)</span>
          </li>
          <li className="flex items-start">
            <div className="mr-2 flex-shrink-0 mt-0.5 bg-success/20 rounded-full p-1">
              <Check className="h-3 w-3 text-success" />
            </div>
            <span className="text-sm">Lowest prices typically occur between 2am-6am</span>
          </li>
          <li className="flex items-start">
            <div className="mr-2 flex-shrink-0 mt-0.5 bg-error/20 rounded-full p-1">
              <X className="h-3 w-3 text-error" />
            </div>
            <span className="text-sm">Avoid high-energy consumption during peak hours (4pm-9pm)</span>
          </li>
        </ul>
        
        <Button 
          onClick={handleDownload}
          disabled={!priceData.length}
          className="mt-4 w-full"
        >
          <Download className="mr-1 h-4 w-4" />
          <span>Download Price Data</span>
        </Button>
      </CardContent>
    </Card>
  );
};

export default UsageTips;
