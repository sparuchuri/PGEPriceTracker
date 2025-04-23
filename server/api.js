"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculatePricingSummary = exports.fetchPricingData = void 0;
var axios_1 = require("axios");
var schema_1 = require("@shared/schema");
var utils_1 = require("../client/src/lib/utils");
// GridX API endpoint with stage prefix
var GRIDX_API_URL = 'https://pge-pe-api.gridx.com/stage/v1/getPricing';
// Default parameters for Peninsula Clean Energy based on user requirements
var DEFAULT_PARAMS = {
    utility: 'PGE', // PG&E utility 
    cca: 'PCE', // Peninsula Clean Energy (PCE)
    ratename: 'EV2A', // EV2A electric vehicle rate
    program: 'CalFUSE', // California Flexible Unified Signal Extension
    market: 'DAM', // Day-Ahead Market
    representativeCircuitId: '013921103' // Default circuit ID
};
// Cache expiration in milliseconds (30 minutes)
var CACHE_EXPIRATION = 30 * 60 * 1000;
// In-memory cache
var cache = {};
// Generate realistic pricing data for a given date
// This function produces synthetic but realistic data patterns for electricity pricing
var generatePricingData = function (date) {
    console.log("Generating pricing data for ".concat(date));
    // Create a deterministic seed based on the date so the same date always returns the same data
    var seed = date.split('').reduce(function (acc, char) { return acc + char.charCodeAt(0); }, 0);
    // Simple pseudo-random number generator with seed
    var random = function (min, max) {
        var x = Math.sin(seed + 1) * 10000;
        return (x - Math.floor(x)) * (max - min) + min;
    };
    // Base prices for different periods of the day
    var basePrices = {
        overnight: 0.12, // 12-6am: lowest rates
        morning: 0.18, // 6-10am: rising demand
        midday: 0.22, // 10am-4pm: solar production keeps prices moderate
        evening: 0.38, // 4-9pm: peak demand
        night: 0.20 // 9pm-12am: declining demand
    };
    // Day of week adjustments (weekend vs weekday)
    var dateObj = new Date(date);
    var isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
    var weekendFactor = isWeekend ? 0.8 : 1.0; // 20% cheaper on weekends
    // Create 24 hours of pricing data
    var pricingData = [];
    for (var hour = 0; hour < 24; hour++) {
        var basePrice = void 0;
        // Determine time period
        if (hour >= 0 && hour < 6) {
            basePrice = basePrices.overnight;
        }
        else if (hour >= 6 && hour < 10) {
            basePrice = basePrices.morning;
        }
        else if (hour >= 10 && hour < 16) {
            basePrice = basePrices.midday;
        }
        else if (hour >= 16 && hour < 21) {
            basePrice = basePrices.evening;
        }
        else {
            basePrice = basePrices.night;
        }
        // Apply weekend adjustment
        basePrice *= weekendFactor;
        // Add up to 10% random variation
        var randomVariation = 1 + (random(0, 10) - 5) / 100;
        var price = +(basePrice * randomVariation).toFixed(5);
        pricingData.push({
            hour: hour,
            price: price,
            isPeak: (0, utils_1.isPeakHour)(hour)
        });
    }
    return schema_1.hourlyPricesResponseSchema.parse(pricingData);
};
/**
 * Converts a date string in ISO format (YYYY-MM-DD) to the format required by the GridX API (YYYYMMDD)
 */
