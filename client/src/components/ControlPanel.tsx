import React from "react";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDateForDisplay, formatTimestamp } from "@/lib/utils";

interface ControlPanelProps {
  date: Date;
  onDateChange: (date: Date) => void;
  showPeakPeriods: boolean;
  onTogglePeakPeriods: (show: boolean) => void;
  lastUpdated: Date | null;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  date,
  onDateChange,
  showPeakPeriods,
  onTogglePeakPeriods,
  lastUpdated
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
          
          {/* Rate Plan Information */}
          <div className="flex flex-col">
            <Label className="mb-1 text-xs sm:text-sm font-medium text-neutral-dark">
              Rate Plan
            </Label>
            <div className="flex items-center space-x-2">
              <span className="bg-primary/10 text-primary px-2 py-1 sm:px-3 rounded-full text-xs sm:text-sm font-medium">
                EV2A-S
              </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="w-64 p-2">
                    <p className="font-medium mb-1">Peninsula Clean Energy EV2A-S</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Time-of-use rate plan designed for electric vehicle owners
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
