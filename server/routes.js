"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRoutes = registerRoutes;
var http_1 = require("http");
var api_1 = require("./api");
var schema_1 = require("@shared/schema");
var zod_1 = require("zod");
function registerRoutes(app) {
    return __awaiter(this, void 0, void 0, function () {
        var httpServer;
        var _this = this;
        return __generator(this, function (_a) {
            // Define API routes with /api prefix
            // GET route for fetching hourly price data
            app.get("/api/pricing", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var paramsSchema, queryParams, params, pricingData, error_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            paramsSchema = schema_1.gridXParametersSchema.extend({
                                date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
                            });
                            queryParams = {
                                date: req.query.date,
                                rateName: req.query.rateName,
                                representativeCircuitId: req.query.representativeCircuitId,
                                cca: req.query.cca
                            };
                            params = paramsSchema.parse(queryParams);
                            return [4 /*yield*/, (0, api_1.fetchPricingData)(params)];
                        case 1:
                            pricingData = _a.sent();
                            res.json(pricingData);
                            return [3 /*break*/, 3];
                        case 2:
                            error_1 = _a.sent();
                            console.error("Error fetching pricing data:", error_1);
                            if (error_1 instanceof zod_1.z.ZodError) {
                                return [2 /*return*/, res.status(400).json({
                                        message: "Invalid request parameters. Date must be in YYYY-MM-DD format. Optional parameters include rateName, representativeCircuitId, and cca."
                                    })];
                            }
                            if (error_1 instanceof Error) {
                                return [2 /*return*/, res.status(500).json({ message: error_1.message })];
                            }
                            res.status(500).json({ message: "An unexpected error occurred while fetching pricing data" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            // GET route for fetching pricing summary
            app.get("/api/pricing/summary", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var paramsSchema, queryParams, params, pricingData, summary, error_2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            paramsSchema = schema_1.gridXParametersSchema.extend({
                                date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
                            });
                            queryParams = {
                                date: req.query.date,
                                rateName: req.query.rateName,
                                representativeCircuitId: req.query.representativeCircuitId,
                                cca: req.query.cca
                            };
                            params = paramsSchema.parse(queryParams);
                            return [4 /*yield*/, (0, api_1.fetchPricingData)(params)];
                        case 1:
                            pricingData = _a.sent();
                            summary = (0, api_1.calculatePricingSummary)(pricingData);
                            res.json(summary);
                            return [3 /*break*/, 3];
                        case 2:
                            error_2 = _a.sent();
                            console.error("Error calculating pricing summary:", error_2);
                            if (error_2 instanceof zod_1.z.ZodError) {
                                return [2 /*return*/, res.status(400).json({
                                        message: "Invalid request parameters. Date must be in YYYY-MM-DD format. Optional parameters include rateName, representativeCircuitId, and cca."
                                    })];
                            }
                            if (error_2 instanceof Error) {
                                return [2 /*return*/, res.status(500).json({ message: error_2.message })];
                            }
                            res.status(500).json({ message: "An unexpected error occurred while calculating pricing summary" });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            httpServer = (0, http_1.createServer)(app);
            return [2 /*return*/, httpServer];
        });
    });
}
