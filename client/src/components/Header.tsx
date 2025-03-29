import React from "react";

const Header: React.FC = () => {
  return (
    <header className="mb-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Peninsula Clean Energy Pricing</h1>
          <p className="text-muted-foreground">Hourly electricity pricing visualization for EV2A-S rate plan</p>
        </div>
        <div className="flex items-center space-x-1 bg-primary-light/10 px-3 py-1 rounded-full text-sm">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="text-primary h-4 w-4 mr-1"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
          <span className="text-primary">Data sourced from GridX API</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