var formatDateForGridXApi = function (dateString) {
    return dateString.replace(/-/g, '');
};
var fetchPricingData = function (params) { return __awaiter(void 0, void 0, void 0, function () {
    var cacheKey, formattedDate, requestParams, headers, response, hourlyPrices, dataItem, completeData, _loop_1, h, validatedData, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                cacheKey = "pricing_".concat(params.date, "_").concat(params.rateName, "_").concat(params.representativeCircuitId, "_").concat(params.cca);
                // Check if we have a valid cache entry
                if (cache[cacheKey] && (Date.now() - cache[cacheKey].timestamp.getTime()) < CACHE_EXPIRATION) {
                    return [2 /*return*/, cache[cacheKey].data];
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                formattedDate = formatDateForGridXApi(params.date);
                requestParams = __assign(__assign({}, DEFAULT_PARAMS), { startdate: formattedDate, enddate: formattedDate, ratename: params.rateName, representativeCircuitId: params.representativeCircuitId, cca: params.cca });
                headers = {
                    'Accept': 'application/json'
                };
                console.log("Making API request to ".concat(GRIDX_API_URL, " with params:"), requestParams);
                return [4 /*yield*/, axios_1.default.get(GRIDX_API_URL, {
                        params: requestParams,
                        headers: headers,
                        timeout: 10000 // 10 second timeout for reliability
                    })];
            case 2:
                response = _a.sent();
                console.log('API response received with status:', response.status);
                hourlyPrices = [];
                // Check if response contains data array
                if (response.data && response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
                    console.log('Found data array in response');
                    dataItem = response.data.data[0];
                    if (dataItem && dataItem.priceDetails && Array.isArray(dataItem.priceDetails)) {
                        console.log("Found priceDetails array with ".concat(dataItem.priceDetails.length, " entries"));
                        // Map each price detail to our HourlyPriceResponse format
                        hourlyPrices = dataItem.priceDetails.map(function (detail) {
                            // Extract hour from timestamp (format is "2025-03-29T00:00:00-0700")
                            var hour = 0;
                            if (detail.startIntervalTimeStamp) {
                                var timestamp = detail.startIntervalTimeStamp;
                                var timePart = timestamp.split('T')[1];
                                if (timePart) {
                                    hour = parseInt(timePart.split(':')[0], 10);
                                }
                            }
                            // Parse price from intervalPrice
                            var price = parseFloat(detail.intervalPrice || '0');
                            return {
                                hour: hour,
                                price: price,
                                isPeak: (0, utils_1.isPeakHour)(hour)
                            };
                        });
                        console.log("Extracted ".concat(hourlyPrices.length, " price data points"));
                        // If we have data, process it
                        if (hourlyPrices.length > 0) {
                            completeData = [];
                            _loop_1 = function (h) {
                                var entry = hourlyPrices.find(function (p) { return p.hour === h; });
                                if (entry) {
                                    completeData.push(entry);
                                }
                                else {
                                    console.log("Filling in missing hour: ".concat(h));
                                    // Find closest hours for interpolation
                                    var before = __spreadArray([], hourlyPrices, true).filter(function (p) { return p.hour < h; }).sort(function (a, b) { return b.hour - a.hour; })[0];
                                    var after = __spreadArray([], hourlyPrices, true).filter(function (p) { return p.hour > h; }).sort(function (a, b) { return a.hour - b.hour; })[0];
                                    var price = 0;
                                    if (before && after) {
                                        // Interpolate between before and after
                                        price = before.price + ((after.price - before.price) / (after.hour - before.hour)) * (h - before.hour);
                                    }
                                    else if (before) {
                                        price = before.price;
                                    }
                                    else if (after) {
                                        price = after.price;
                                    }
                                    else {
                                        price = 0.01; // Fallback price if no reference points
                                    }
                                    completeData.push({
                                        hour: h,
                                        price: price,
                                        isPeak: (0, utils_1.isPeakHour)(h)
                                    });
                                }
                            };
                            // Fill in any missing hours
                            for (h = 0; h < 24; h++) {
                                _loop_1(h);
                            }
                            // Sort by hour
                            completeData.sort(function (a, b) { return a.hour - b.hour; });
                            console.log('Successfully prepared 24 hours of pricing data');
                            validatedData = schema_1.hourlyPricesResponseSchema.parse(completeData);
                            cache[cacheKey] = {
                                data: validatedData,
                                timestamp: new Date()
                            };
                            return [2 /*return*/, validatedData];
                        }
                    }
                    else {
                        console.log('No priceDetails found in data item');
                    }
                }
                else {
                    console.log('No data array found in response');
                }
                // If we got here, we couldn't extract the data correctly
                console.error('Failed to extract price data from response');
                throw new Error('Could not extract valid pricing data from the API response');
            case 3:
                error_1 = _a.sent();
                console.error('Error fetching pricing data:', error_1);
                throw new Error('Failed to fetch pricing data from the API');
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.fetchPricingData = fetchPricingData;
var calculatePricingSummary = function (priceData) {
    if (!priceData || priceData.length === 0) {
        return { average: 0, peak: 0, offPeak: 0 };
    }
    var allPrices = priceData.map(function (item) { return item.price; });
    var peakPrices = priceData.filter(function (item) { return (0, utils_1.isPeakHour)(item.hour); }).map(function (item) { return item.price; });
    var offPeakPrices = priceData.filter(function (item) { return !(0, utils_1.isPeakHour)(item.hour); }).map(function (item) { return item.price; });
    var average = function (arr) {
        return arr.length ? arr.reduce(function (sum, val) { return sum + val; }, 0) / arr.length : 0;
    };
    var summary = {
        average: average(allPrices),
        peak: average(peakPrices),
        offPeak: average(offPeakPrices)
    };
    return schema_1.pricingSummarySchema.parse(summary);
};
exports.calculatePricingSummary = calculatePricingSummary;
