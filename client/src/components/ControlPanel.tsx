import React from "react";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDateForDisplay, formatTimestamp } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface ControlPanelProps {
  date: Date;
  onDateChange: (date: Date) => void;
  showPeakPeriods: boolean;
  onTogglePeakPeriods: (show: boolean) => void;
  lastUpdated: Date | null;
  ratePlan: string;
  onRatePlanChange: (plan: string) => void;
  circuitId: string;
  onCircuitIdChange: (id: string) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  date,
  onDateChange,
  showPeakPeriods,
  onTogglePeakPeriods,
  lastUpdated,
  ratePlan,
  onRatePlanChange,
  circuitId,
  onCircuitIdChange
}) => {
  return (
    <Card className="mb-4 sm:mb-6">
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
          <h2 className="text-base sm:text-lg font-medium">Pricing Controls</h2>
          
          {lastUpdated && (
            <div className="flex items-center text-xs sm:text-sm bg-success/10 rounded-full px-2 py-1 sm:bg-transparent sm:px-0 sm:py-0">
              <span className="inline-block w-2 h-2 rounded-full bg-success mr-1 sm:mr-2"></span>
              <span>Updated: {formatTimestamp(lastUpdated)}</span>
            </div>
          )}
        </div>
        
        {/* More responsive grid - single column on mobile, multiple on larger screens */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Date Picker */}
          <div className="flex flex-col">
            <Label htmlFor="date-picker" className="mb-1 text-xs sm:text-sm font-medium text-neutral-dark">
              Select Date
            </Label>
            <DatePicker 
              date={date} 
              onDateChange={onDateChange} 
              className="w-full"
            />
          </div>
          
          {/* Peak Period Toggle - stacked on mobile, side by side on desktop */}
          <div className="flex flex-col">
            <Label htmlFor="toggle-peak-periods" className="mb-1 text-xs sm:text-sm font-medium text-neutral-dark">
              Display Options
            </Label>
            <div className="flex items-center space-x-2">
              <Switch 
                id="toggle-peak-periods"
                checked={showPeakPeriods}
                onCheckedChange={onTogglePeakPeriods}
              />
              <span className="text-xs sm:text-sm">Highlight Peak/Off-Peak Periods</span>
            </div>
          </div>
          
          {/* Rate Plan Selector */}
          <div className="flex flex-col">
            <Label htmlFor="rate-plan" className="mb-1 text-xs sm:text-sm font-medium text-neutral-dark">
              Rate Plan
            </Label>
            <div className="flex items-center space-x-2">
              <Select value={ratePlan} onValueChange={onRatePlanChange}>
                <SelectTrigger id="rate-plan" className="w-full">
                  <SelectValue placeholder="Select rate plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EV2A">EV2A (Standard)</SelectItem>
                  <SelectItem value="AG-A1">AG-A1</SelectItem>
                  <SelectItem value="AG-A2">AG-A2</SelectItem>
                  <SelectItem value="AGBP">AGBP</SelectItem>
                  <SelectItem value="AGBS">AGBS</SelectItem>
                  <SelectItem value="AGCP">AGCP</SelectItem>
                  <SelectItem value="AGCS">AGCS</SelectItem>
                  <SelectItem value="B6">B6</SelectItem>
                  <SelectItem value="B10P">B10P</SelectItem>
                  <SelectItem value="B10S">B10S</SelectItem>
                  <SelectItem value="B19P">B19P</SelectItem>
                  <SelectItem value="B19S">B19S</SelectItem>
                  <SelectItem value="B20P">B20P</SelectItem>
                  <SelectItem value="B20S">B20S</SelectItem>
                  <SelectItem value="EELEC">EELEC</SelectItem>
                  <SelectItem value="BEV1">BEV1</SelectItem>
                  <SelectItem value="BEV2P">BEV2P</SelectItem>
                  <SelectItem value="BEV2S">BEV2S</SelectItem>
                  <SelectItem value="EV2AS">EV2AS</SelectItem>
                </SelectContent>
              </Select>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="w-80 p-2">
                    <p className="font-medium mb-1">Rate Plan Options</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Select your Peninsula Clean Energy rate plan to see accurate pricing data. 
                      Plans include residential (EV2A, EV2AS, BEV1, BEV2P/S), agricultural (AG-A1/2, AGBP/S, AGCP/S), 
                      and business (B6, B10P/S, B19P/S, B20P/S, EELEC) rate options.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          
          {/* Circuit ID Input */}
          <div className="flex flex-col">
            <Label htmlFor="circuit-id" className="mb-1 text-xs sm:text-sm font-medium text-neutral-dark">
              Circuit ID
            </Label>
            <div className="flex items-center space-x-2">
              <Input 
                id="circuit-id"
                value={circuitId}
                onChange={(e) => onCircuitIdChange(e.target.value)}
                placeholder="Circuit ID (e.g., 013532223)"
                className="w-full"
              />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="w-64 p-2">
                    <p className="font-medium mb-1">Circuit Identifier</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Your circuit ID can be found on your PG&E bill or online account
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ControlPanel;
