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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogType = exports.HealthReport = void 0;
var axios_1 = __importDefault(require("axios"));
/**
 * Represents the type of log message for HealthReport.
 */
var LogType;
(function (LogType) {
    /**
     * Informational purposes; Signals the service is alive, along with a payload messsage.
     * Causes a 'ping' to the endpoint, using POST http method.
     * See https://healthchecks.io/docs/attaching_logs/
     */
    LogType[LogType["Information"] = 0] = "Information";
    /**
     * Signals a service error, along with the payload messsage.
     * Causes a 'ping' to the 'fail' endpoint, using POST http method.
     * See https://healthchecks.io/docs/signaling_failures/ and
     * https://healthchecks.io/docs/attaching_logs/
    */
    LogType[LogType["Error"] = 1] = "Error";
})(LogType || (exports.LogType = LogType = {}));
/**
 * Represents a Health Report class for monitoring health of an arbitrary service.
 * Meant to be used in conjuction with https://healthchecks.io/docs/, following
 * its simple schemas/endpoints.
 */
var HealthReport = /** @class */ (function () {
    /**
     * Creates a new HealthReport instance.
     * @param {URL} healthCheckURL - The URL of the monitoring service.
     * @param {number} pingIntervalInSeconds - The interval for ping in seconds.
     * @param {number} [pingTimeoutInMilliseconds=3000] - Maximum wait time for the alive/ping request to complete (default: 3000).
     * @param {number} [pingWithMessageTimoutInMilliseconds=5000] - Maximum wait time for ping with log requests to complete (default: 5000).
     */
    function HealthReport(healthCheckURL, pingIntervalInSeconds, pingTimeoutInMilliseconds, pingWithMessageTimoutInMilliseconds) {
        if (pingTimeoutInMilliseconds === void 0) { pingTimeoutInMilliseconds = 3000; }
        if (pingWithMessageTimoutInMilliseconds === void 0) { pingWithMessageTimoutInMilliseconds = 5000; }
        this.httpsModule = undefined;
        this.lastExecutionTime = new Date();
        this.pingTimeoutInMilliseconds = 3000;
        this.pingWithMessageTimoutInMilliseconds = 5000;
        this.healthCheckURL = healthCheckURL;
        this.pingIntervalInSeconds = pingIntervalInSeconds;
        // `${HEALTH_CHECK_URL}/fail`
        this.failPingURL = new URL(healthCheckURL.toString() + '/fail');
        this.pingTimeoutInMilliseconds = pingTimeoutInMilliseconds;
        this.pingWithMessageTimoutInMilliseconds = pingWithMessageTimoutInMilliseconds;
    }
    /**
     * Sends a simple alive signal / heart-beat to the monitoring system. Can
     * be called multiple times, but will only execute if enough time has passed since
     * the last call (as defined in pingIntervalInSeconds in the constructor).
     * @returns {Promise<void>} A Promise that resolves when the signal is sent.
     */
    HealthReport.prototype.sendAliveSignal = function () {
        return __awaiter(this, void 0, void 0, function () {
            var elapsedTime, response, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        elapsedTime = new Date().getTime() - this.lastExecutionTime.getTime();
                        if (!(!this.lastExecutionTime || elapsedTime / 1000 >= this.pingIntervalInSeconds)) return [3 /*break*/, 4];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.sendGetRequest(this.healthCheckURL)];
                    case 2:
                        response = _a.sent();
                        this.handleAliveSignalResponse(response);
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        this.handleAliveSignalError(error_1);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Posts log to the monitoring system.
     * If type is error, the message is sent to 'fail' ping endpoint.
     * Otherwise, a 'live' signal/heartbeat is sent with the given payload/message.
     * @param {string} message - The log message to be posted.
     * @param {LogType} logType - The type of log (Information or Error).
     * @returns {Promise<void>} A Promise that resolves when the log is posted.
     */
    HealthReport.prototype.postExternalLog = function (message, logType) {
        return __awaiter(this, void 0, void 0, function () {
            var postData, endpoint, response, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        postData = message;
                        endpoint = this.getEndpoint(logType);
                        return [4 /*yield*/, this.sendPostRequest(endpoint, postData)];
                    case 1:
                        response = _a.sent();
                        this.handlePostResponse(response);
                        return [3 /*break*/, 3];
                    case 2:
                        error_2 = _a.sent();
                        this.handlePostError(error_2);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    HealthReport.prototype.sendGetRequest = function (url) {
        return __awaiter(this, void 0, void 0, function () {
            var error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, axios_1.default.get(url.toString(), { timeout: this.pingTimeoutInMilliseconds })];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_3 = _a.sent();
                        throw new Error('Monitoring/alive ping failed: ' + error_3.message);
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    HealthReport.prototype.handleAliveSignalResponse = function (response) {
        if (response.status === 200) {
            this.lastExecutionTime = new Date();
        }
        else {
            console.log('Warning: Monitoring/alive ping failed with status code: ' + response.status);
        }
    };
    HealthReport.prototype.handleAliveSignalError = function (error) {
        console.log('Warning: Monitoring/alive ping failed: ' + error.message);
    };
    HealthReport.prototype.getEndpoint = function (logType) {
        return logType === LogType.Error ? this.failPingURL.toString() : this.healthCheckURL.toString();
    };
    HealthReport.prototype.sendPostRequest = function (endpoint, postData) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, axios_1.default.post(endpoint, postData, {
                                timeout: this.pingWithMessageTimoutInMilliseconds,
                                headers: {
                                    'Content-Type': 'text/plain',
                                    'Content-Length': Buffer.byteLength(postData).toString(),
                                },
                            })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response];
                    case 2:
                        error_4 = _a.sent();
                        throw new Error(error_4.message);
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    HealthReport.prototype.handlePostResponse = function (response) {
        if (response.status !== 200) {
            console.log("Warning: Failed to send error message to monitoring service. Response code: ".concat(response.status, " message: ").concat(response.statusText));
        }
        else {
            this.lastExecutionTime = new Date();
            if (process.env.NODE_ENV == "development") {
                console.log('Sent log to monitoring service.');
            }
        }
    };
    HealthReport.prototype.handlePostError = function (error) {
        console.log('Warning: Failed to send error message to monitoring service:', error.message);
    };
    return HealthReport;
}());
exports.HealthReport = HealthReport;
