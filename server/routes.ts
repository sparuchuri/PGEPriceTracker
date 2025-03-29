import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { fetchPricingData, calculatePricingSummary } from "./api";
import { hourlyPricesResponseSchema, pricingSummarySchema, gridXParametersSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Define API routes with /api prefix
  
  // GET route for fetching hourly price data
  app.get("/api/pricing", async (req: Request, res: Response) => {
    try {
      // Parse and validate query parameters
      const paramsSchema = gridXParametersSchema.extend({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
      });
      
      // Convert query parameters to string type to match schema
      const queryParams = {
        date: req.query.date as string,
        rateName: req.query.rateName as string,
        representativeCircuitId: req.query.representativeCircuitId as string,
        cca: req.query.cca as string
      };
      
      // Parse and validate parameters with defaults
      const params = paramsSchema.parse(queryParams);
      
      // Fetch pricing data from GridX API
      const pricingData = await fetchPricingData(params);
      
      res.json(pricingData);
    } catch (error) {
      console.error("Error fetching pricing data:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid request parameters. Date must be in YYYY-MM-DD format. Optional parameters include rateName, representativeCircuitId, and cca."
        });
      }
      
      if (error instanceof Error) {
        return res.status(500).json({ message: error.message });
      }
      
      res.status(500).json({ message: "An unexpected error occurred while fetching pricing data" });
    }
  });

  // GET route for fetching pricing summary
  app.get("/api/pricing/summary", async (req: Request, res: Response) => {
    try {
      // Parse and validate query parameters
      const paramsSchema = gridXParametersSchema.extend({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
      });
      
      // Convert query parameters to string type to match schema
      const queryParams = {
        date: req.query.date as string,
        rateName: req.query.rateName as string,
        representativeCircuitId: req.query.representativeCircuitId as string,
        cca: req.query.cca as string
      };
      
      // Parse and validate parameters with defaults
      const params = paramsSchema.parse(queryParams);
      
      // Fetch pricing data from GridX API
      const pricingData = await fetchPricingData(params);
      
      // Calculate summary statistics
      const summary = calculatePricingSummary(pricingData);
      
      res.json(summary);
    } catch (error) {
      console.error("Error calculating pricing summary:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid request parameters. Date must be in YYYY-MM-DD format. Optional parameters include rateName, representativeCircuitId, and cca."
        });
      }
      
      if (error instanceof Error) {
        return res.status(500).json({ message: error.message });
      }
      
      res.status(500).json({ message: "An unexpected error occurred while calculating pricing summary" });
    }
  });

  // Create and return the HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
