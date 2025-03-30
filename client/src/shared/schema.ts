import { pgTable, text, serial, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Price data schema
export const hourlyPrices = pgTable("hourly_prices", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  hour: integer("hour").notNull(),
  price: decimal("price", { precision: 10, scale: 6 }).notNull(),
  isPeak: boolean("is_peak").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertHourlyPriceSchema = createInsertSchema(hourlyPrices).pick({
  date: true,
  hour: true,
  price: true,
  isPeak: true,
});

export const gridXParametersSchema = z.object({
  date: z.string(),
  rateName: z.string().default("EV2A"),
  representativeCircuitId: z.string().default("013921103"),
  cca: z.string().default("PCE"),
});

export const hourlyPriceResponseSchema = z.object({
  hour: z.number(),
  price: z.number(),
  isPeak: z.boolean(),
});

export const hourlyPricesResponseSchema = z.array(hourlyPriceResponseSchema);

export const pricingSummarySchema = z.object({
  average: z.number(),
  peak: z.number(),
  offPeak: z.number(),
});

export type InsertHourlyPrice = z.infer<typeof insertHourlyPriceSchema>;
export type HourlyPrice = typeof hourlyPrices.$inferSelect;
export type HourlyPriceResponse = z.infer<typeof hourlyPriceResponseSchema>;
export type PricingSummary = z.infer<typeof pricingSummarySchema>;
export type GridXParameters = z.infer<typeof gridXParametersSchema>;
